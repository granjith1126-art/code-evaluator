# AI Code Evaluator — System Architecture

## 1. Architectural Overview

AI Code Evaluator is an enterprise-grade platform designed to evaluate code submissions, benchmark AI-generated programming solutions, execute pairwise solution comparisons, conduct human rubric reviews, and generate structured datasets for AI training and evaluation.

```
+-------------------------------------------------------------------------+
|                              Frontend UI                                |
|          React 19 + TypeScript + Vite + Tailwind CSS + Monaco           |
+-------------------------------------------------------------------------+
                                    |
                            REST API (HTTP/JSON)
                                    v
+-------------------------------------------------------------------------+
|                            FastAPI Backend                              |
|                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  |
|  | Problems & Testing |  |  AI Provider Layer |  |   Review Studio   |  |
|  |     Endpoints      |  | (Gemini / OpenAI)  |  |    & Rubrics      |  |
|  +--------------------+  +--------------------+  +-------------------+  |
|            |                        |                      |            |
|            v                        v                      v            |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |   Deterministic    |  |  Pairwise Solution |  | Dataset Exporter  |  |
|  |  Grading & Quality |  | Comparison Engine  |  |   (JSON / JSONL)  |  |
|  +--------------------+  +--------------------+  +-------------------+  |
+-------------------------------------------------------------------------+
       |                                                    |
       v                                                    v
+-----------------------------+              +----------------------------+
|   Execution Sandbox Layer   |              |     Persistence Layer      |
|                             |              |                            |
| [Docker Hardened Container] |              |  PostgreSQL / SQLite       |
|   - Network: NONE           |              |  SQLAlchemy 2.0 ORM        |
|   - Memory Cap: 128MB       |              |  Alembic Migrations        |
|   - Unprivileged User       |              +----------------------------+
|   - Wall-Clock Timeout      |
|                             |
| [Subprocess Fallback]       |
|   - psutil RSS Monitor      |
|   - Timeout Watchdog        |
+-----------------------------+
```

---

## 2. Core Modules

### 2.1 Deterministic Evaluation Engine
- **AST Parsing**: Inspects Python Abstract Syntax Trees for syntax errors prior to runtime, computing cyclomatic complexity, nesting depth, and adherence to PEP 8 naming conventions.
- **Test Runner**: Dispatches candidate solutions into the configured sandbox. Supports both function-signature testing (`func(*args)`) and standard I/O testing (`stdin/stdout`).
- **Assertion Normalizer**: Compares actual outputs against expected specifications using exact string matching, JSON object parsing, and floating-point tolerance ($10^{-5}$).
- **Transparent Scoring Formula**:
  $$\text{Total Score} = \text{Functional (60)} + \text{Edge Cases (20)} + \text{Code Quality (10)} + \text{Efficiency (10)}$$

### 2.2 Sandbox Isolation Architecture
1. **Container Isolation (Primary)**:
   - Built on `python:3.12-slim`.
   - Dedicated unprivileged user `sandboxuser` (UID 10001).
   - Container flag `--network none` prohibits outbound or inbound network sockets.
   - Resource enforcement: `--memory 128m --memory-swap 128m --cpus 1.0 --pids-limit 64`.
   - Security constraints: `--cap-drop ALL --security-opt no-new-privileges`.
2. **Subprocess Isolation (Fallback)**:
   - Active process tree polling with `psutil`.
   - Wall-clock timeout watchdog killing runaway processes.
   - Output truncation buffer preventing memory denial of service.

### 2.3 AI Provider Abstraction
- Unified `BaseAIProvider` interface supporting:
  - `evaluate_code(problem, submission)`
  - `compare_solutions(problem, sub_a, sub_b)`
- **Google Gemini Provider**: Utilizes the official `google-genai` SDK targeting `gemini-3.8-flash`. Prompts are hardened with strict instructions that submitted code is untrusted data.
- **OpenAI Provider**: Utilizes the official `openai` SDK with `gpt-4o` and JSON mode.
- **Deterministic Mock Provider**: Reproducible test double used for unit and automated testing.

### 2.4 Annotation & Review Studio
- Supports standardized evaluation rubrics with configurable criteria weights.
- Records reviewer scores across 5 axes: Correctness, Efficiency, Readability, Maintainability, and Security.
- Captures failure categories (e.g., *Off-by-one*, *Boundary condition missed*, *Time limit exceeded*).
- Complete revision history tracking with required change rationales.
- Computes human-vs-AI disagreement deltas to identify model misalignment.

### 2.5 Dataset Generation & Cryptographic Provenance
- Filters submissions by quality score, review status, or execution outcome.
- Computes SHA-256 provenance hashes over all record fields to ensure dataset immutability.
- Exports in standard `.json` and newline-delimited `.jsonl` formats for direct consumption by model fine-tuning and evaluation pipelines.
