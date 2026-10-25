import pytest
import time
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
    # Output should execute and truncate if over max limit
    assert res.status in ["Accepted", "Wrong Answer"]

def test_memory_bomb_protection():
    sandbox = sandbox_manager.get_sandbox()
    code = """def solve():
    # Attempt to allocate excessive memory
    a = [0] * (100 * 1024 * 1024)  # ~800MB
    return len(a)
"""
    res = sandbox.execute(
        code=code,
        test_cases=[{"id": 1, "input_data": "[]", "expected_output": "0", "test_type": "function", "is_hidden": False}],
        function_name="solve",
        timeout_seconds=2.0,
        memory_limit_mb=64
    )
    # Process must terminate with Memory Limit Exceeded, Runtime Error (MemoryError), or ProcessAborted
    assert res.status in ["Memory Limit Exceeded", "Runtime Error", "Infrastructure Error"]
