from fastapi import APIRouter
from app.core.config import settings
from app.providers.factory import ai_provider_factory
from app.sandbox.runner import sandbox_manager
from app.schemas.analytics import SystemConfigStatus

router = APIRouter()

@router.get("/config/status", response_model=SystemConfigStatus)
def get_system_config_status():
    db_type = "postgresql" if "postgresql" in settings.DATABASE_URL else "sqlite"
    docker_ok = sandbox_manager.is_docker_available()
    providers = ai_provider_factory.get_provider_status()

    return SystemConfigStatus(
        app_env=settings.APP_ENV,
        database_type=db_type,
        sandbox_mode="docker" if docker_ok else "subprocess",
        docker_available=docker_ok,
        providers=providers
    )
