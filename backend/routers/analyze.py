"""
/analyze endpoint — handles text, image, and transaction analysis
"""
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import time

from models.schemas import AnalysisResult
from models.database import get_db, FraudCase
from ml.fraud_engine import engine as fraud_engine

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    text: str = Form(""),
    fraud_type: str = Form("auto"),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze content for fraud.
    
    - **text**: Text content to analyze
    - **fraud_type**: One of: auto, text, transaction, image
    - **file**: Optional file upload (image, CSV, PDF)
    """
    if not text.strip() and not file:
        raise HTTPException(status_code=400, detail="Provide text or file to analyze")

    image_bytes = None
    file_name = None

    if file:
        file_name = file.filename
        content_type = file.content_type or ""
        file_bytes = await file.read()

        if content_type.startswith("image/"):
            image_bytes = file_bytes
            if fraud_type == "auto":
                fraud_type = "image"
        elif content_type in ("text/csv", "application/json", "text/plain"):
            text = text + "\n" + file_bytes.decode("utf-8", errors="ignore")

    # Route to appropriate model
    try:
        if fraud_type == "transaction":
            result = fraud_engine.analyze_transaction(text)
        elif fraud_type == "text":
            result = fraud_engine.analyze_text(text)
        elif fraud_type == "image":
            if not image_bytes:
                raise HTTPException(status_code=400, detail="No image provided for image analysis")
            result = fraud_engine.analyze_image(image_bytes)
        else:
            # Auto-detect
            result = fraud_engine.analyze_auto(text, image_bytes)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Save to database
    try:
        case = FraudCase(
            input_text=text[:2000] if text else None,
            file_name=file_name,
            fraud_type=result["fraud_type"],
            is_fraud=result["is_fraud"],
            confidence=result["confidence"],
            risk_level=result["risk_level"],
            verdict=result["verdict"],
            explanation=result["explanation"],
            model_used=result["model_used"],
            processing_time_ms=result["processing_time_ms"],
        )
        db.add(case)
        await db.commit()
    except Exception as e:
        # Don't fail the request if DB save fails
        pass

    return JSONResponse(content=result)


@router.post("/analyze/bulk")
async def analyze_bulk(
    file: UploadFile = File(...),
    fraud_type: str = Form("auto"),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a CSV file with multiple records."""
    import csv
    import io

    content = await file.read()
    text_content = content.decode("utf-8", errors="ignore")

    reader = csv.DictReader(io.StringIO(text_content))
    rows = list(reader)

    if len(rows) > 1000:
        raise HTTPException(status_code=400, detail="Max 1,000 rows per bulk request")

    results = []
    for i, row in enumerate(rows):
        text = row.get("text", row.get("message", row.get("content", str(row))))
        row_type = row.get("type", fraud_type)

        if row_type == "transaction":
            r = fraud_engine.analyze_transaction(text)
        elif row_type == "text":
            r = fraud_engine.analyze_text(text)
        else:
            r = fraud_engine.analyze_auto(text)

        r["row_id"] = i + 1
        r["input"] = text[:200]
        results.append(r)

    summary = {
        "total": len(results),
        "fraud_count": sum(1 for r in results if r["is_fraud"]),
        "safe_count": sum(1 for r in results if not r["is_fraud"]),
        "high_risk": sum(1 for r in results if r["risk_level"] == "HIGH"),
    }

    return JSONResponse(content={"summary": summary, "results": results})
