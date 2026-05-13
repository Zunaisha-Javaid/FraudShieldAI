"""
FraudShield AI - XGBoost Transaction Fraud Model Training
Dataset: IEEE-CIS Fraud Detection (Kaggle)

Steps:
1. Download dataset from Kaggle
2. Run this script to train & save model
3. Model saved to: ml/trained_models/xgboost_fraud.pkl
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, f1_score
import xgboost as xgb
import lightgbm as lgb
import warnings
warnings.filterwarnings("ignore")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "trained_models")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─── 1. LOAD DATA ────────────────────────────────────────────────────────────

def load_ieee_cis_data(data_dir: str):
    """
    Load IEEE-CIS Fraud Detection dataset.
    
    Download from: https://www.kaggle.com/c/ieee-fraud-detection/data
    Expected files: train_transaction.csv, train_identity.csv
    """
    print("📦 Loading IEEE-CIS dataset...")
    
    tx = pd.read_csv(os.path.join(data_dir, "train_transaction.csv"))
    identity = pd.read_csv(os.path.join(data_dir, "train_identity.csv"))
    
    # Merge on TransactionID
    df = tx.merge(identity, on="TransactionID", how="left")
    print(f"   Shape: {df.shape} | Fraud rate: {df['isFraud'].mean():.2%}")
    return df


def load_sample_data():
    """
    Generate synthetic data for development/testing when Kaggle data unavailable.
    Replace this with real data loading in production.
    """
    print("⚠️  Kaggle dataset not found. Generating synthetic data for demonstration...")
    np.random.seed(42)
    n = 50000
    
    df = pd.DataFrame({
        "TransactionAmt": np.random.lognormal(4, 2, n),
        "card1": np.random.randint(1000, 9999, n),
        "card4": np.random.choice(["visa", "mastercard", "discover"], n),
        "P_emaildomain": np.random.choice(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "protonmail.com"], n),
        "dist1": np.random.exponential(100, n),
        "C1": np.random.randint(0, 20, n),
        "C2": np.random.randint(0, 15, n),
        "D1": np.random.randint(0, 365, n),
        "V1": np.random.uniform(0, 1, n),
        "V2": np.random.uniform(0, 1, n),
        "V3": np.random.uniform(0, 1, n),
        "DeviceType": np.random.choice(["desktop", "mobile", None], n),
    })
    
    # Fraud logic: high amounts + new devices + suspicious emails
    fraud_prob = (
        (df["TransactionAmt"] > 500).astype(float) * 0.3 +
        (df["P_emaildomain"] == "protonmail.com").astype(float) * 0.4 +
        (df["C1"] > 10).astype(float) * 0.2 +
        np.random.uniform(0, 0.1, n)
    )
    df["isFraud"] = (fraud_prob > 0.55).astype(int)
    
    print(f"   Synthetic shape: {df.shape} | Fraud rate: {df['isFraud'].mean():.2%}")
    return df


# ─── 2. FEATURE ENGINEERING ──────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    print("⚙️  Engineering features...")
    
    # Encode categoricals
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    le = LabelEncoder()
    for col in cat_cols:
        df[col] = df[col].fillna("unknown")
        df[col] = le.fit_transform(df[col].astype(str))
    
    # Fill numeric NaN
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())
    
    # Feature: log transform of amount
    if "TransactionAmt" in df.columns:
        df["log_amt"] = np.log1p(df["TransactionAmt"])
    
    print(f"   Features ready: {df.shape[1]} columns")
    return df


# ─── 3. TRAIN XGBOOST ────────────────────────────────────────────────────────

def train_xgboost(X_train, X_test, y_train, y_test):
    print("\n🚀 Training XGBoost model...")
    
    # Handle class imbalance with scale_pos_weight
    fraud_ratio = (y_train == 0).sum() / (y_train == 1).sum()
    
    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=fraud_ratio,
        eval_metric="auc",
        use_label_encoder=False,
        random_state=42,
        n_jobs=-1,
        tree_method="hist",  # Faster training
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        early_stopping_rounds=30,
        verbose=100,
    )
    
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba > 0.5).astype(int)
    
    auc = roc_auc_score(y_test, y_pred_proba)
    f1 = f1_score(y_test, y_pred)
    
    print(f"\n📊 XGBoost Results:")
    print(f"   ROC-AUC:  {auc:.4f}")
    print(f"   F1 Score: {f1:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Safe', 'Fraud'])}")
    
    return model, auc


def train_lightgbm(X_train, X_test, y_train, y_test):
    print("\n🚀 Training LightGBM model...")
    
    fraud_ratio = (y_train == 0).sum() / (y_train == 1).sum()
    
    model = lgb.LGBMClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=fraud_ratio,
        random_state=42,
        n_jobs=-1,
        verbose=-1,
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        callbacks=[lgb.early_stopping(30), lgb.log_evaluation(100)],
    )
    
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba > 0.5).astype(int)
    
    auc = roc_auc_score(y_test, y_pred_proba)
    f1 = f1_score(y_test, y_pred)
    print(f"\n📊 LightGBM Results: AUC={auc:.4f} | F1={f1:.4f}")
    
    return model, auc


# ─── 4. ENSEMBLE ─────────────────────────────────────────────────────────────

class EnsembleModel:
    """Weighted average ensemble of XGBoost + LightGBM."""
    
    def __init__(self, xgb_model, lgb_model, xgb_weight=0.6, lgb_weight=0.4):
        self.xgb_model = xgb_model
        self.lgb_model = lgb_model
        self.xgb_weight = xgb_weight
        self.lgb_weight = lgb_weight
    
    def predict_proba(self, X):
        xgb_proba = self.xgb_model.predict_proba(X)[:, 1]
        lgb_proba = self.lgb_model.predict_proba(X)[:, 1]
        ensemble_proba = self.xgb_weight * xgb_proba + self.lgb_weight * lgb_proba
        return np.column_stack([1 - ensemble_proba, ensemble_proba])
    
    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X)[:, 1] > threshold).astype(int)
    
    def predict_single(self, features_dict: dict) -> float:
        """Predict fraud probability for a single transaction."""
        import pandas as pd
        df = pd.DataFrame([features_dict])
        return float(self.predict_proba(df)[0, 1])


# ─── 5. SHAP EXPLAINABILITY ──────────────────────────────────────────────────

def compute_shap_values(model, X_sample, feature_names):
    """Compute SHAP values for model explainability."""
    import shap
    print("\n🔍 Computing SHAP values...")
    
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
    
    # Get top features by mean |SHAP|
    mean_shap = np.abs(shap_values).mean(axis=0)
    top_idx = np.argsort(mean_shap)[::-1][:10]
    
    print("   Top 10 features by SHAP importance:")
    for i in top_idx:
        print(f"   {feature_names[i]:<30} {mean_shap[i]:.4f}")
    
    return shap_values


# ─── 6. MAIN ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  FraudShield AI — XGBoost Transaction Fraud Training")
    print("=" * 60)
    
    # Load data
    data_dir = os.path.join(os.path.dirname(__file__), "../data")
    try:
        df = load_ieee_cis_data(data_dir)
    except FileNotFoundError:
        df = load_sample_data()
    
    # Feature engineering
    df = engineer_features(df)
    
    # Define features & target
    target_col = "isFraud"
    drop_cols = [target_col, "TransactionID"] if "TransactionID" in df.columns else [target_col]
    feature_cols = [c for c in df.columns if c not in drop_cols]
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Train/test split (stratified to maintain fraud ratio)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n📋 Train: {len(X_train):,} | Test: {len(X_test):,}")
    print(f"   Train fraud rate: {y_train.mean():.2%}")
    
    # Train models
    xgb_model, xgb_auc = train_xgboost(X_train, X_test, y_train, y_test)
    lgb_model, lgb_auc = train_lightgbm(X_train, X_test, y_train, y_test)
    
    # Ensemble
    ensemble = EnsembleModel(xgb_model, lgb_model)
    ens_proba = ensemble.predict_proba(X_test)[:, 1]
    ens_pred = ensemble.predict(X_test)
    ens_auc = roc_auc_score(y_test, ens_proba)
    ens_f1 = f1_score(y_test, ens_pred)
    
    print(f"\n🏆 Ensemble Results: AUC={ens_auc:.4f} | F1={ens_f1:.4f}")
    
    # SHAP (on a small sample for speed)
    shap_sample = X_test.sample(min(500, len(X_test)), random_state=42)
    compute_shap_values(xgb_model, shap_sample, feature_cols)
    
    # Save models
    print("\n💾 Saving models...")
    
    with open(os.path.join(OUTPUT_DIR, "xgboost_fraud.pkl"), "wb") as f:
        pickle.dump(ensemble, f)
    
    with open(os.path.join(OUTPUT_DIR, "feature_columns.pkl"), "wb") as f:
        pickle.dump(feature_cols, f)
    
    print(f"   ✅ Ensemble model → {OUTPUT_DIR}/xgboost_fraud.pkl")
    print(f"   ✅ Feature list  → {OUTPUT_DIR}/feature_columns.pkl")
    print(f"\n🎉 Training complete! Final AUC: {ens_auc:.4f}")


if __name__ == "__main__":
    main()
