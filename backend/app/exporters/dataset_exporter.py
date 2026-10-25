import json
import hashlib
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Submission, Problem, HumanReview, AIEvaluation, Dataset, DatasetRecord

class DatasetExporter:
    """
    Generates structured AI training and evaluation datasets with provenance hashing.
    Outputs in standard JSON and JSONL formats.
    """

    @staticmethod
    def compute_provenance_hash(record_data: Dict[str, Any]) -> str:
        serialized = json.dumps(record_data, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def build_record_for_submission(
        self,
        submission: Submission,
        db: Session
    ) -> Dict[str, Any]:
        problem = submission.problem
        human_review = db.query(HumanReview).filter(HumanReview.submission_id == submission.id).first()
        ai_eval = db.query(AIEvaluation).filter(AIEvaluation.submission_id == submission.id).first()

        record = {
            "submission_id": submission.id,
            "problem_id": problem.id,
            "problem_slug": problem.slug,
            "problem_title": problem.title,
            "problem_statement": problem.description,
            "difficulty": problem.difficulty,
            "programming_language": submission.language,
            "candidate_solution": submission.code,
            "deterministic_execution": {
                "status": submission.status,
                "pass_rate": submission.pass_rate,
                "tests_passed": submission.tests_passed,
                "tests_total": submission.tests_total,
                "execution_time_ms": submission.execution_time_ms,
                "memory_usage_kb": submission.memory_usage_kb,
                "scores": {
                    "deterministic_score": submission.deterministic_score,
                    "functional_score": submission.functional_score,
                    "edge_cases_score": submission.edge_cases_score,
                    "quality_score": submission.quality_score,
                    "efficiency_score": submission.efficiency_score,
                    "total_score": submission.total_score
                },
                "error_category": submission.error_category,
                "error_message": submission.error_message
            },
            "ai_evaluation": {
                "available": bool(ai_eval),
                "provider": ai_eval.provider if ai_eval else None,
                "model": ai_eval.model if ai_eval else None,
                "overall_assessment": ai_eval.overall_assessment if ai_eval else None,
                "scores": {
                    "correctness": ai_eval.correctness_score if ai_eval else None,
                    "efficiency": ai_eval.efficiency_score if ai_eval else None,
                    "readability": ai_eval.readability_score if ai_eval else None,
                    "maintainability": ai_eval.maintainability_score if ai_eval else None,
                    "security": ai_eval.security_score if ai_eval else None
                } if ai_eval else None,
                "bugs_identified": ai_eval.bugs_identified if ai_eval else [],
                "confidence": ai_eval.confidence if ai_eval else None
            },
            "human_review": {
                "reviewed": bool(human_review),
                "reviewer_id": human_review.reviewer_id if human_review else None,
                "failure_category": human_review.failure_category if human_review else None,
                "human_authored_rationale": human_review.rationale if human_review else None,
                "scores": {
                    "correctness": human_review.correctness_score if human_review else None,
                    "efficiency": human_review.efficiency_score if human_review else None,
                    "readability": human_review.readability_score if human_review else None,
                    "maintainability": human_review.maintainability_score if human_review else None,
                    "security": human_review.security_score if human_review else None
                } if human_review else None,
                "ambiguity_reported": human_review.ambiguity_reported if human_review else False,
                "rubric_id": human_review.rubric_id if human_review else None
            },
            "provenance": {
                "created_at": submission.created_at.isoformat(),
                "data_source": "AI Code Evaluator Benchmark Suite",
                "contains_human_annotations": bool(human_review)
            }
        }

        record["provenance_hash"] = self.compute_provenance_hash(record)
        return record

    def export_as_json(self, records: List[Dict[str, Any]]) -> str:
        return json.dumps(records, indent=2)

    def export_as_jsonl(self, records: List[Dict[str, Any]]) -> str:
        lines = [json.dumps(rec) for rec in records]
        return "\n".join(lines)

dataset_exporter = DatasetExporter()
