"""
FraudShield AI - FastAPI Backend
Multi-Modal Fraud Detection System
"""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time
import io
from typing import Optional

from routers import analyze, health, cases
from models.database import init_db

app = FastAPI(
    title="FraudShield AI API",
    description="Multi-Modal Fraud Detection System — Text, Image & Transaction Analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://fraudshield.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(analyze.router, prefix="", tags=["Analysis"])
app.include_router(health.router, prefix="", tags=["Health"])
app.include_router(cases.router, prefix="/cases", tags=["Cases"])


@app.on_event("startup")
async def startup():
    await init_db()
    print("✅ FraudShield AI Backend started")
    print("📊 Models loading...")


@app.get("/")
async def root():
    return {
        "name": "FraudShield AI",
        "version": "1.0.0",
        "status": "online",
        "models": ["XGBoost-Ensemble", "BERT-Fraud-v2", "EfficientNet-B4"],
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
