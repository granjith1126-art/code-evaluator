from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class RubricCreate(BaseModel):
    name: str
    version: str = "1.0.0"
    criteria_weights: Dict[str, float] = {
        "correctness": 0.35,
        "efficiency": 0.20,
        "readability": 0.20,
        "maintainability": 0.15,
        "security": 0.10
    }
    description: Optional[str] = None
    is_active: bool = True

class RubricRead(RubricCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HumanReviewCreate(BaseModel):
    submission_id: int
    rubric_id: Optional[int] = None
    correctness_score: float = Field(..., ge=0.0, le=100.0)
    efficiency_score: float = Field(..., ge=0.0, le=100.0)
    readability_score: float = Field(..., ge=0.0, le=100.0)
    maintainability_score: float = Field(..., ge=0.0, le=100.0)
    security_score: float = Field(..., ge=0.0, le=100.0)
    failure_category: Optional[str] = None
    rationale: str = Field(..., min_length=10)
    ambiguity_reported: bool = False
    status: str = "completed"

class HumanReviewUpdate(BaseModel):
    correctness_score: Optional[float] = None
    efficiency_score: Optional[float] = None
    readability_score: Optional[float] = None
    maintainability_score: Optional[float] = None
    security_score: Optional[float] = None
    failure_category: Optional[str] = None
    rationale: Optional[str] = None
    ambiguity_reported: Optional[bool] = None
    status: Optional[str] = None
    change_reason: str = Field(..., min_length=5)

class ReviewHistoryRead(BaseModel):
    id: int
    human_review_id: int
    reviewer_id: Optional[int]
    previous_state: Dict[str, Any]
    new_state: Dict[str, Any]
    change_reason: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HumanReviewRead(BaseModel):
    id: int
    submission_id: int
    reviewer_id: Optional[int]
    rubric_id: Optional[int]
    correctness_score: float
    efficiency_score: float
    readability_score: float
    maintainability_score: float
    security_score: float
    failure_category: Optional[str]
    rationale: str
    status: str
    ambiguity_reported: bool
    created_at: datetime
    updated_at: datetime
    history: List[ReviewHistoryRead] = []
    model_config = ConfigDict(from_attributes=True)
