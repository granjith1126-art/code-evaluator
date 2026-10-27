import {
  Problem,
  Submission,
  AIEvaluation,
  SolutionComparison,
  HumanReview,
  Rubric,
  Dataset,
  DashboardStats,
  SystemConfigStatus
} from '../types';

const API_BASE = '/api/v1';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) {
        errorDetail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Config & Health
  getConfigStatus: () => fetchJSON<SystemConfigStatus>('/config/status'),
  getHealth: () => fetchJSON<{ status: string; uptime_seconds: number }>('/health'),

  // Analytics
  getDashboardStats: () => fetchJSON<DashboardStats>('/analytics/dashboard'),

  // Problems
  getProblems: (params?: { search?: string; difficulty?: string; page?: number; page_size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.difficulty) sp.append('difficulty', params.difficulty);
    if (params?.page) sp.append('page', params.page.toString());
    if (params?.page_size) sp.append('page_size', params.page_size.toString());
    return fetchJSON<{ items: Problem[]; total: number; page: number; total_pages: number }>(`/problems?${sp.toString()}`);
  },

  getProblem: (idOrSlug: string | number) => fetchJSON<Problem>(`/problems/${idOrSlug}`),

  createProblem: (data: Partial<Problem> & { test_cases: any[] }) =>
    fetchJSON<Problem>('/problems', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteProblem: (id: number) =>
    fetch(`${API_BASE}/problems/${id}`, { method: 'DELETE' }),

  // Submissions
  createSubmission: (data: { problem_id: number; code: string; language?: string; run_only_public?: boolean }) =>
    fetchJSON<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSubmission: (id: number) => fetchJSON<Submission>(`/submissions/${id}`),

  getSubmissions: (params?: { problem_id?: number; status_filter?: string; page?: number; page_size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.problem_id) sp.append('problem_id', params.problem_id.toString());
    if (params?.status_filter) sp.append('status_filter', params.status_filter);
    if (params?.page) sp.append('page', params.page.toString());
    if (params?.page_size) sp.append('page_size', params.page_size.toString());
    return fetchJSON<{ items: Submission[]; total: number; page: number; total_pages: number }>(`/submissions?${sp.toString()}`);
  },

  // AI Evaluations
  evaluateWithAI: (submission_id: number, provider?: string, model?: string) =>
    fetchJSON<AIEvaluation>('/evaluations/ai', {
      method: 'POST',
      body: JSON.stringify({ submission_id, provider, model })
    }),

  getAIEvaluation: (submission_id: number) => fetchJSON<AIEvaluation>(`/evaluations/ai/${submission_id}`),

  compareSolutions: (problem_id: number, submission_a_id: number, submission_b_id: number, provider?: string) =>
    fetchJSON<SolutionComparison>('/evaluations/compare', {
      method: 'POST',
      body: JSON.stringify({ problem_id, submission_a_id, submission_b_id, provider })
    }),

  overrideComparison: (comparison_id: number, override_preferred: 'A' | 'B' | 'tie', reason: string) =>
    fetchJSON<SolutionComparison>(`/evaluations/compare/${comparison_id}/override`, {
      method: 'POST',
      body: JSON.stringify({ human_override_preferred: override_preferred, human_override_reason: reason })
    }),

  // Reviews & Rubrics
  getRubrics: () => fetchJSON<Rubric[]>('/rubrics'),

  createReview: (data: Partial<HumanReview>) =>
    fetchJSON<HumanReview>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateReview: (id: number, data: Partial<HumanReview> & { change_reason: string }) =>
    fetchJSON<HumanReview>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getReviews: (submission_id?: number) => {
    const sp = submission_id ? `?submission_id=${submission_id}` : '';
    return fetchJSON<{ items: HumanReview[]; total: number }>(`/reviews${sp}`);
  },

  // Datasets
  getDatasets: () => fetchJSON<{ items: Dataset[]; total: number }>('/datasets'),

  createDataset: (data: { name: string; description?: string; version?: string; filters?: any }) =>
    fetchJSON<Dataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  previewDataset: (id: number) =>
    fetchJSON<{ dataset_id: number; total_records: number; sample_records: any[]; schema_fields: string[] }>(`/datasets/${id}/preview`),

  getDatasetExportUrl: (id: number, format: 'json' | 'jsonl' = 'jsonl') =>
    `${API_BASE}/datasets/${id}/export?format=${format}`
};
