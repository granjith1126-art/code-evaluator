from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import Problem, Submission, TestResult, TestCase
from app.schemas.submission import SubmissionCreate, SubmissionRead, SubmissionDetail, TestResultPublicRead
from app.schemas.common import PaginatedResponse
from app.evaluators.deterministic import deterministic_evaluator
from app.api.v1.auth import get_current_user_optional

router = APIRouter()

@router.post("/submissions", response_model=SubmissionDetail, status_code=status.HTTP_201_CREATED)
def create_and_evaluate_submission(
    submission_in: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    problem = db.query(Problem).filter(Problem.id == submission_in.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Select test cases to execute
    all_tests = db.query(TestCase).filter(TestCase.problem_id == problem.id).order_by(TestCase.order_index.asc()).all()
    if not all_tests:
        raise HTTPException(status_code=400, detail="Problem has no test cases configured.")

    if submission_in.run_only_public:
        test_cases_to_run = [tc for tc in all_tests if not tc.is_hidden]
        if not test_cases_to_run:
            test_cases_to_run = all_tests[:1]
    else:
        test_cases_to_run = all_tests

    # Prepare payload for deterministic evaluator
    test_case_dicts = [
        {
            "id": tc.id,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "test_type": tc.test_type,
            "is_hidden": tc.is_hidden
        }
        for tc in test_cases_to_run
    ]

    eval_result = deterministic_evaluator.evaluate(
        code=submission_in.code,
        test_cases=test_case_dicts,
        function_name=problem.function_name,
        time_limit_seconds=problem.time_limit_seconds,
        memory_limit_mb=problem.memory_limit_mb
    )

    scores = eval_result["scores"]

    submission = Submission(
        problem_id=problem.id,
        user_id=current_user.id if current_user else None,
        code=submission_in.code,
        language=submission_in.language,
        status=eval_result["status"],
        execution_time_ms=eval_result["execution_time_ms"],
        memory_usage_kb=eval_result["memory_usage_kb"],
        deterministic_score=scores["deterministic_score"],
        functional_score=scores["functional_score"],
        edge_cases_score=scores["edge_cases_score"],
        quality_score=scores["quality_score"],
        efficiency_score=scores["efficiency_score"],
        total_score=scores["total_score"],
        pass_rate=scores["pass_rate"],
        tests_passed=scores["tests_passed"],
        tests_total=scores["tests_total"],
        error_category=eval_result["error_category"],
        error_message=eval_result["error_message"],
        stdout=eval_result["stdout"],
        stderr=eval_result["stderr"],
        sandbox_mode=eval_result["sandbox_mode"]
    )
    db.add(submission)
    db.flush()

    # Save individual test results
    db_results = []
    for tr in eval_result["test_results"]:
        db_tr = TestResult(
            submission_id=submission.id,
            test_case_id=tr["test_case_id"],
            passed=tr["passed"],
            actual_output=tr["actual_output"],
            expected_output=tr["expected_output"],
            execution_time_ms=tr["execution_time_ms"],
            memory_kb=tr.get("memory_kb", 0.0),
            status=tr["status"],
            is_hidden=tr["is_hidden"],
            error_message=tr.get("error_message")
        )
        db.add(db_tr)
        db_results.append(db_tr)

    db.commit()
    db.refresh(submission)

    safe_results = [TestResultPublicRead.from_orm_safe(tr) for tr in db_results]

    return SubmissionDetail(
        id=submission.id,
        problem_id=submission.problem_id,
        user_id=submission.user_id,
        language=submission.language,
        status=submission.status,
        execution_time_ms=submission.execution_time_ms,
        memory_usage_kb=submission.memory_usage_kb,
        deterministic_score=submission.deterministic_score,
        functional_score=submission.functional_score,
        edge_cases_score=submission.edge_cases_score,
        quality_score=submission.quality_score,
        efficiency_score=submission.efficiency_score,
        total_score=submission.total_score,
        pass_rate=submission.pass_rate,
        tests_passed=submission.tests_passed,
        tests_total=submission.tests_total,
        error_category=submission.error_category,
        error_message=submission.error_message,
        sandbox_mode=submission.sandbox_mode,
        created_at=submission.created_at,
        code=submission.code,
        stdout=submission.stdout,
        stderr=submission.stderr,
        test_results=safe_results
    )

@router.get("/submissions/{submission_id}", response_model=SubmissionDetail)
def get_submission_detail(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    safe_results = [TestResultPublicRead.from_orm_safe(tr) for tr in submission.test_results]

    return SubmissionDetail(
        id=submission.id,
        problem_id=submission.problem_id,
        user_id=submission.user_id,
        language=submission.language,
        status=submission.status,
        execution_time_ms=submission.execution_time_ms,
        memory_usage_kb=submission.memory_usage_kb,
        deterministic_score=submission.deterministic_score,
        functional_score=submission.functional_score,
        edge_cases_score=submission.edge_cases_score,
        quality_score=submission.quality_score,
        efficiency_score=submission.efficiency_score,
        total_score=submission.total_score,
        pass_rate=submission.pass_rate,
        tests_passed=submission.tests_passed,
        tests_total=submission.tests_total,
        error_category=submission.error_category,
        error_message=submission.error_message,
        sandbox_mode=submission.sandbox_mode,
        created_at=submission.created_at,
        code=submission.code,
        stdout=submission.stdout,
        stderr=submission.stderr,
        test_results=safe_results
    )

@router.get("/submissions", response_model=PaginatedResponse)
def list_submissions(
    problem_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Submission)
    if problem_id:
        query = query.filter(Submission.problem_id == problem_id)
    if status_filter:
        query = query.filter(Submission.status == status_filter)

    total = query.count()
    items = query.order_by(Submission.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    summaries = [SubmissionRead.model_validate(s) for s in items]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=summaries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
