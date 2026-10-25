import sys
import os
import json
import time
import ast
import traceback
import io
import contextlib

def normalize_value(val):
    if isinstance(val, (int, float, bool, str, list, dict, type(None))):
        return val
    try:
        return json.loads(json.dumps(val))
    except Exception:
        return str(val)

def compare_outputs(actual, expected_str, tolerance=1e-5):
    """
    Compare actual output against expected_str.
    Supports exact string match, JSON representation match, and float tolerance.
    """
    actual_str = str(actual).strip()
    expected_str = expected_str.strip()

    # Exact string match
    if actual_str == expected_str:
        return True, actual_str

    # Attempt JSON/Python literal parsing on expected
    try:
        expected_obj = json.loads(expected_str)
    except Exception:
        try:
            expected_obj = ast.literal_eval(expected_str)
        except Exception:
            expected_obj = expected_str

    # Direct equality of objects
    if actual == expected_obj:
        return True, actual_str

    # Float comparison
    if isinstance(actual, (int, float)) and isinstance(expected_obj, (int, float)):
        if abs(actual - expected_obj) <= tolerance:
            return True, actual_str

    # Float list comparison
    if isinstance(actual, (list, tuple)) and isinstance(expected_obj, (list, tuple)):
        if len(actual) == len(expected_obj):
            all_match = True
            for a, e in zip(actual, expected_obj):
                if isinstance(a, (int, float)) and isinstance(e, (int, float)):
                    if abs(a - e) > tolerance:
                        all_match = False
                        break
                elif a != e:
                    all_match = False
                    break
            if all_match:
                return True, actual_str

    # String comparison with normalized line endings
    if actual_str.replace("\r\n", "\n") == expected_str.replace("\r\n", "\n"):
        return True, actual_str

    return False, actual_str

def execute_payload(payload):
    code = payload.get("code", "")
    function_name = payload.get("function_name")
    test_cases = payload.get("test_cases", [])
    
    results = []
    total_execution_ms = 0.0
    overall_status = "Accepted"
    first_error_msg = None
    first_error_cat = None

    # First, validate syntax with AST
    try:
        compiled_ast = ast.parse(code, filename="<solution>")
    except SyntaxError as se:
        return {
            "status": "Invalid Submission",
            "error_category": "SyntaxError",
            "error_message": f"SyntaxError at line {se.lineno}, col {se.offset}: {se.msg}",
            "execution_time_ms": 0.0,
            "results": [],
            "stdout": "",
            "stderr": f"SyntaxError: {se.msg}"
        }

    # Prepare execution namespace
    ns = {
        "__name__": "__main__",
        "__builtins__": __builtins__,
    }

    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()

    try:
        with contextlib.redirect_stdout(captured_stdout), contextlib.redirect_stderr(captured_stderr):
            exec(compile(compiled_ast, filename="<solution>", mode="exec"), ns)
    except Exception as e:
        tb = traceback.format_exc()
        return {
            "status": "Runtime Error",
            "error_category": type(e).__name__,
            "error_message": str(e),
            "execution_time_ms": 0.0,
            "results": [],
            "stdout": captured_stdout.getvalue(),
            "stderr": tb
        }

    for idx, tc in enumerate(test_cases):
        tc_id = tc.get("id", idx)
        input_data = tc.get("input_data", "")
        expected_output = tc.get("expected_output", "")
        test_type = tc.get("test_type", "function")
        is_hidden = tc.get("is_hidden", False)

        tc_start = time.perf_counter()
        tc_stdout = io.StringIO()
        tc_stderr = io.StringIO()

        tc_passed = False
        tc_status = "Passed"
        tc_actual = None
        tc_error = None

        try:
            with contextlib.redirect_stdout(tc_stdout), contextlib.redirect_stderr(tc_stderr):
                if test_type == "function" and function_name:
                    if function_name not in ns:
                        raise NameError(f"Function '{function_name}' not defined in submitted code.")
                    func = ns[function_name]
                    
                    # Parse arguments: JSON array or python expression
                    try:
                        args = json.loads(input_data)
                    except Exception:
                        try:
                            args = ast.literal_eval(input_data)
                        except Exception:
                            args = [input_data]
                    
                    if isinstance(args, list):
                        res = func(*args)
                    elif isinstance(args, dict):
                        res = func(**args)
                    else:
                        res = func(args)

                    tc_actual = normalize_value(res)
                    tc_passed, actual_str = compare_outputs(tc_actual, expected_output)
                    tc_actual = actual_str
                else:
                    # stdio execution
                    saved_stdin = sys.stdin
                    sys.stdin = io.StringIO(input_data)
                    try:
                        # Re-run for stdio with input
                        exec(compile(compiled_ast, filename="<solution>", mode="exec"), ns.copy())
                    finally:
                        sys.stdin = saved_stdin
                    
                    out = tc_stdout.getvalue().rstrip()
                    tc_actual = out
                    tc_passed, actual_str = compare_outputs(tc_actual, expected_output)
                    tc_actual = actual_str

            if not tc_passed:
                tc_status = "Wrong Answer"
                if overall_status == "Accepted":
                    overall_status = "Wrong Answer"
                    first_error_cat = "Wrong Answer"
                    first_error_msg = f"Test case {idx + 1} output mismatch"
        except Exception as e:
            tc_passed = False
            tc_status = "Runtime Error"
            tc_error = f"{type(e).__name__}: {str(e)}"
            if overall_status == "Accepted":
                overall_status = "Runtime Error"
                first_error_cat = type(e).__name__
                first_error_msg = str(e)

        tc_duration = (time.perf_counter() - tc_start) * 1000.0
        total_execution_ms += tc_duration

        results.append({
            "test_case_id": tc_id,
            "passed": tc_passed,
            "status": tc_status,
            "is_hidden": is_hidden,
            "actual_output": tc_actual if tc_actual is not None else "",
            "expected_output": expected_output,
            "execution_time_ms": round(tc_duration, 2),
            "memory_kb": 0.0,
            "error_message": tc_error
        })

    return {
        "status": overall_status,
        "error_category": first_error_cat,
        "error_message": first_error_msg,
        "execution_time_ms": round(total_execution_ms, 2),
        "results": results,
        "stdout": captured_stdout.getvalue(),
        "stderr": captured_stderr.getvalue()
    }

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--stdin":
        raw_input = sys.stdin.read()
    elif len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            raw_input = f.read()
    else:
        raw_input = sys.stdin.read()

    try:
        payload = json.loads(raw_input)
    except Exception as e:
        output = {
            "status": "Infrastructure Error",
            "error_category": "JSONDecodeError",
            "error_message": f"Runner input decode failed: {e}",
            "execution_time_ms": 0.0,
            "results": []
        }
        print(json.dumps(output))
        return

    res = execute_payload(payload)
    print(json.dumps(res))

if __name__ == "__main__":
    main()
