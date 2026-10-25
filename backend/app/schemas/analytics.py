from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardStats(BaseModel):
    total_problems: int
    total_submissions: int
    overall_pass_rate: float
    failed_evaluations: int
    ai_evaluations_count: int
    human_reviews_count: int
    datasets_count: int
    recent_activity: List[Dict[str, Any]]
    failure_categories: List[Dict[str, Any]]
    evaluations_by_provider: List[Dict[str, Any]]
    evaluation_trends: List[Dict[str, Any]]

class ProviderStatus(BaseModel):
    provider: str
    configured: bool
    default: bool
    model: str
    active: bool
    status_message: str

class SystemConfigStatus(BaseModel):
    app_env: str
    database_type: str
    sandbox_mode: str
    docker_available: bool
    providers: List[ProviderStatus]
