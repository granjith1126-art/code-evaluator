from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class BugReport(BaseModel):
    title: str
    line_number: Optional[int] = None
    severity: str = "medium"
    description: str
    suggestion: str

class OptimizationSuggestion(BaseModel):
    category: str
    current_state: str
    improved_state: str
    rationale: str

class AIEvaluationRequest(BaseModel):
    submission_id: int
    provider: Optional[str] = None
    model: Optional[str] = None
    include_bug_analysis: bool = True
    include_optimization: bool = True

class AIEvaluationRead(BaseModel):
    id: int
    submission_id: int
    provider: str
    model: str
    overall_assessment: str
    correctness_score: float
    efficiency_score: float
    readability_score: float
    maintainability_score: float
    security_score: float
    robustness_score: float
    edge_cases_score: float
    instruction_following_score: float
    bugs_identified: List[BugReport] = []
    optimization_suggestions: List[OptimizationSuggestion] = []
    confidence: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SolutionComparisonRequest(BaseModel):
    problem_id: int
    submission_a_id: int
    submission_b_id: int
    provider: Optional[str] = None
    model: Optional[str] = None

class SolutionComparisonRead(BaseModel):
    id: int
    problem_id: int
    submission_a_id: int
    submission_b_id: int
    provider: str
    model: str
    preferred_solution: str
    functional_comparison: str
    efficiency_comparison: str
    readability_comparison: str
    edge_case_comparison: str
    written_justification: str
    confidence: float
    human_override_preferred: Optional[str] = None
    human_override_reason: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HumanOverrideRequest(BaseModel):
    human_override_preferred: str = Field(..., pattern="^(A|B|tie)$")
    human_override_reason: str = Field(..., min_length=10)
