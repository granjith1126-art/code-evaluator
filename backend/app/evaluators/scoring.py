from typing import Dict, Any, List

class ScoringEngine:
    """
    Transparent scoring model:
    - Functional correctness: 60 points max
    - Edge cases: 20 points max
    - Code quality: 10 points max
    - Efficiency: 10 points max
    Total: 100 points
    """

    def calculate_scores(
        self,
        test_results: List[Dict[str, Any]],
        quality_score_10: float,
        execution_time_ms: float,
        time_limit_seconds: float
    ) -> Dict[str, float]:
        if not test_results:
            return {
                "functional_score": 0.0,
                "edge_cases_score": 0.0,
                "quality_score": 0.0,
                "efficiency_score": 0.0,
                "deterministic_score": 0.0,
                "total_score": 0.0,
                "pass_rate": 0.0,
                "tests_passed": 0,
                "tests_total": 0
            }

        public_tests = [tr for tr in test_results if not tr.get("is_hidden", False)]
        hidden_tests = [tr for tr in test_results if tr.get("is_hidden", False)]

        # If there are no hidden tests, treat all tests as standard functional
        if not hidden_tests:
            public_passed = sum(1 for tr in test_results if tr.get("passed", False))
            public_rate = public_passed / len(test_results)
            functional_score = round(public_rate * 60.0, 1)
            edge_cases_score = round(public_rate * 20.0, 1)
        else:
            public_passed = sum(1 for tr in public_tests if tr.get("passed", False))
            public_rate = (public_passed / len(public_tests)) if public_tests else 1.0
            functional_score = round(public_rate * 60.0, 1)

            hidden_passed = sum(1 for tr in hidden_tests if tr.get("passed", False))
            hidden_rate = hidden_passed / len(hidden_tests)
            edge_cases_score = round(hidden_rate * 20.0, 1)

        # Efficiency score: 10 points if executed well within time limit
        time_limit_ms = max(100.0, time_limit_seconds * 1000.0)
        all_passed = all(tr.get("passed", False) for tr in test_results)
        
        if not all_passed:
            efficiency_score = 0.0
        elif execution_time_ms <= (time_limit_ms * 0.25):
            efficiency_score = 10.0
        elif execution_time_ms <= (time_limit_ms * 0.5):
            efficiency_score = 8.0
        elif execution_time_ms <= (time_limit_ms * 0.8):
            efficiency_score = 5.0
        elif execution_time_ms <= time_limit_ms:
            efficiency_score = 3.0
        else:
            efficiency_score = 0.0

        # Quality score (from AST analyzer)
        code_quality_pts = round(quality_score_10, 1)

        deterministic_score = round(functional_score + edge_cases_score, 1)
        total_score = round(deterministic_score + code_quality_pts + efficiency_score, 1)

        tests_passed = sum(1 for tr in test_results if tr.get("passed", False))
        tests_total = len(test_results)
        pass_rate = round((tests_passed / tests_total) * 100.0, 1) if tests_total > 0 else 0.0

        return {
            "functional_score": functional_score,
            "edge_cases_score": edge_cases_score,
            "quality_score": code_quality_pts,
            "efficiency_score": efficiency_score,
            "deterministic_score": deterministic_score,
            "total_score": min(100.0, total_score),
            "pass_rate": pass_rate,
            "tests_passed": tests_passed,
            "tests_total": tests_total
        }

scoring_engine = ScoringEngine()
