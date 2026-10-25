from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAIProvider(ABC):
    @abstractmethod
    def evaluate_code(
        self,
        problem_title: str,
        problem_description: str,
        code: str,
        test_summary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Produce structured evaluation report for a code submission.
        """
        pass

    @abstractmethod
    def compare_solutions(
        self,
        problem_title: str,
        problem_description: str,
        solution_a: str,
        solution_b: str,
        metrics_a: Dict[str, Any],
        metrics_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare two candidate solutions pairwise.
        """
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass
