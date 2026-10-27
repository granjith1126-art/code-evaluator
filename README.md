# AI Code Evaluator

[![CI Tests](https://img.shields.io/badge/tests-18%20passed-emerald)](https://github.com/granjith1126-art/code-evaluator)
[![Python](https://img.shields.io/badge/python-3.12-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed-2496ed)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

An enterprise-grade platform for evaluating code submissions, testing AI-generated programming solutions, comparing competing models, diagnosing software bugs, conducting human rubric reviews, and generating structured datasets for AI training and evaluation.

---

## 1. Key Features

- **Isolated Execution Sandbox**: Executes untrusted Python solutions inside hardened, non-root Docker containers (`--network none`, memory cap, wall-clock timeout) with an active `psutil`-monitored subprocess fallback.
- **Deterministic Evaluation Engine**: AST-based syntax verification, cyclomatic complexity analysis, function & stdio test harnesses, and a transparent 4-pillar scoring rubric (Functional 60%, Edge Cases 20%, Quality 10%, Efficiency 10%).
- **Multi-Model AI Provider Abstraction**: Integrated with official Google GenAI (`gemini-3.8-flash`) and OpenAI (`gpt-4o`) SDKs, backed by a deterministic mock test double.
- **Pairwise Comparison Studio**: Side-by-side Monaco code comparison, automated criteria evaluation, winner preference detection, and human override tracking with mandatory audit reasons.
- **Human Annotation & Review Studio**: Standardized rubrics with configurable criteria weights, failure classification, written rationales, and full revision history tracking.
- **Cryptographic Dataset Generation**: Filters submissions, computes SHA-256 provenance hashes, and exports structured training corpora in standard JSON and newline-delimited JSONL formats.
- **Glassmorphism Design System**: Modern translucent glass panels, dark/light/system theme switcher, Monaco theme sync (`vs-dark`/`vs`), responsive layouts, ambient animated glowing mesh orbs, and accessible `prefers-reduced-motion` controls.
- **Developer-Tool Dashboard**: Real-time telemetry, pass rate trends, failure category breakdowns, and problem library management.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Tooling**: Vite 6 + Tailwind CSS v4
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Visualizations**: Recharts
- **Icons & Routing**: Lucide React + React Router v7

### Backend & AI
- **Framework**: Python 3.12 + FastAPI
- **Validation**: Pydantic v2 + Pydantic Settings
- **Persistence**: SQLAlchemy 2.0 (PostgreSQL & SQLite) + Alembic
- **AI SDKs**: Official `google-genai` (v2.31+) & `openai` (v3.37+)
- **Testing**: Pytest 9.1 + HTTPX TestClient

### Infrastructure & Sandbox
- **Containerization**: Docker & Docker Compose
- **Sandbox Isolation**: Non-root `sandboxuser` (UID 10001), `--network none`, memory caps, CPU caps, no swap, read-only root
- **Resource Monitoring**: `psutil` real-time RSS memory tracking

---

## 3. Directory Structure

```text
code-evaluator/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Health, Config, Problems, Submissions, AI, Reviews, Datasets, Analytics
│   │   ├── core/           # Settings, database, security, and auth configuration
│   │   ├── evaluators/     # Deterministic evaluation, AST quality analyzer, scoring engine
│   │   ├── exporters/      # Dataset JSON & JSONL exporter with SHA-256 provenance
│   │   ├── models/         # SQLAlchemy 2.0 database models
│   │   ├── providers/      # Gemini, OpenAI, and Mock AI adapters
│   │   ├── sandbox/        # Docker and Subprocess execution sandbox runners
│   │   ├── schemas/        # Pydantic v2 validation models
│   │   └── main.py         # FastAPI application entrypoint
│   ├── tests/              # Pytest unit, integration, and security test suites
│   ├── requirements.txt    # Pinned Python dependencies
│   ├── Dockerfile          # Backend production container
│   └── seed_data.py        # Seed script with 5 coding problems and 22 test cases
├── execution/
│   ├── Dockerfile          # Minimal, hardened execution sandbox image
│   └── runner.py           # Container entrypoint for isolated Python code execution
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, cards, score breakdowns, UI controls
│   │   ├── pages/          # Dashboard, Problem Library, Workspace, Comparisons, Reviews, Datasets, Status
│   │   ├── lib/            # Typed API client
│   │   └── types/          # TypeScript interface definitions
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite configuration with proxy to backend
├── docs/
│   ├── ARCHITECTURE.md     # In-depth architectural design and data flow
│   └── SECURITY.md         # Threat model, sandboxing, and credential safety
├── docker-compose.yml      # Multi-container orchestration (DB, Backend, Frontend)
├── .env.example            # Configuration placeholder template
├── .gitignore              # Strict secret and artifact exclusions
├── pytest.ini              # Pytest configuration
├── BUILD_STATUS.md         # Verified autonomous build status
└── README.md
```

---

## 4. Quick Start (Windows PowerShell)

### Prerequisites
- Python 3.11+ installed and on PATH
- Node.js 20+ and npm installed
- Git 2.40+ installed
- *(Optional)* Docker Desktop for container-isolated sandbox execution

### Step 1: Clone Repository
```powershell
git clone https://github.com/granjith1126-art/code-evaluator.git
cd code-evaluator
```

### Step 2: Configure Environment
Copy the example environment template and configure your credentials:
```powershell
Copy-Item .env.example .env
```
Edit `.env` to supply your OpenAI or Gemini API keys if available:
```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.8-flash
```
*(Note: If no API keys are provided, the platform automatically runs in deterministic Mock mode.)*

### Step 3: Install Backend Dependencies & Seed Database
```powershell
python -m pip install -r backend/requirements.txt
python backend/seed_data.py
```

### Step 4: Run Automated Tests
```powershell
python -m pytest backend/tests -v
```
All 17 unit, integration, and adversarial security tests will execute and verify.

### Step 5: Start Backend Service
```powershell
uvicorn app.main:app --app-dir backend --reload --port 8000
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Step 6: Start Frontend Development Server
In a new terminal window:
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Open your browser to [http://localhost:5173](http://localhost:5173).

---

## 5. Docker Deployment

To launch the full production stack using Docker Compose:
```powershell
docker-compose up --build -d
```
- **Frontend SPA**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 6. End-to-End Workflow Verification

1. **Dashboard Analytics**: Visit the home dashboard to inspect live telemetry, test pass rates, failure categories, and model utilization.
2. **Problem Library**: Browse through the pre-seeded algorithmic problems (e.g., *Two Sum*, *Valid Palindrome*, *Longest Substring Without Repeating Characters*, *Merge Intervals*, *Search in Rotated Sorted Array*).
3. **Interactive Workspace**: Select a problem, write a Python solution in the Monaco editor, and click **Run Code** (to test against public examples) or **Submit Solution** (to test against all public and hidden test cases).
4. **Detailed Submission Inspection**: Review deterministic scores, individual test case pass/fail statuses, and click **Run AI Evaluation** to generate structured LLM feedback using Gemini 3.8 Flash or GPT-4o.
5. **Pairwise Comparison**: Navigate to **Comparison Studio**, select two competing solutions, and execute a pairwise AI evaluation with human override support.
6. **Annotation Studio**: Score submissions against standardized rubrics, label failure categories, and record rationale.
7. **Dataset Export**: Navigate to **Dataset Management**, create a filtered dataset, preview schema records, and download formatted `.jsonl` or `.json` files with SHA-256 provenance hashes.

---

## 7. Security & Sandbox Boundary

Submitted code execution is strictly quarantined:
- **Container Isolation**: Dedicated non-root user `sandboxuser`, dropped capabilities (`--cap-drop ALL`), disabled network access (`--network none`), 128 MB RAM limit, and wall-clock execution timeouts.
- **Subprocess Isolation**: Real-time RSS memory tracking with `psutil`, timeout watchdog, and output truncation at 64 KB.
- **Secret Protection**: API configuration endpoints never expose secret values. Hidden test cases are masked from ordinary submission responses.

See [docs/SECURITY.md](docs/SECURITY.md) for complete details.

---

## 8. License

Distributed under the MIT License.
