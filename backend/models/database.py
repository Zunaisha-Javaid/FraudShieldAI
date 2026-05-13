"""
Database setup using SQLAlchemy + SQLite (swap to PostgreSQL in production)
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./fraudshield.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class FraudCase(Base):
    __tablename__ = "fraud_cases"

    id = Column(Integer, primary_key=True, index=True)
    input_text = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    fraud_type = Column(String(50), nullable=False)
    is_fraud = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    verdict = Column(String(20), nullable=False)
    explanation = Column(Text, nullable=True)
    model_used = Column(String(100), nullable=False)
    processing_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
