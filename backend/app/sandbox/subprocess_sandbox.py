import subprocess
import json
import tempfile
import os
import sys
import shutil
import time
import psutil
from typing import Dict, Any, List
from app.sandbox.base import BaseSandbox, SandboxExecutionResult

class SubprocessSandbox(BaseSandbox):
    def __init__(self, runner_path: str = None, max_output_bytes: int = 65536):
        if runner_path is None:
            # Locate execution/runner.py relative to backend
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            self.runner_path = os.path.join(base_dir, "execution", "runner.py")
        else:
            self.runner_path = runner_path
        self.max_output_bytes = max_output_bytes

    def is_available(self) -> bool:
        return os.path.exists(self.runner_path)

    def execute(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        function_name: str = None,
        timeout_seconds: float = 5.0,
        memory_limit_mb: int = 128
    ) -> SandboxExecutionResult:
        if not self.is_available():
            return SandboxExecutionResult(
                status="Infrastructure Error",
                execution_time_ms=0.0,
                memory_usage_kb=0.0,
                results=[],
                error_category="RunnerNotFound",
                error_message=f"Runner script not found at {self.runner_path}",
                sandbox_mode="subprocess"
            )

        payload = {
            "code": code,
            "function_name": function_name,
            "test_cases": test_cases
        }

        temp_dir = tempfile.mkdtemp(prefix="eval_subp_")
        payload_file = os.path.join(temp_dir, "payload.json")

        try:
            with open(payload_file, "w", encoding="utf-8") as f:
                json.dump(payload, f)

            start_time = time.perf_counter()
            
            # Spawn isolated python process
            proc = subprocess.Popen(
                [sys.executable, self.runner_path, payload_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=temp_dir
            )

            # Monitor memory usage and timeout
            peak_memory_kb = 0.0
            timed_out = False
            oom = False
            
            try:
                ps_proc = psutil.Process(proc.pid)
            except Exception:
                ps_proc = None

            timeout_deadline = time.time() + timeout_seconds

            while proc.poll() is None:
                if time.time() > timeout_deadline:
                    timed_out = True
                    proc.kill()
                    break

                if ps_proc:
                    try:
                        mem_info = ps_proc.memory_info()
                        mem_kb = mem_info.rss / 1024.0
                        if mem_kb > peak_memory_kb:
                            peak_memory_kb = mem_kb
                        if mem_kb > (memory_limit_mb * 1024.0):
                            oom = True
                            proc.kill()
                            break
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                time.sleep(0.01)

            stdout, stderr = proc.communicate()
            total_duration_ms = (time.perf_counter() - start_time) * 1000.0

            if timed_out:
                return SandboxExecutionResult(
                    status="Time Limit Exceeded",
                    execution_time_ms=round(timeout_seconds * 1000.0, 2),
                    memory_usage_kb=round(peak_memory_kb, 2),
                    results=[],
                    error_category="TimeLimitExceeded",
                    error_message=f"Execution timed out after {timeout_seconds} seconds (Infinite loop or slow algorithm).",
                    sandbox_mode="subprocess"
                )

            if oom:
                return SandboxExecutionResult(
                    status="Memory Limit Exceeded",
                    execution_time_ms=round(total_duration_ms, 2),
                    memory_usage_kb=round(peak_memory_kb, 2),
                    results=[],
                    error_category="MemoryLimitExceeded",
                    error_message=f"Process exceeded memory limit of {memory_limit_mb} MB.",
                    sandbox_mode="subprocess"
                )

            if proc.returncode != 0 and not stdout:
                return SandboxExecutionResult(
                    status="Runtime Error",
                    execution_time_ms=round(total_duration_ms, 2),
                    memory_usage_kb=round(peak_memory_kb, 2),
                    results=[],
                    error_category="ProcessAborted",
                    error_message=stderr.strip() or f"Process failed with exit code {proc.returncode}",
                    stderr=stderr,
                    sandbox_mode="subprocess"
                )

            # Cap output size
            if len(stdout) > self.max_output_bytes:
                stdout = stdout[:self.max_output_bytes] + "\n[OUTPUT TRUNCATED - SIZE LIMIT EXCEEDED]"

            try:
                data = json.loads(stdout)
                return SandboxExecutionResult(
                    status=data.get("status", "Accepted"),
                    execution_time_ms=data.get("execution_time_ms", round(total_duration_ms, 2)),
                    memory_usage_kb=round(peak_memory_kb, 2),
                    results=data.get("results", []),
                    stdout=data.get("stdout", ""),
                    stderr=data.get("stderr", ""),
                    error_category=data.get("error_category"),
                    error_message=data.get("error_message"),
                    sandbox_mode="subprocess"
                )
            except Exception as e:
                return SandboxExecutionResult(
                    status="Infrastructure Error",
                    execution_time_ms=round(total_duration_ms, 2),
                    memory_usage_kb=round(peak_memory_kb, 2),
                    results=[],
                    error_category="JSONDecodeError",
                    error_message=f"Failed to decode runner output: {e}. Output was: {stdout[:200]}",
                    stdout=stdout,
                    stderr=stderr,
                    sandbox_mode="subprocess"
                )

        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
