import subprocess
import json
import tempfile
import os
import shutil
from typing import Dict, Any, List
from app.sandbox.base import BaseSandbox, SandboxExecutionResult

class DockerSandbox(BaseSandbox):
    def __init__(self, image_name: str = "code-evaluator-sandbox:latest"):
        self.image_name = image_name

    def is_available(self) -> bool:
        try:
            res = subprocess.run(
                ["docker", "info"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=3.0,
                check=False
            )
            return res.returncode == 0
        except Exception:
            return False

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
                error_category="DockerUnavailable",
                error_message="Docker daemon is not reachable or not running. Please start Docker Desktop.",
                sandbox_mode="docker"
            )

        payload = {
            "code": code,
            "function_name": function_name,
            "test_cases": test_cases
        }

        # Create temporary payload file
        temp_dir = tempfile.mkdtemp(prefix="eval_docker_")
        payload_file = os.path.join(temp_dir, "payload.json")
        try:
            with open(payload_file, "w", encoding="utf-8") as f:
                json.dump(payload, f)

            # Strict Docker sandbox arguments
            cmd = [
                "docker", "run",
                "--rm",
                "--network", "none",                           # Completely disabled network
                "--memory", f"{memory_limit_mb}m",             # Hard memory cap
                "--memory-swap", f"{memory_limit_mb}m",        # No swap
                "--cpus", "1.0",                               # Single CPU cap
                "--pids-limit", "64",                          # Prevent fork-bombs
                "--cap-drop", "ALL",                           # Drop all Linux capabilities
                "--security-opt", "no-new-privileges",         # Prevent privilege escalation
                "-v", f"{payload_file}:/workspace/payload.json:ro", # Read-only input payload
                self.image_name,
                "/workspace/payload.json"
            ]

            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout_seconds,
                text=True,
                check=False
            )

            if proc.returncode != 0:
                # Check for OOM (137) or container error
                if proc.returncode == 137:
                    return SandboxExecutionResult(
                        status="Memory Limit Exceeded",
                        execution_time_ms=timeout_seconds * 1000.0,
                        memory_usage_kb=memory_limit_mb * 1024.0,
                        results=[],
                        error_category="MemoryLimitExceeded",
                        error_message=f"Process exceeded memory limit of {memory_limit_mb} MB (SIGKILL 137)",
                        sandbox_mode="docker"
                    )
                return SandboxExecutionResult(
                    status="Infrastructure Error",
                    execution_time_ms=0.0,
                    memory_usage_kb=0.0,
                    results=[],
                    error_category="ContainerError",
                    error_message=f"Docker container returned exit code {proc.returncode}: {proc.stderr}",
                    stderr=proc.stderr,
                    sandbox_mode="docker"
                )

            data = json.loads(proc.stdout)
            return SandboxExecutionResult(
                status=data.get("status", "Accepted"),
                execution_time_ms=data.get("execution_time_ms", 0.0),
                memory_usage_kb=data.get("memory_usage_kb", 0.0),
                results=data.get("results", []),
                stdout=data.get("stdout", ""),
                stderr=data.get("stderr", ""),
                error_category=data.get("error_category"),
                error_message=data.get("error_message"),
                sandbox_mode="docker"
            )
        except subprocess.TimeoutExpired:
            return SandboxExecutionResult(
                status="Time Limit Exceeded",
                execution_time_ms=timeout_seconds * 1000.0,
                memory_usage_kb=0.0,
                results=[],
                error_category="TimeLimitExceeded",
                error_message=f"Execution timed out after {timeout_seconds} seconds.",
                sandbox_mode="docker"
            )
        except Exception as e:
            return SandboxExecutionResult(
                status="Infrastructure Error",
                execution_time_ms=0.0,
                memory_usage_kb=0.0,
                results=[],
                error_category=type(e).__name__,
                error_message=str(e),
                sandbox_mode="docker"
            )
        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
