"""
FraudShield AI - BERT Text Fraud / Fake News Model Training
Datasets:
  - LIAR Dataset: https://www.cs.ucsb.edu/~william/data/liar_dataset.zip
  - FakeNewsNet: https://github.com/KaiDMML/FakeNewsNet
  - Spam SMS: https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset

Steps:
1. Download at least one dataset
2. Run this script to fine-tune BERT
3. Model saved to: ml/trained_models/bert_fraud/
"""

import os
import torch
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score, accuracy_score
from torch.utils.data import Dataset, DataLoader
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    AdamW,
    get_linear_schedule_with_warmup,
)
import warnings
warnings.filterwarnings("ignore")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_NAME = "bert-base-uncased"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "trained_models/bert_fraud")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"🖥️  Using device: {DEVICE}")


# ─── 1. DATASET CLASSES ──────────────────────────────────────────────────────

class FraudTextDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=256):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(self.labels[idx], dtype=torch.long),
        }


# ─── 2. DATA LOADERS ─────────────────────────────────────────────────────────

def load_liar_dataset(data_dir: str) -> pd.DataFrame:
    """Load LIAR dataset — 6 labels collapsed to binary (true/false)."""
    path = os.path.join(data_dir, "liar_dataset", "train.tsv")
    df = pd.read_csv(path, sep="\t", header=None,
                     names=["id", "label", "statement", "subject", "speaker",
                            "job", "state", "party", "barely_true", "false",
                            "half_true", "mostly_true", "pants_fire", "context"])
    
    # Collapse: true/mostly-true/half-true → 0 (safe), false/barely-true/pants-fire → 1 (fraud/fake)
    fake_labels = {"false", "barely-true", "pants-fire"}
    df["binary_label"] = df["label"].apply(lambda x: 1 if x in fake_labels else 0)
    df = df[["statement", "binary_label"]].rename(columns={"statement": "text", "binary_label": "label"})
    
    print(f"   LIAR dataset: {len(df)} rows | Fake rate: {df['label'].mean():.2%}")
    return df


def load_sms_spam_dataset(data_dir: str) -> pd.DataFrame:
    """Load SMS Spam Collection dataset."""
    path = os.path.join(data_dir, "spam.csv")
    df = pd.read_csv(path, encoding="latin-1")[["v1", "v2"]]
    df.columns = ["label_str", "text"]
    df["label"] = (df["label_str"] == "spam").astype(int)
    df = df[["text", "label"]]
    
    print(f"   SMS Spam: {len(df)} rows | Spam rate: {df['label'].mean():.2%}")
    return df


def load_synthetic_data() -> pd.DataFrame:
    """Generate synthetic labeled data for testing."""
    print("⚠️  Real datasets not found. Using synthetic data for demonstration.")
    
    fraud_texts = [
        "URGENT: Your account has been compromised. Verify immediately at http://bit.ly/secure",
        "Congratulations! You have won $1,000,000. Send $50 processing fee to claim your prize.",
        "Scientists discover that drinking bleach cures COVID-19, WHO confirms",
        "CLICK HERE NOW your password expires in 24 hours or you will lose access",
        "Breaking: Government hiding cure for cancer discovered by Dr. Smith",
        "You have been selected for FREE iPhone 14. Act now limited time offer click here",
        "Unusual login detected. Verify your identity immediately or account will be suspended",
        "Make $5000 per day from home. No experience needed. Limited spots available!",
        "Prince of Nigeria needs your help to transfer $45 million. 30% commission guaranteed",
        "Your computer has a virus! Call Microsoft support immediately at 1-800-FAKE",
    ] * 100

    safe_texts = [
        "The Federal Reserve raised interest rates by 0.25% at today's meeting.",
        "A new study published in Nature finds coffee consumption linked to longevity.",
        "The local city council approved a budget of $2.3 million for road repairs.",
        "Apple reported quarterly earnings of $90 billion, exceeding analyst expectations.",
        "Researchers at MIT developed a new battery technology with improved capacity.",
        "The weather forecast shows rain expected this weekend across the northeast.",
        "The library will be closed on Monday for the national holiday.",
        "Stock markets closed higher today led by technology sector gains.",
        "University applications for 2025 admissions are now open online.",
        "The national football team qualified for the World Cup after winning 3-1.",
    ] * 100

    texts = fraud_texts + safe_texts
    labels = [1] * len(fraud_texts) + [0] * len(safe_texts)
    
    df = pd.DataFrame({"text": texts, "label": labels}).sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"   Synthetic: {len(df)} rows | Fraud rate: {df['label'].mean():.2%}")
    return df


# ─── 3. TRAINING ─────────────────────────────────────────────────────────────

def train_bert(train_loader, val_loader, epochs=3, lr=2e-5):
    print(f"\n🤖 Loading BERT: {MODEL_NAME}")
    
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
    model = BertForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)
    model = model.to(DEVICE)
    
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=total_steps // 10,
        num_training_steps=total_steps,
    )
    
    best_f1 = 0
    best_model_state = None
    
    for epoch in range(epochs):
        # ── Training ──
        model.train()
        train_loss = 0
        for batch in train_loader:
            optimizer.zero_grad()
            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            labels = batch["labels"].to(DEVICE)
            
            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            train_loss += loss.item()
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
        
        avg_train_loss = train_loss / len(train_loader)
        
        # ── Validation ──
        model.eval()
        val_preds, val_true = [], []
        
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(DEVICE)
                attention_mask = batch["attention_mask"].to(DEVICE)
                labels = batch["labels"]
                
                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                preds = torch.argmax(outputs.logits, dim=1).cpu().numpy()
                
                val_preds.extend(preds)
                val_true.extend(labels.numpy())
        
        val_f1 = f1_score(val_true, val_preds)
        val_acc = accuracy_score(val_true, val_preds)
        
        print(f"  Epoch {epoch+1}/{epochs} | Loss: {avg_train_loss:.4f} | F1: {val_f1:.4f} | Acc: {val_acc:.4f}")
        
        if val_f1 > best_f1:
            best_f1 = val_f1
            best_model_state = model.state_dict().copy()
            print(f"    ✨ New best model saved (F1={val_f1:.4f})")
    
    # Restore best
    model.load_state_dict(best_model_state)
    return model, tokenizer, best_f1


# ─── 4. MAIN ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  FraudShield AI — BERT Text Fraud Model Training")
    print("=" * 60)
    
    # Load data
    data_dir = os.path.join(os.path.dirname(__file__), "../data")
    df = None
    
    for loader in [load_liar_dataset, load_sms_spam_dataset]:
        try:
            df = loader(data_dir)
            break
        except Exception:
            continue
    
    if df is None:
        df = load_synthetic_data()
    
    # Train/val split
    X_train, X_val, y_train, y_val = train_test_split(
        df["text"].tolist(), df["label"].tolist(),
        test_size=0.2, random_state=42, stratify=df["label"]
    )
    
    # Tokenizer & datasets
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
    
    train_ds = FraudTextDataset(X_train, y_train, tokenizer)
    val_ds = FraudTextDataset(X_val, y_val, tokenizer)
    
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=0)
    
    print(f"\n📋 Train: {len(X_train)} | Val: {len(X_val)}")
    print(f"   Batches per epoch: {len(train_loader)}")
    
    # Train
    model, tokenizer, best_f1 = train_bert(train_loader, val_loader, epochs=3, lr=2e-5)
    
    # Save
    print(f"\n💾 Saving BERT model to {OUTPUT_DIR}/")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    print(f"\n🎉 Training complete! Best F1: {best_f1:.4f}")
    print(f"   Model saved → {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
