from typing import Dict, Any, List
from app.sandbox.runner import sandbox_manager
from app.evaluators.quality import quality_analyzer
from app.evaluators.scoring import scoring_engine

class DeterministicEvaluator:
    """
    Independent grading engine: executes code against test cases,
    computes deterministic scores, AST quality metrics, and categorizes errors.
    """

    def evaluate(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        function_name: str = None,
        time_limit_seconds: float = 2.0,
        memory_limit_mb: int = 128
    ) -> Dict[str, Any]:
        # 1. AST Quality Analysis
        quality_info = quality_analyzer.analyze(code)

        # 2. Execute in Sandbox
        sandbox = sandbox_manager.get_sandbox()
        sandbox_result = sandbox.execute(
            code=code,
            test_cases=test_cases,
            function_name=function_name,
            timeout_seconds=time_limit_seconds,
            memory_limit_mb=memory_limit_mb
        )

        # 3. Calculate Scores
        scores = scoring_engine.calculate_scores(
            test_results=sandbox_result.results,
            quality_score_10=quality_info["score"],
            execution_time_ms=sandbox_result.execution_time_ms,
            time_limit_seconds=time_limit_seconds
        )

        return {
            "status": sandbox_result.status,
            "execution_time_ms": sandbox_result.execution_time_ms,
            "memory_usage_kb": sandbox_result.memory_usage_kb,
            "error_category": sandbox_result.error_category,
            "error_message": sandbox_result.error_message,
            "stdout": sandbox_result.stdout,
            "stderr": sandbox_result.stderr,
            "sandbox_mode": sandbox_result.sandbox_mode,
            "test_results": sandbox_result.results,
            "quality_analysis": quality_info,
            "scores": scores
        }

deterministic_evaluator = DeterministicEvaluator()
