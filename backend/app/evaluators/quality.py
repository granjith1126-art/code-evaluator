import ast
from typing import Dict, Any, List

class CodeQualityAnalyzer:
    """
    Analyzes Python code without executing it using the AST.
    Evaluates:
    - Cyclomatic complexity
    - Function definitions & names (PEP 8 snake_case)
    - Docstrings & Comments
    - Code length & nest depth
    """

    def analyze(self, code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
        except SyntaxError:
            return {
                "score": 0.0,
                "cyclomatic_complexity": 0,
                "lines_of_code": len(code.splitlines()),
                "functions_found": 0,
                "has_docstrings": False,
                "naming_conventions_followed": False,
                "feedback": ["Code has syntax errors and could not be analyzed."]
            }

        lines = [line.strip() for line in code.splitlines() if line.strip() and not line.strip().startswith("#")]
        loc = len(lines)

        # Calculate cyclomatic complexity: 1 + number of branching points
        complexity = 1
        functions = 0
        docstrings = 0
        snake_case_names = True
        max_nesting = 0

        class ComplexityVisitor(ast.NodeVisitor):
            def __init__(self):
                self.current_depth = 0
                self.max_depth = 0

            def generic_visit(self, node):
                is_nest = isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.With))
                if is_nest:
                    self.current_depth += 1
                    if self.current_depth > self.max_depth:
                        self.max_depth = self.current_depth
                super().generic_visit(node)
                if is_nest:
                    self.current_depth -= 1

        visitor = ComplexityVisitor()
        visitor.visit(tree)
        max_nesting = visitor.max_depth

        for node in ast.walk(tree):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.ExceptHandler, ast.With, ast.Assert)):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                functions += 1
                # Check PEP8 snake_case
                name = node.name
                if not name.islower() and not name.startswith("__"):
                    snake_case_names = False
                # Check docstrings
                if ast.get_docstring(node):
                    docstrings += 1

        feedback = []
        quality_score = 10.0

        # Penalize excessive cyclomatic complexity
        if complexity > 10:
            penalty = min(4.0, (complexity - 10) * 0.5)
            quality_score -= penalty
            feedback.append(f"High cyclomatic complexity ({complexity}). Consider breaking logic into smaller helper functions.")
        else:
            feedback.append(f"Clean control flow with cyclomatic complexity of {complexity}.")

        # Deep nesting penalty
        if max_nesting > 4:
            quality_score -= 2.0
            feedback.append(f"Deeply nested control structures (depth {max_nesting}). Consider early returns.")

        # Naming convention
        if not snake_case_names and functions > 0:
            quality_score -= 1.5
            feedback.append("Functions should use standard PEP 8 snake_case naming conventions.")
        elif functions > 0:
            feedback.append("Good adherence to PEP 8 function naming conventions.")

        # Docstrings
        if functions > 0 and docstrings == functions:
            feedback.append("Excellent: functions include explanatory docstrings.")
        elif functions > 0 and docstrings == 0:
            quality_score -= 1.0
            feedback.append("Consider adding docstrings to describe function parameters and return values.")

        quality_score = max(1.0, min(10.0, round(quality_score, 1)))

        return {
            "score": quality_score,
            "cyclomatic_complexity": complexity,
            "lines_of_code": loc,
            "functions_found": functions,
            "has_docstrings": docstrings > 0,
            "naming_conventions_followed": snake_case_names,
            "feedback": feedback
        }

quality_analyzer = CodeQualityAnalyzer()
