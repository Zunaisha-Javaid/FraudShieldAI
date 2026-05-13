from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional

from models.database import get_db, FraudCase
from models.schemas import CaseResponse

router = APIRouter()


@router.get("/", response_model=List[CaseResponse])
async def list_cases(
    skip: int = 0,
    limit: int = 50,
    fraud_only: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all analyzed cases with optional filtering."""
    query = select(FraudCase).order_by(desc(FraudCase.created_at)).offset(skip).limit(limit)
    if fraud_only is not None:
        query = query.where(FraudCase.is_fraud == fraud_only)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific case by ID."""
    result = await db.execute(select(FraudCase).where(FraudCase.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/{case_id}")
async def delete_case(case_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a case."""
    result = await db.execute(select(FraudCase).where(FraudCase.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    await db.delete(case)
    await db.commit()
    return {"message": "Case deleted"}


@router.get("/stats/summary")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregate statistics."""
    from sqlalchemy import func
    total = await db.execute(select(func.count(FraudCase.id)))
    fraud = await db.execute(select(func.count(FraudCase.id)).where(FraudCase.is_fraud == True))
    avg_conf = await db.execute(select(func.avg(FraudCase.confidence)))
    avg_time = await db.execute(select(func.avg(FraudCase.processing_time_ms)))

    total_n = total.scalar() or 0
    fraud_n = fraud.scalar() or 0

    return {
        "total_cases": total_n,
        "fraud_detected": fraud_n,
        "safe_cases": total_n - fraud_n,
        "fraud_rate": round((fraud_n / total_n * 100) if total_n else 0, 2),
        "avg_confidence": round(float(avg_conf.scalar() or 0), 4),
        "avg_processing_ms": round(float(avg_time.scalar() or 0), 1),
    }
