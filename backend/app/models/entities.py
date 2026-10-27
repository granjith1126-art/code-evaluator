import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # 'admin', 'reviewer', 'user'
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    submissions = relationship("Submission", back_populates="user")
    reviews = relationship("HumanReview", back_populates="reviewer")

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), default="easy", nullable=False)  # 'easy', 'medium', 'hard'
    time_limit_seconds = Column(Float, default=2.0, nullable=False)
    memory_limit_mb = Column(Integer, default=128, nullable=False)
    tags = Column(String(255), default="", nullable=False)  # comma separated
    starter_code = Column(Text, default="", nullable=False)
    function_name = Column(String(100), nullable=True)  # for function-based testing
    function_signature = Column(String(255), nullable=True)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False, index=True)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)  # Hidden vs Public
    test_type = Column(String(20), default="function", nullable=False)  # 'function' or 'stdio'
    explanation = Column(Text, nullable=True)
    weight = Column(Float, default=1.0, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    problem = relationship("Problem", back_populates="test_cases")
    test_results = relationship("TestResult", back_populates="test_case", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    code = Column(Text, nullable=False)
    language = Column(String(20), default="python", nullable=False)
    
    # Results & Status
    status = Column(String(50), default="Pending", nullable=False)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    memory_usage_kb = Column(Float, default=0.0, nullable=False)
    
    # Detailed Scoring breakdown
    deterministic_score = Column(Float, default=0.0, nullable=False)
    functional_score = Column(Float, default=0.0, nullable=False)
    edge_cases_score = Column(Float, default=0.0, nullable=False)
    quality_score = Column(Float, default=0.0, nullable=False)
    efficiency_score = Column(Float, default=0.0, nullable=False)
    total_score = Column(Float, default=0.0, nullable=False)
    
    pass_rate = Column(Float, default=0.0, nullable=False)
    tests_passed = Column(Integer, default=0, nullable=False)
    tests_total = Column(Integer, default=0, nullable=False)
    
    error_category = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    sandbox_mode = Column(String(50), default="auto", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    problem = relationship("Problem", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
    test_results = relationship("TestResult", back_populates="submission", cascade="all, delete-orphan")
    ai_evaluation = relationship("AIEvaluation", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    human_reviews = relationship("HumanReview", back_populates="submission", cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False, index=True)
    passed = Column(Boolean, default=False, nullable=False)
    actual_output = Column(Text, nullable=True)
    expected_output = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    memory_kb = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="Passed", nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)
    error_message = Column(Text, nullable=True)

    submission = relationship("Submission", back_populates="test_results")
    test_case = relationship("TestCase", back_populates="test_results")

class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), unique=True, nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # 'openai', 'gemini', 'mock'
    model = Column(String(100), nullable=False)
    
    overall_assessment = Column(Text, nullable=False)
    correctness_score = Column(Float, default=0.0, nullable=False)
    efficiency_score = Column(Float, default=0.0, nullable=False)
    readability_score = Column(Float, default=0.0, nullable=False)
    maintainability_score = Column(Float, default=0.0, nullable=False)
    security_score = Column(Float, default=0.0, nullable=False)
    robustness_score = Column(Float, default=0.0, nullable=False)
    edge_cases_score = Column(Float, default=0.0, nullable=False)
    instruction_following_score = Column(Float, default=0.0, nullable=False)
    
    bugs_identified = Column(JSON, default=list, nullable=False)
    optimization_suggestions = Column(JSON, default=list, nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    submission = relationship("Submission", back_populates="ai_evaluation")

class SolutionComparison(Base):
    __tablename__ = "solution_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False, index=True)
    submission_a_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    submission_b_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    
    preferred_solution = Column(String(10), nullable=False)  # 'A', 'B', 'tie'
    functional_comparison = Column(Text, nullable=False)
    efficiency_comparison = Column(Text, nullable=False)
    readability_comparison = Column(Text, nullable=False)
    edge_case_comparison = Column(Text, nullable=False)
    written_justification = Column(Text, nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)
    
    # Human override
    human_override_preferred = Column(String(10), nullable=True)  # 'A', 'B', 'tie'
    human_override_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(20), default="1.0.0", nullable=False)
    criteria_weights = Column(JSON, default=dict, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    reviews = relationship("HumanReview", back_populates="rubric")

class HumanReview(Base):
    __tablename__ = "human_reviews"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=True, index=True)
    
    correctness_score = Column(Float, nullable=False)
    efficiency_score = Column(Float, nullable=False)
    readability_score = Column(Float, nullable=False)
    maintainability_score = Column(Float, nullable=False)
    security_score = Column(Float, nullable=False)
    
    failure_category = Column(String(100), nullable=True)  # e.g., 'Off-by-one', 'TLE', 'Edge case missed'
    rationale = Column(Text, nullable=False)
    status = Column(String(20), default="completed", nullable=False)  # 'draft', 'completed'
    ambiguity_reported = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    submission = relationship("Submission", back_populates="human_reviews")
    reviewer = relationship("User", back_populates="reviews")
    rubric = relationship("Rubric", back_populates="reviews")
    history = relationship("ReviewHistory", back_populates="review", cascade="all, delete-orphan")

class ReviewHistory(Base):
    __tablename__ = "review_history"

    id = Column(Integer, primary_key=True, index=True)
    human_review_id = Column(Integer, ForeignKey("human_reviews.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    previous_state = Column(JSON, nullable=False)
    new_state = Column(JSON, nullable=False)
    change_reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    review = relationship("HumanReview", back_populates="history")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(20), default="1.0.0", nullable=False)
    record_count = Column(Integer, default=0, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    records = relationship("DatasetRecord", back_populates="dataset", cascade="all, delete-orphan")

class DatasetRecord(Base):
    __tablename__ = "dataset_records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    human_review_id = Column(Integer, ForeignKey("human_reviews.id"), nullable=True, index=True)
    ai_evaluation_id = Column(Integer, ForeignKey("ai_evaluations.id"), nullable=True, index=True)
    record_json = Column(JSON, nullable=False)
    provenance_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    dataset = relationship("Dataset", back_populates="records")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
