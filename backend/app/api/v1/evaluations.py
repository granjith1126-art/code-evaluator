from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Submission, Problem, AIEvaluation, SolutionComparison
from app.schemas.evaluation import (
    AIEvaluationRequest, AIEvaluationRead,
    SolutionComparisonRequest, SolutionComparisonRead,
    HumanOverrideRequest
)
from app.providers.factory import ai_provider_factory

router = APIRouter()

@router.post("/evaluations/ai", response_model=AIEvaluationRead)
def evaluate_submission_with_ai(
    eval_req: AIEvaluationRequest,
    db: Session = Depends(get_db)
):
    submission = db.query(Submission).filter(Submission.id == eval_req.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    problem = submission.problem

    # Check if already evaluated with AI
    existing = db.query(AIEvaluation).filter(AIEvaluation.submission_id == submission.id).first()
    if existing:
        return existing

    provider = ai_provider_factory.get_provider(eval_req.provider)

    test_summary = {
        "status": submission.status,
        "tests_passed": submission.tests_passed,
        "tests_total": submission.tests_total,
        "pass_rate": submission.pass_rate,
        "execution_time_ms": submission.execution_time_ms,
        "deterministic_score": submission.deterministic_score,
        "error_category": submission.error_category
    }

    try:
        report = provider.evaluate_code(
            problem_title=problem.title,
            problem_description=problem.description,
            code=submission.code,
            test_summary=test_summary
        )
    except Exception as e:
        # Graceful fallback to mock if API failed
        fallback_provider = ai_provider_factory.get_provider("mock")
        report = fallback_provider.evaluate_code(
            problem_title=problem.title,
            problem_description=problem.description,
            code=submission.code,
            test_summary=test_summary
        )
        report["overall_assessment"] = f"[Fallback: {str(e)[:80]}] " + report["overall_assessment"]

    ai_eval = AIEvaluation(
        submission_id=submission.id,
        provider=report.get("provider", "unknown"),
        model=report.get("model", "unknown"),
        overall_assessment=report.get("overall_assessment", ""),
        correctness_score=report.get("correctness_score", 0.0),
        efficiency_score=report.get("efficiency_score", 0.0),
        readability_score=report.get("readability_score", 0.0),
        maintainability_score=report.get("maintainability_score", 0.0),
        security_score=report.get("security_score", 0.0),
        robustness_score=report.get("robustness_score", 0.0),
        edge_cases_score=report.get("edge_cases_score", 0.0),
        instruction_following_score=report.get("instruction_following_score", 0.0),
        bugs_identified=report.get("bugs_identified", []),
        optimization_suggestions=report.get("optimization_suggestions", []),
        confidence=report.get("confidence", 1.0),
        raw_response=report.get("raw_response", "")
    )
    db.add(ai_eval)
    db.commit()
    db.refresh(ai_eval)

    return ai_eval

@router.get("/evaluations/ai/{submission_id}", response_model=AIEvaluationRead)
def get_ai_evaluation(submission_id: int, db: Session = Depends(get_db)):
    ai_eval = db.query(AIEvaluation).filter(AIEvaluation.submission_id == submission_id).first()
    if not ai_eval:
        raise HTTPException(status_code=404, detail="AI evaluation not found for this submission.")
    return ai_eval

@router.post("/evaluations/compare", response_model=SolutionComparisonRead)
def compare_solutions(
    comp_req: SolutionComparisonRequest,
    db: Session = Depends(get_db)
):
    sub_a = db.query(Submission).filter(Submission.id == comp_req.submission_a_id).first()
    sub_b = db.query(Submission).filter(Submission.id == comp_req.submission_b_id).first()
    if not sub_a or not sub_b:
        raise HTTPException(status_code=404, detail="One or both submissions not found")

    problem = db.query(Problem).filter(Problem.id == comp_req.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    provider = ai_provider_factory.get_provider(comp_req.provider)

    metrics_a = {
        "pass_rate": sub_a.pass_rate,
        "total_score": sub_a.total_score,
        "execution_time_ms": sub_a.execution_time_ms,
        "status": sub_a.status
    }
    metrics_b = {
        "pass_rate": sub_b.pass_rate,
        "total_score": sub_b.total_score,
        "execution_time_ms": sub_b.execution_time_ms,
        "status": sub_b.status
    }

    try:
        res = provider.compare_solutions(
            problem_title=problem.title,
            problem_description=problem.description,
            solution_a=sub_a.code,
            solution_b=sub_b.code,
            metrics_a=metrics_a,
            metrics_b=metrics_b
        )
    except Exception as e:
        fallback_provider = ai_provider_factory.get_provider("mock")
        res = fallback_provider.compare_solutions(
            problem_title=problem.title,
            problem_description=problem.description,
            solution_a=sub_a.code,
            solution_b=sub_b.code,
            metrics_a=metrics_a,
            metrics_b=metrics_b
        )
        res["written_justification"] = f"[Fallback: {str(e)[:80]}] " + res["written_justification"]

    comp = SolutionComparison(
        problem_id=problem.id,
        submission_a_id=sub_a.id,
        submission_b_id=sub_b.id,
        provider=res.get("provider", "unknown"),
        model=res.get("model", "unknown"),
        preferred_solution=res.get("preferred_solution", "tie"),
        functional_comparison=res.get("functional_comparison", ""),
        efficiency_comparison=res.get("efficiency_comparison", ""),
        readability_comparison=res.get("readability_comparison", ""),
        edge_case_comparison=res.get("edge_case_comparison", ""),
        written_justification=res.get("written_justification", ""),
        confidence=res.get("confidence", 1.0)
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)

    return comp

@router.post("/evaluations/compare/{comparison_id}/override", response_model=SolutionComparisonRead)
def override_solution_comparison(
    comparison_id: int,
    override_req: HumanOverrideRequest,
    db: Session = Depends(get_db)
):
    comp = db.query(SolutionComparison).filter(SolutionComparison.id == comparison_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Comparison record not found")

    comp.human_override_preferred = override_req.human_override_preferred
    comp.human_override_reason = override_req.human_override_reason
    db.commit()
    db.refresh(comp)
    return comp
