import pytest
from app.evaluators.scoring import scoring_engine
from app.evaluators.quality import quality_analyzer
from app.evaluators.deterministic import deterministic_evaluator

def test_scoring_engine_all_passed():
    test_results = [
        {"passed": True, "is_hidden": False},
        {"passed": True, "is_hidden": False},
        {"passed": True, "is_hidden": True},
        {"passed": True, "is_hidden": True},
    ]
    scores = scoring_engine.calculate_scores(
        test_results=test_results,
        quality_score_10=9.0,
        execution_time_ms=50.0,
        time_limit_seconds=2.0
    )
    assert scores["functional_score"] == 60.0
    assert scores["edge_cases_score"] == 20.0
    assert scores["quality_score"] == 9.0
    assert scores["efficiency_score"] == 10.0
    assert scores["total_score"] == 99.0
    assert scores["pass_rate"] == 100.0

def test_scoring_engine_partial_failure():
    test_results = [
        {"passed": True, "is_hidden": False},
        {"passed": False, "is_hidden": False},
        {"passed": True, "is_hidden": True},
        {"passed": False, "is_hidden": True},
    ]
    scores = scoring_engine.calculate_scores(
        test_results=test_results,
        quality_score_10=7.0,
        execution_time_ms=300.0,
        time_limit_seconds=2.0
    )
    assert scores["functional_score"] == 30.0
    assert scores["edge_cases_score"] == 10.0
    assert scores["pass_rate"] == 50.0
    assert scores["efficiency_score"] == 0.0  # not all passed

def test_quality_analyzer_clean_code():
    code = """def add_numbers(a: int, b: int) -> int:
    \"\"\"Add two integers.\"\"\"
    return a + b
"""
    res = quality_analyzer.analyze(code)
    assert res["score"] >= 8.0
    assert res["cyclomatic_complexity"] == 1
    assert res["has_docstrings"] is True
    assert res["naming_conventions_followed"] is True

def test_quality_analyzer_high_complexity():
    code = """def complex_logic(x):
    if x > 1:
        if x > 2:
            if x > 3:
                if x > 4:
                    if x > 5:
                        return 5
    return 0
"""
    res = quality_analyzer.analyze(code)
    assert res["cyclomatic_complexity"] >= 6
    assert any("nesting" in fb.lower() or "complexity" in fb.lower() for fb in res["feedback"])

def test_deterministic_evaluator_syntax_error():
    code = "def broken_code(: print('fail')"
    res = deterministic_evaluator.evaluate(
        code=code,
        test_cases=[{"id": 1, "input_data": "[1]", "expected_output": "1", "test_type": "function", "is_hidden": False}],
        function_name="broken_code"
    )
    assert res["status"] == "Invalid Submission"
    assert res["error_category"] == "SyntaxError"
