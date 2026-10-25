from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.entities import Problem, Submission, AIEvaluation, HumanReview, Dataset
from app.schemas.analytics import DashboardStats

router = APIRouter()

@router.get("/analytics/dashboard", response_model=DashboardStats)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    total_problems = db.query(Problem).count()
    total_submissions = db.query(Submission).count()
    failed_evaluations = db.query(Submission).filter(Submission.status != "Accepted").count()
    ai_evaluations_count = db.query(AIEvaluation).count()
    human_reviews_count = db.query(HumanReview).count()
    datasets_count = db.query(Dataset).count()

    # Pass rate
    if total_submissions > 0:
        avg_pass_rate = db.query(func.avg(Submission.pass_rate)).scalar() or 0.0
        overall_pass_rate = round(float(avg_pass_rate), 1)
    else:
        overall_pass_rate = 0.0

    # Recent activity
    recent_subs = db.query(Submission).order_by(Submission.id.desc()).limit(10).all()
    recent_activity = [
        {
            "id": s.id,
            "problem_id": s.problem_id,
            "problem_title": s.problem.title if s.problem else "Unknown",
            "status": s.status,
            "total_score": s.total_score,
            "pass_rate": s.pass_rate,
            "execution_time_ms": s.execution_time_ms,
            "created_at": s.created_at.isoformat()
        }
        for s in recent_subs
    ]

    # Failure categories
    failure_group = (
        db.query(Submission.error_category, func.count(Submission.id))
        .filter(Submission.status != "Accepted", Submission.error_category != None)
        .group_by(Submission.error_category)
        .all()
    )
    failure_categories = [
        {"category": cat or "Uncategorized", "count": count}
        for cat, count in failure_group
    ]

    # Evaluations by provider
    provider_group = (
        db.query(AIEvaluation.provider, AIEvaluation.model, func.count(AIEvaluation.id))
        .group_by(AIEvaluation.provider, AIEvaluation.model)
        .all()
    )
    evaluations_by_provider = [
        {"provider": p, "model": m, "count": count}
        for p, m, count in provider_group
    ]

    # Evaluation trends (last 7 days or mock series if empty)
    trends = []
    if total_submissions > 0:
        trend_group = (
            db.query(
                func.date(Submission.created_at).label("day"),
                func.count(Submission.id).label("count"),
                func.avg(Submission.pass_rate).label("avg_pass")
            )
            .group_by("day")
            .order_by("day")
            .limit(14)
            .all()
        )
        for day, cnt, avg_p in trend_group:
            trends.append({
                "date": str(day),
                "submissions": cnt,
                "pass_rate": round(float(avg_p or 0.0), 1)
            })

    return DashboardStats(
        total_problems=total_problems,
        total_submissions=total_submissions,
        overall_pass_rate=overall_pass_rate,
        failed_evaluations=failed_evaluations,
        ai_evaluations_count=ai_evaluations_count,
        human_reviews_count=human_reviews_count,
        datasets_count=datasets_count,
        recent_activity=recent_activity,
        failure_categories=failure_categories,
        evaluations_by_provider=evaluations_by_provider,
        evaluation_trends=trends
    )
