import pytest
import time
import os
from app.sandbox.runner import sandbox_manager

def test_infinite_loop_timeout():
    sandbox = sandbox_manager.get_sandbox()
    code = """def solve():
    while True:
        pass
"""
    res = sandbox.execute(
        code=code,
        test_cases=[{"id": 1, "input_data": "[]", "expected_output": "0", "test_type": "function", "is_hidden": False}],
        function_name="solve",
        timeout_seconds=1.5
    )
    assert res.status == "Time Limit Exceeded"
    assert res.error_category == "TimeLimitExceeded"

def test_runtime_error_division_by_zero():
    sandbox = sandbox_manager.get_sandbox()
    code = """def solve(x):
    return 10 // x
"""
    res = sandbox.execute(
        code=code,
        test_cases=[{"id": 1, "input_data": "[0]", "expected_output": "0", "test_type": "function", "is_hidden": False}],
        function_name="solve",
        timeout_seconds=2.0
    )
    assert res.status == "Runtime Error"
    assert "ZeroDivisionError" in (res.error_category or "")

def test_output_size_truncation():
    sandbox = sandbox_manager.get_sandbox()
    code = """def solve():
    print("A" * 100000)
    return "ok"
"""
    res = sandbox.execute(
        code=code,
        test_cases=[{"id": 1, "input_data": "[]", "expected_output": '"ok"', "test_type": "function", "is_hidden": False}],
        function_name="solve",
        timeout_seconds=2.0
    )
    assert res.status in ["Accepted", "Wrong Answer"]

def test_memory_bomb_protection():
    sandbox = sandbox_manager.get_sandbox()
    code = """def solve():
    a = [0] * (100 * 1024 * 1024)
    return len(a)
"""
    res = sandbox.execute(
        code=code,
        test_cases=[{"id": 1, "input_data": "[]", "expected_output": "0", "test_type": "function", "is_hidden": False}],
        function_name="solve",
        timeout_seconds=2.0,
        memory_limit_mb=64
    )
    assert res.status in ["Memory Limit Exceeded", "Runtime Error", "Infrastructure Error"]

def test_env_secrets_not_leaked_to_untrusted_code():
    """
    CRITICAL SECURITY TEST:
    Verify that untrusted submitted code cannot read host environment variables
    containing API keys, database credentials, or secret keys.
    """
    sandbox = sandbox_manager.get_sandbox()
    code = """import os

def solve():
    # Attempt to read sensitive keys from environment
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    secret_key = os.environ.get("SECRET_KEY", "")
    db_url = os.environ.get("DATABASE_URL", "")
    return [openai_key, gemini_key, secret_key, db_url]
"""
    res = sandbox.execute(
        code=code,
        test_cases=[{"id": 1, "input_data": "[]", "expected_output": '["", "", "", ""]', "test_type": "function", "is_hidden": False}],
        function_name="solve",
        timeout_seconds=2.0
    )
    assert res.status == "Accepted"
    # All sensitive keys must be completely empty inside the execution boundary
    import ast
    assert ast.literal_eval(res.results[0]["actual_output"]) == ["", "", "", ""]
