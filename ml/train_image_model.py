"""
FraudShield AI - EfficientNet Image / Document Fraud Model Training
Datasets:
  - CIFAKE: https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images
  - Document Forgery: https://www.kaggle.com/datasets/sthabile/document-forgery-detection

Steps:
1. Download dataset from Kaggle
2. Organize as: data/images/real/ and data/images/fake/
3. Run this script to train EfficientNet-B4
4. Model saved to: ml/trained_models/efficientnet_fraud.pth
"""

import os
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import timm
from sklearn.metrics import classification_report, roc_auc_score, f1_score
import warnings
warnings.filterwarnings("ignore")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "trained_models")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"🖥️  Using device: {DEVICE}")

# Image size for EfficientNet-B4
IMG_SIZE = 380


# ─── 1. TRANSFORMS ───────────────────────────────────────────────────────────

TRAIN_TRANSFORMS = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

VAL_TRANSFORMS = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


# ─── 2. DATASET ──────────────────────────────────────────────────────────────

class FraudImageDataset(Dataset):
    """
    Expects directory structure:
        data/images/real/  → class 0 (safe)
        data/images/fake/  → class 1 (fraud)
    """
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        try:
            img = Image.open(self.image_paths[idx]).convert("RGB")
        except Exception:
            img = Image.new("RGB", (IMG_SIZE, IMG_SIZE), color=(128, 128, 128))
        
        if self.transform:
            img = self.transform(img)
        
        return img, torch.tensor(self.labels[idx], dtype=torch.long)


def load_image_dataset(data_dir: str):
    """Load real/fake images from directory."""
    real_dir = os.path.join(data_dir, "images", "real")
    fake_dir = os.path.join(data_dir, "images", "fake")
    
    paths, labels = [], []
    
    if not os.path.exists(real_dir) or not os.path.exists(fake_dir):
        raise FileNotFoundError("Image dataset not found")
    
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    
    for p in os.listdir(real_dir):
        if os.path.splitext(p)[1].lower() in exts:
            paths.append(os.path.join(real_dir, p))
            labels.append(0)
    
    for p in os.listdir(fake_dir):
        if os.path.splitext(p)[1].lower() in exts:
            paths.append(os.path.join(fake_dir, p))
            labels.append(1)
    
    print(f"   Images found: {len(paths)} | Real: {labels.count(0)} | Fake: {labels.count(1)}")
    return paths, labels


def create_synthetic_image_dataset(n=1000):
    """Generate synthetic PIL images for testing when dataset not available."""
    print("⚠️  Image dataset not found. Creating synthetic images for demonstration...")
    
    import tempfile
    tmpdir = tempfile.mkdtemp()
    paths, labels = [], []
    
    for i in range(n // 2):
        # "Real" images — uniform colors with some noise
        arr = np.random.randint(100, 200, (64, 64, 3), dtype=np.uint8)
        img = Image.fromarray(arr)
        p = os.path.join(tmpdir, f"real_{i}.png")
        img.save(p)
        paths.append(p)
        labels.append(0)
    
    for i in range(n // 2):
        # "Fake" images — noisy patterns
        arr = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
        img = Image.fromarray(arr)
        p = os.path.join(tmpdir, f"fake_{i}.png")
        img.save(p)
        paths.append(p)
        labels.append(1)
    
    print(f"   Synthetic images: {len(paths)}")
    return paths, labels


# ─── 3. MODEL ────────────────────────────────────────────────────────────────

def build_model(num_classes=2, pretrained=True):
    """Build EfficientNet-B4 with custom head for fraud detection."""
    model = timm.create_model("efficientnet_b4", pretrained=pretrained, num_classes=num_classes)
    
    # Freeze backbone layers initially for faster training
    for name, param in model.named_parameters():
        if "classifier" not in name:
            param.requires_grad = False
    
    print(f"   EfficientNet-B4 built | Trainable params: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
    return model


# ─── 4. TRAINING LOOP ────────────────────────────────────────────────────────

def train_efficientnet(train_loader, val_loader, epochs=10):
    model = build_model(pretrained=True).to(DEVICE)
    
    # Phase 1: Train only classifier (3 epochs)
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3
    )
    criterion = nn.CrossEntropyLoss(
        weight=torch.tensor([1.0, 2.0]).to(DEVICE)  # Upweight fraud class
    )
    
    best_f1 = 0
    best_state = None
    
    for epoch in range(epochs):
        # Unfreeze all layers after epoch 3 (fine-tuning)
        if epoch == 3:
            for param in model.parameters():
                param.requires_grad = True
            optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
            print("   🔓 All layers unfrozen for fine-tuning")
        
        # ── Train ──
        model.train()
        train_loss, correct, total = 0, 0, 0
        
        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
        
        train_acc = correct / total
        
        # ── Val ──
        model.eval()
        val_preds, val_true, val_probs = [], [], []
        
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(DEVICE)
                outputs = model(images)
                probs = torch.softmax(outputs, dim=1)[:, 1]
                preds = outputs.argmax(dim=1)
                
                val_preds.extend(preds.cpu().numpy())
                val_true.extend(labels.numpy())
                val_probs.extend(probs.cpu().numpy())
        
        val_f1 = f1_score(val_true, val_preds, zero_division=0)
        val_auc = roc_auc_score(val_true, val_probs)
        
        print(f"  Epoch {epoch+1:2d}/{epochs} | Loss: {train_loss/len(train_loader):.4f} | "
              f"Train Acc: {train_acc:.3f} | Val F1: {val_f1:.4f} | Val AUC: {val_auc:.4f}")
        
        if val_f1 > best_f1:
            best_f1 = val_f1
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            print(f"    ✨ New best model (F1={val_f1:.4f})")
    
    model.load_state_dict(best_state)
    return model, best_f1


# ─── 5. MAIN ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  FraudShield AI — EfficientNet Image Fraud Training")
    print("=" * 60)
    
    data_dir = os.path.join(os.path.dirname(__file__), "../data")
    
    try:
        paths, labels = load_image_dataset(data_dir)
    except FileNotFoundError:
        paths, labels = create_synthetic_image_dataset(n=2000)
    
    # Split
    from sklearn.model_selection import train_test_split
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        paths, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    train_ds = FraudImageDataset(train_paths, train_labels, TRAIN_TRANSFORMS)
    val_ds = FraudImageDataset(val_paths, val_labels, VAL_TRANSFORMS)
    
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=2, pin_memory=True)
    
    print(f"\n📋 Train: {len(train_ds)} | Val: {len(val_ds)}")
    
    # Train
    model, best_f1 = train_efficientnet(train_loader, val_loader, epochs=10)
    
    # Save
    out_path = os.path.join(OUTPUT_DIR, "efficientnet_fraud.pth")
    torch.save(model.state_dict(), out_path)
    
    print(f"\n🎉 Training complete! Best F1: {best_f1:.4f}")
    print(f"   Model saved → {out_path}")


if __name__ == "__main__":
    main()
