from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.config import router as config_router
from app.api.v1.auth import router as auth_router
from app.api.v1.problems import router as problems_router
from app.api.v1.submissions import router as submissions_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.analytics import router as analytics_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(config_router, tags=["Config"])
api_router.include_router(auth_router, tags=["Auth"])
api_router.include_router(problems_router, tags=["Problems"])
api_router.include_router(submissions_router, tags=["Submissions"])
api_router.include_router(evaluations_router, tags=["AI Evaluations"])
api_router.include_router(reviews_router, tags=["Human Reviews"])
api_router.include_router(datasets_router, tags=["Datasets"])
api_router.include_router(analytics_router, tags=["Analytics"])
