from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "models": {
            "xgboost": "ready",
            "bert": "ready",
            "efficientnet": "ready",
            "ensemble": "ready",
        },
        "version": "1.0.0",
    }
