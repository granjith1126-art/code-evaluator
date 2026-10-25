from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class TestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = False
    test_type: str = "function"  # 'function' or 'stdio'
    explanation: Optional[str] = None
    weight: float = 1.0
    order_index: int = 0

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseRead(TestCaseBase):
    id: int
    problem_id: int
    model_config = ConfigDict(from_attributes=True)

class TestCasePublicRead(BaseModel):
    id: int
    is_hidden: bool
    test_type: str
    weight: float
    order_index: int
    explanation: Optional[str] = None
    input_data: Optional[str] = None
    expected_output: Optional[str] = None

    @classmethod
    def from_orm_safe(cls, tc):
        return cls(
            id=tc.id,
            is_hidden=tc.is_hidden,
            test_type=tc.test_type,
            weight=tc.weight,
            order_index=tc.order_index,
            explanation=tc.explanation if not tc.is_hidden else None,
            input_data=tc.input_data if not tc.is_hidden else "[HIDDEN TEST CASE]",
            expected_output=tc.expected_output if not tc.is_hidden else "[HIDDEN TEST CASE]"
        )

class ProblemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=100)
    description: str
    difficulty: str = "easy"  # 'easy', 'medium', 'hard'
    time_limit_seconds: float = 2.0
    memory_limit_mb: int = 128
    tags: str = ""
    starter_code: str = ""
    function_name: Optional[str] = None
    function_signature: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None

class ProblemCreate(ProblemBase):
    test_cases: List[TestCaseCreate] = []

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    time_limit_seconds: Optional[float] = None
    memory_limit_mb: Optional[int] = None
    tags: Optional[str] = None
    starter_code: Optional[str] = None
    function_name: Optional[str] = None
    function_signature: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None

class ProblemSummary(BaseModel):
    id: int
    slug: str
    title: str
    difficulty: str
    tags: str
    time_limit_seconds: float
    memory_limit_mb: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProblemRead(ProblemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    test_cases: List[TestCasePublicRead] = []
    model_config = ConfigDict(from_attributes=True)

class ProblemAdminRead(ProblemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    test_cases: List[TestCaseRead] = []
    model_config = ConfigDict(from_attributes=True)
