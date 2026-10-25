from fastapi import APIRouter
import time

router = APIRouter()

start_time = time.time()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Code Evaluator Backend",
        "uptime_seconds": round(time.time() - start_time, 2),
        "version": "1.0.0"
    }
