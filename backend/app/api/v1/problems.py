from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import Problem, TestCase
from app.schemas.problem import (
    ProblemCreate, ProblemUpdate, ProblemRead, ProblemSummary, TestCasePublicRead
)
from app.schemas.common import PaginatedResponse

router = APIRouter()

@router.get("/problems", response_model=PaginatedResponse)
def list_problems(
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Problem)

    if search:
        s = f"%{search}%"
        query = query.filter(or_(Problem.title.ilike(s), Problem.description.ilike(s), Problem.tags.ilike(s)))

    if difficulty and difficulty.lower() != "all":
        query = query.filter(Problem.difficulty == difficulty.lower())

    if tag:
        query = query.filter(Problem.tags.ilike(f"%{tag}%"))

    total = query.count()
    items = query.order_by(Problem.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

    summaries = [ProblemSummary.model_validate(p) for p in items]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=summaries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/problems/{problem_id_or_slug}", response_model=ProblemRead)
def get_problem(problem_id_or_slug: str, db: Session = Depends(get_db)):
    if problem_id_or_slug.isdigit():
        problem = db.query(Problem).filter(Problem.id == int(problem_id_or_slug)).first()
    else:
        problem = db.query(Problem).filter(Problem.slug == problem_id_or_slug).first()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Mask hidden test cases
    safe_test_cases = [TestCasePublicRead.from_orm_safe(tc) for tc in problem.test_cases]

    return ProblemRead(
        id=problem.id,
        slug=problem.slug,
        title=problem.title,
        description=problem.description,
        difficulty=problem.difficulty,
        time_limit_seconds=problem.time_limit_seconds,
        memory_limit_mb=problem.memory_limit_mb,
        tags=problem.tags,
        starter_code=problem.starter_code,
        function_name=problem.function_name,
        function_signature=problem.function_signature,
        input_format=problem.input_format,
        output_format=problem.output_format,
        constraints=problem.constraints,
        created_at=problem.created_at,
        updated_at=problem.updated_at,
        test_cases=safe_test_cases
    )

@router.post("/problems", response_model=ProblemRead, status_code=status.HTTP_201_CREATED)
def create_problem(problem_in: ProblemCreate, db: Session = Depends(get_db)):
    existing = db.query(Problem).filter((Problem.slug == problem_in.slug) | (Problem.title == problem_in.title)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Problem with this title or slug already exists.")

    problem = Problem(
        title=problem_in.title,
        slug=problem_in.slug,
        description=problem_in.description,
        difficulty=problem_in.difficulty,
        time_limit_seconds=problem_in.time_limit_seconds,
        memory_limit_mb=problem_in.memory_limit_mb,
        tags=problem_in.tags,
        starter_code=problem_in.starter_code,
        function_name=problem_in.function_name,
        function_signature=problem_in.function_signature,
        input_format=problem_in.input_format,
        output_format=problem_in.output_format,
        constraints=problem_in.constraints
    )
    db.add(problem)
    db.flush()

    for idx, tc in enumerate(problem_in.test_cases):
        test_case = TestCase(
            problem_id=problem.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            is_hidden=tc.is_hidden,
            test_type=tc.test_type,
            explanation=tc.explanation,
            weight=tc.weight,
            order_index=idx
        )
        db.add(test_case)

    db.commit()
    db.refresh(problem)

    safe_test_cases = [TestCasePublicRead.from_orm_safe(tc) for tc in problem.test_cases]
    return ProblemRead(
        id=problem.id,
        slug=problem.slug,
        title=problem.title,
        description=problem.description,
        difficulty=problem.difficulty,
        time_limit_seconds=problem.time_limit_seconds,
        memory_limit_mb=problem.memory_limit_mb,
        tags=problem.tags,
        starter_code=problem.starter_code,
        function_name=problem.function_name,
        function_signature=problem.function_signature,
        input_format=problem.input_format,
        output_format=problem.output_format,
        constraints=problem.constraints,
        created_at=problem.created_at,
        updated_at=problem.updated_at,
        test_cases=safe_test_cases
    )

@router.delete("/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    db.delete(problem)
    db.commit()
    return None
