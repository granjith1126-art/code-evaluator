from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class SubmissionCreate(BaseModel):
    problem_id: int
    code: str = Field(..., min_length=1)
    language: str = "python"
    run_only_public: bool = False

class TestResultPublicRead(BaseModel):
    id: int
    test_case_id: int
    passed: bool
    status: str
    is_hidden: bool
    execution_time_ms: float
    memory_kb: float
    actual_output: Optional[str] = None
    expected_output: Optional[str] = None
    error_message: Optional[str] = None

    @classmethod
    def from_orm_safe(cls, tr):
        return cls(
            id=tr.id,
            test_case_id=tr.test_case_id,
            passed=tr.passed,
            status=tr.status,
            is_hidden=tr.is_hidden,
            execution_time_ms=round(tr.execution_time_ms, 2),
            memory_kb=round(tr.memory_kb, 2),
            actual_output=tr.actual_output if not tr.is_hidden else "[HIDDEN]",
            expected_output=tr.expected_output if not tr.is_hidden else "[HIDDEN]",
            error_message=tr.error_message if not tr.is_hidden else (
                "Hidden test case failed" if not tr.passed else None
            )
        )

class SubmissionRead(BaseModel):
    id: int
    problem_id: int
    user_id: Optional[int] = None
    language: str
    status: str
    execution_time_ms: float
    memory_usage_kb: float
    deterministic_score: float
    functional_score: float
    edge_cases_score: float
    quality_score: float
    efficiency_score: float
    total_score: float
    pass_rate: float
    tests_passed: int
    tests_total: int
    error_category: Optional[str] = None
    error_message: Optional[str] = None
    sandbox_mode: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SubmissionDetail(SubmissionRead):
    code: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    test_results: List[TestResultPublicRead] = []
    model_config = ConfigDict(from_attributes=True)
