from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class FeatureImportance(BaseModel):
    feature: str
    importance: float
    direction: str  # "positive" = fraud indicator, "negative" = safe indicator


class AnalysisResult(BaseModel):
    is_fraud: bool
    confidence: float
    fraud_type: str
    verdict: str
    risk_level: str
    explanation: str
    top_features: List[FeatureImportance]
    model_used: str
    processing_time_ms: int


class CaseResponse(BaseModel):
    id: int
    input_text: Optional[str]
    file_name: Optional[str]
    fraud_type: str
    is_fraud: bool
    confidence: float
    risk_level: str
    verdict: str
    explanation: Optional[str]
    model_used: str
    processing_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


class BulkAnalysisItem(BaseModel):
    text: str
    type: Optional[str] = "auto"


class BulkAnalysisRequest(BaseModel):
    items: List[BulkAnalysisItem]
