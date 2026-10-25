import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "uptime_seconds" in data

def test_config_status_endpoint():
    res = client.get("/api/v1/config/status")
    assert res.status_code == 200
    data = res.json()
    assert "providers" in data
    assert any(p["provider"] == "gemini" for p in data["providers"])
    assert any(p["provider"] == "mock" for p in data["providers"])
    # Verify no secret keys are leaked
    res_text = res.text.lower()
    assert "sk-" not in res_text
    assert "secret_key" not in res_text

def test_problems_listing_and_detail():
    res = client.get("/api/v1/problems")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    items = data["items"]
    assert len(items) >= 1
    first_problem = items[0]

    # Fetch detail
    detail_res = client.get(f"/api/v1/problems/{first_problem['slug']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["title"] == first_problem["title"]

    # Verify hidden test cases are masked
    test_cases = detail["test_cases"]
    for tc in test_cases:
        if tc["is_hidden"]:
            assert tc["input_data"] == "[HIDDEN TEST CASE]"
            assert tc["expected_output"] == "[HIDDEN TEST CASE]"

def test_submission_lifecycle():
    # Submit Two Sum solution
    problem_res = client.get("/api/v1/problems/two-sum")
    assert problem_res.status_code == 200
    p_id = problem_res.json()["id"]

    correct_code = """def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
"""
    sub_res = client.post("/api/v1/submissions", json={
        "problem_id": p_id,
        "code": correct_code,
        "language": "python",
        "run_only_public": False
    })
    assert sub_res.status_code == 201
    sub_data = sub_res.json()
    assert sub_data["status"] == "Accepted"
    assert sub_data["pass_rate"] == 100.0
    assert sub_data["total_score"] >= 90.0

    # Test detail endpoint
    sub_id = sub_data["id"]
    get_res = client.get(f"/api/v1/submissions/{sub_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "Accepted"

    # Test AI Evaluation endpoint with mock provider
    ai_res = client.post("/api/v1/evaluations/ai", json={
        "submission_id": sub_id,
        "provider": "mock"
    })
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert ai_data["provider"] == "mock"
    assert ai_data["correctness_score"] >= 90.0
    assert "overall_assessment" in ai_data

def test_pairwise_solution_comparison():
    p_res = client.get("/api/v1/problems/two-sum")
    p_id = p_res.json()["id"]

    code_a = """def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen: return [seen[diff], i]
        seen[num] = i
    return []
"""
    code_b = """def two_sum(nums, target):
    # O(n^2) brute force
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
"""
    sub_a = client.post("/api/v1/submissions", json={"problem_id": p_id, "code": code_a}).json()
    sub_b = client.post("/api/v1/submissions", json={"problem_id": p_id, "code": code_b}).json()

    comp_res = client.post("/api/v1/evaluations/compare", json={
        "problem_id": p_id,
        "submission_a_id": sub_a["id"],
        "submission_b_id": sub_b["id"],
        "provider": "mock"
    })
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["preferred_solution"] in ["A", "B", "tie"]

    # Test human override
    comp_id = comp_data["id"]
    override_res = client.post(f"/api/v1/evaluations/compare/{comp_id}/override", json={
        "human_override_preferred": "A",
        "human_override_reason": "Solution A is linear time O(n) while Solution B is quadratic O(n^2)."
    })
    assert override_res.status_code == 200
    assert override_res.json()["human_override_preferred"] == "A"

def test_human_review_workflow():
    p_res = client.get("/api/v1/problems/two-sum")
    p_id = p_res.json()["id"]
    sub = client.post("/api/v1/submissions", json={"problem_id": p_id, "code": "def two_sum(n, t): return []"}).json()

    review_res = client.post("/api/v1/reviews", json={
        "submission_id": sub["id"],
        "correctness_score": 10.0,
        "efficiency_score": 50.0,
        "readability_score": 80.0,
        "maintainability_score": 75.0,
        "security_score": 90.0,
        "failure_category": "Wrong Answer",
        "rationale": "Solution fails all basic test cases because it returns an empty list unconditionally."
    })
    assert review_res.status_code == 201
    review_data = review_res.json()
    assert review_data["correctness_score"] == 10.0

    # Update review with change history
    rev_id = review_data["id"]
    update_res = client.put(f"/api/v1/reviews/{rev_id}", json={
        "correctness_score": 15.0,
        "change_reason": "Adjusted score after re-checking input validation."
    })
    assert update_res.status_code == 200
    assert update_res.json()["correctness_score"] == 15.0

def test_dataset_generation_and_export():
    dataset_res = client.post("/api/v1/datasets", json={
        "name": "Benchmark Evaluation Dataset v1",
        "description": "High quality annotated dataset of Python algorithmic solutions",
        "version": "1.0.0"
    })
    assert dataset_res.status_code == 201
    ds = dataset_res.json()
    ds_id = ds["id"]

    # Preview export
    preview_res = client.get(f"/api/v1/datasets/{ds_id}/preview")
    assert preview_res.status_code == 200
    pdata = preview_res.json()
    assert "sample_records" in pdata
    assert "schema_fields" in pdata

    # Export JSONL
    export_res = client.get(f"/api/v1/datasets/{ds_id}/export?format=jsonl")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"].startswith("application/x-ndjson")

def test_dashboard_analytics():
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "total_problems" in data
    assert "total_submissions" in data
    assert "recent_activity" in data
