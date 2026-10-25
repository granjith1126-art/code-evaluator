from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import HumanReview, ReviewHistory, Rubric, Submission, AIEvaluation
from app.schemas.review import (
    HumanReviewCreate, HumanReviewUpdate, HumanReviewRead,
    RubricCreate, RubricRead, ReviewHistoryRead
)
from app.schemas.common import PaginatedResponse
from app.api.v1.auth import get_current_user_optional

router = APIRouter()

# --- Rubrics ---
@router.get("/rubrics", response_model=List[RubricRead])
def list_rubrics(db: Session = Depends(get_db)):
    rubrics = db.query(Rubric).all()
    if not rubrics:
        # Seed default rubric
        default_rubric = Rubric(
            name="Standard Code Evaluation Rubric",
            version="1.0.0",
            criteria_weights={
                "correctness": 0.35,
                "efficiency": 0.20,
                "readability": 0.20,
                "maintainability": 0.15,
                "security": 0.10
            },
            description="Production evaluation rubric for code correctness, performance, maintainability, and safety.",
            is_active=True
        )
        db.add(default_rubric)
        db.commit()
        db.refresh(default_rubric)
        return [default_rubric]
    return rubrics

@router.post("/rubrics", response_model=RubricRead, status_code=status.HTTP_201_CREATED)
def create_rubric(rubric_in: RubricCreate, db: Session = Depends(get_db)):
    rubric = Rubric(
        name=rubric_in.name,
        version=rubric_in.version,
        criteria_weights=rubric_in.criteria_weights,
        description=rubric_in.description,
        is_active=rubric_in.is_active
    )
    db.add(rubric)
    db.commit()
    db.refresh(rubric)
    return rubric

# --- Human Reviews ---
@router.post("/reviews", response_model=HumanReviewRead, status_code=status.HTTP_201_CREATED)
def create_human_review(
    review_in: HumanReviewCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    submission = db.query(Submission).filter(Submission.id == review_in.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    review = HumanReview(
        submission_id=review_in.submission_id,
        reviewer_id=current_user.id if current_user else None,
        rubric_id=review_in.rubric_id,
        correctness_score=review_in.correctness_score,
        efficiency_score=review_in.efficiency_score,
        readability_score=review_in.readability_score,
        maintainability_score=review_in.maintainability_score,
        security_score=review_in.security_score,
        failure_category=review_in.failure_category,
        rationale=review_in.rationale,
        status=review_in.status,
        ambiguity_reported=review_in.ambiguity_reported
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.put("/reviews/{review_id}", response_model=HumanReviewRead)
def update_human_review(
    review_id: int,
    update_in: HumanReviewUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    review = db.query(HumanReview).filter(HumanReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    prev_state = {
        "correctness_score": review.correctness_score,
        "efficiency_score": review.efficiency_score,
        "readability_score": review.readability_score,
        "maintainability_score": review.maintainability_score,
        "security_score": review.security_score,
        "failure_category": review.failure_category,
        "rationale": review.rationale,
        "status": review.status,
        "ambiguity_reported": review.ambiguity_reported
    }

    if update_in.correctness_score is not None:
        review.correctness_score = update_in.correctness_score
    if update_in.efficiency_score is not None:
        review.efficiency_score = update_in.efficiency_score
    if update_in.readability_score is not None:
        review.readability_score = update_in.readability_score
    if update_in.maintainability_score is not None:
        review.maintainability_score = update_in.maintainability_score
    if update_in.security_score is not None:
        review.security_score = update_in.security_score
    if update_in.failure_category is not None:
        review.failure_category = update_in.failure_category
    if update_in.rationale is not None:
        review.rationale = update_in.rationale
    if update_in.ambiguity_reported is not None:
        review.ambiguity_reported = update_in.ambiguity_reported
    if update_in.status is not None:
        review.status = update_in.status

    new_state = {
        "correctness_score": review.correctness_score,
        "efficiency_score": review.efficiency_score,
        "readability_score": review.readability_score,
        "maintainability_score": review.maintainability_score,
        "security_score": review.security_score,
        "failure_category": review.failure_category,
        "rationale": review.rationale,
        "status": review.status,
        "ambiguity_reported": review.ambiguity_reported
    }

    # Record history
    history = ReviewHistory(
        human_review_id=review.id,
        reviewer_id=current_user.id if current_user else None,
        previous_state=prev_state,
        new_state=new_state,
        change_reason=update_in.change_reason
    )
    db.add(history)
    db.commit()
    db.refresh(review)

    return review

@router.get("/reviews", response_model=PaginatedResponse)
def list_reviews(
    submission_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(HumanReview)
    if submission_id:
        query = query.filter(HumanReview.submission_id == submission_id)

    total = query.count()
    items = query.order_by(HumanReview.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    summaries = [HumanReviewRead.model_validate(r) for r in items]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=summaries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
