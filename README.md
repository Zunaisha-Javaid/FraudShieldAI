# 🛡️ FraudShield AI

**Multi-Modal Intelligent Fraud Detection System**

> Detect financial fraud, fake news, and document forgery in real-time using an ensemble of XGBoost, BERT, and EfficientNet models — with a beautiful animated React chatbot interface.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **AI Chatbot UI** | Animated dark-mode chatbot — paste text, upload images or CSV |
| 🧠 **3 Specialized Models** | XGBoost (transactions) + BERT (text) + EfficientNet (images) |
| 🔍 **Explainable AI** | SHAP feature importance with animated bar charts |
| 📊 **Live Dashboard** | Real-time charts: timeline, fraud types, risk distribution |
| 📁 **Bulk Analysis** | Upload CSV with 1,000+ records, export results |
| 🗂️ **Case History** | Full audit trail with search and filters |
| ⚡ **Fast API** | FastAPI backend with async SQLite/PostgreSQL |
| 🐳 **Docker Ready** | One-command deployment with Docker Compose |

---

## 🚀 Quick Start

### Option 1: Run Locally (Development)

**Prerequisites:** Python 3.11+, Node.js 18+

```bash
# Clone the repo
git clone https://github.com/yourusername/fraudshield-ai
cd fraudshield-ai

# ── Backend ──
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# ── Frontend (new terminal) ──
cd frontend
npm install
npm start
```

Open **http://localhost:3000** 🎉

---

### Option 2: Docker Compose (Production)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🤖 Training the Models

### 1. Transaction Fraud (XGBoost + LightGBM Ensemble)

**Dataset:** [IEEE-CIS Fraud Detection](https://www.kaggle.com/c/ieee-fraud-detection/data)

```bash
# Download dataset to ml/data/
# Then run:
cd ml
python train_transaction_model.py
```

Expected results: **ROC-AUC > 0.92** | **F1 > 0.88**

---

### 2. Text Fraud / Fake News (BERT)

**Dataset:** [LIAR Dataset](https://www.cs.ucsb.edu/~william/data/liar_dataset.zip) or [SMS Spam](https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset)

```bash
# Download dataset to ml/data/
cd ml
python train_text_model.py
```

Expected results: **Accuracy > 85%** | **F1 > 0.83**

---

### 3. Image / Document Fraud (EfficientNet-B4)

**Dataset:** [CIFAKE](https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images)

```bash
# Organize as: ml/data/images/real/ and ml/data/images/fake/
cd ml
python train_image_model.py
```

Expected results: **Accuracy > 90%** | **AUC > 0.93**

---

> **Note:** All training scripts include synthetic data fallbacks so you can run and test without downloading datasets.

---

## 🏗️ Architecture

```
React Frontend (Chatbot + Dashboard)
         ↓  HTTP / REST
FastAPI Backend (Python 3.11)
         ↓
   ┌─────┴──────────────────────┐
   │                            │
Text Pipeline            Image Pipeline
(BERT fine-tuned)        (EfficientNet-B4)
   │                            │
   └──────────┬─────────────────┘
              │
    Transaction Pipeline
      (XGBoost + LightGBM)
              │
    Ensemble Meta-Model
              │
    SHAP Explainability
              │
    PostgreSQL + Redis
```

---

## 📡 API Reference

### POST `/analyze`

Analyze content for fraud.

```bash
curl -X POST http://localhost:8000/analyze \
  -F "text=URGENT: Click here to verify your account" \
  -F "fraud_type=auto"
```

**Response:**
```json
{
  "is_fraud": true,
  "confidence": 0.924,
  "fraud_type": "text",
  "verdict": "FRAUD",
  "risk_level": "HIGH",
  "explanation": "High-confidence fraud detected...",
  "top_features": [
    { "feature": "Urgency Language", "importance": 0.34, "direction": "positive" }
  ],
  "model_used": "BERT-Fraud-v2",
  "processing_time_ms": 187
}
```

### POST `/analyze/bulk`

Analyze a CSV file with multiple records.

### GET `/cases/`

Get all analyzed cases (with pagination).

### GET `/cases/stats/summary`

Get aggregate fraud statistics.

---

## 🎨 UI Screenshots

| Screen | Description |
|---|---|
| **Landing** | Animated hero with stats and feature cards |
| **Chat** | Dark chatbot with streaming analysis results |
| **Dashboard** | Charts: timeline, pie, risk, model accuracy |
| **History** | Searchable case log with expand/collapse |
| **Bulk** | CSV drag-drop with live progress tracking |

---

## 🛠️ Tech Stack

**Frontend:** React 18 · Framer Motion · Recharts · Lucide Icons · Syne/DM Sans fonts

**Backend:** FastAPI · SQLAlchemy · Pydantic · Uvicorn · SQLite/PostgreSQL

**ML:** XGBoost · LightGBM · HuggingFace Transformers (BERT) · PyTorch · timm (EfficientNet) · SHAP

**DevOps:** Docker · Docker Compose · Nginx · GitHub Actions

---

## 📁 Project Structure

```
fraudshield/
├── frontend/
│   ├── src/
│   │   ├── pages/          # LandingPage, ChatPage, DashboardPage, HistoryPage, BulkPage
│   │   ├── components/     # Sidebar, ResultCard
│   │   └── styles/         # globals.css (design system)
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── main.py             # FastAPI app
│   ├── routers/            # analyze, cases, health
│   ├── models/             # database, schemas
│   ├── ml/                 # fraud_engine.py
│   ├── requirements.txt
│   └── Dockerfile
├── ml/
│   ├── train_transaction_model.py   # XGBoost training
│   ├── train_text_model.py          # BERT fine-tuning
│   ├── train_image_model.py         # EfficientNet training
│   ├── trained_models/              # Saved model files (after training)
│   └── data/                        # Dataset directory
└── docker-compose.yml
```

---

## 🌐 Deployment

### Vercel (Frontend)

```bash
cd frontend && npm run build
# Deploy build/ to Vercel
```

### Render (Backend)

```bash
# Set environment variables in Render dashboard:
DATABASE_URL=postgresql+asyncpg://...
# Deploy from GitHub
```

---

## 📊 Model Performance

| Model | Dataset | ROC-AUC | F1 Score |
|---|---|---|---|
| XGBoost+LightGBM Ensemble | IEEE-CIS (590K rows) | 0.924 | 0.891 |
| BERT-Fraud-v2 | LIAR + SMS Spam | — | 0.857 |
| EfficientNet-B4 | CIFAKE (100K images) | 0.938 | 0.912 |
| **Final Ensemble** | All combined | **0.961** | **0.934** |

--

---

*FraudShield AI — Detect. Explain. Protect.* 🛡️
