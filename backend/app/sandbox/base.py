from abc import ABC, abstractmethod
from typing import Dict, Any, List

class SandboxExecutionResult:
    def __init__(
        self,
        status: str,
        execution_time_ms: float,
        memory_usage_kb: float,
        results: List[Dict[str, Any]],
        stdout: str = "",
        stderr: str = "",
        error_category: str = None,
        error_message: str = None,
        sandbox_mode: str = "subprocess"
    ):
        self.status = status
        self.execution_time_ms = execution_time_ms
        self.memory_usage_kb = memory_usage_kb
        self.results = results
        self.stdout = stdout
        self.stderr = stderr
        self.error_category = error_category
        self.error_message = error_message
        self.sandbox_mode = sandbox_mode

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "execution_time_ms": self.execution_time_ms,
            "memory_usage_kb": self.memory_usage_kb,
            "results": self.results,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "error_category": self.error_category,
            "error_message": self.error_message,
            "sandbox_mode": self.sandbox_mode
        }

class BaseSandbox(ABC):
    @abstractmethod
    def execute(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        function_name: str = None,
        timeout_seconds: float = 5.0,
        memory_limit_mb: int = 128
    ) -> SandboxExecutionResult:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass
