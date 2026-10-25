export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubmissionStatus = 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Invalid Submission' | 'Infrastructure Error' | 'Pending';

export interface TestCase {
  id: number;
  problem_id?: number;
  input_data?: string;
  expected_output?: string;
  is_hidden: boolean;
  test_type: string;
  weight: number;
  order_index: number;
  explanation?: string;
}

export interface Problem {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  time_limit_seconds: number;
  memory_limit_mb: number;
  tags: string;
  starter_code: string;
  function_name?: string;
  function_signature?: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  created_at: string;
  updated_at?: string;
  test_cases?: TestCase[];
}

export interface TestResult {
  id: number;
  test_case_id: number;
  passed: boolean;
  status: string;
  is_hidden: boolean;
  execution_time_ms: number;
  memory_kb: number;
  actual_output?: string;
  expected_output?: string;
  error_message?: string;
}

export interface Submission {
  id: number;
  problem_id: number;
  user_id?: number;
  code: string;
  language: string;
  status: SubmissionStatus;
  execution_time_ms: number;
  memory_usage_kb: number;
  deterministic_score: number;
  functional_score: number;
  edge_cases_score: number;
  quality_score: number;
  efficiency_score: number;
  total_score: number;
  pass_rate: number;
  tests_passed: number;
  tests_total: number;
  error_category?: string;
  error_message?: string;
  stdout?: string;
  stderr?: string;
  sandbox_mode: string;
  created_at: string;
  test_results?: TestResult[];
}

export interface BugReport {
  title: string;
  line_number?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
}

export interface OptimizationSuggestion {
  category: string;
  current_state: string;
  improved_state: string;
  rationale: string;
}

export interface AIEvaluation {
  id: number;
  submission_id: number;
  provider: string;
  model: string;
  overall_assessment: string;
  correctness_score: number;
  efficiency_score: number;
  readability_score: number;
  maintainability_score: number;
  security_score: number;
  robustness_score: number;
  edge_cases_score: number;
  instruction_following_score: number;
  bugs_identified: BugReport[];
  optimization_suggestions: OptimizationSuggestion[];
  confidence: number;
  created_at: string;
}

export interface SolutionComparison {
  id: number;
  problem_id: number;
  submission_a_id: number;
  submission_b_id: number;
  provider: string;
  model: string;
  preferred_solution: 'A' | 'B' | 'tie';
  functional_comparison: string;
  efficiency_comparison: string;
  readability_comparison: string;
  edge_case_comparison: string;
  written_justification: string;
  confidence: number;
  human_override_preferred?: 'A' | 'B' | 'tie';
  human_override_reason?: string;
  created_at: string;
}

export interface Rubric {
  id: number;
  name: string;
  version: string;
  criteria_weights: Record<string, number>;
  description?: string;
  is_active: boolean;
}

export interface ReviewHistory {
  id: number;
  human_review_id: number;
  previous_state: Record<string, any>;
  new_state: Record<string, any>;
  change_reason: string;
  created_at: string;
}

export interface HumanReview {
  id: number;
  submission_id: number;
  reviewer_id?: number;
  rubric_id?: number;
  correctness_score: number;
  efficiency_score: number;
  readability_score: number;
  maintainability_score: number;
  security_score: number;
  failure_category?: string;
  rationale: string;
  status: string;
  ambiguity_reported: boolean;
  created_at: string;
  updated_at: string;
  history?: ReviewHistory[];
}

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  version: string;
  record_count: number;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface DashboardStats {
  total_problems: number;
  total_submissions: number;
  overall_pass_rate: number;
  failed_evaluations: number;
  ai_evaluations_count: number;
  human_reviews_count: number;
  datasets_count: number;
  recent_activity: Array<{
    id: number;
    problem_id: number;
    problem_title: string;
    status: string;
    total_score: number;
    pass_rate: number;
    execution_time_ms: number;
    created_at: string;
  }>;
  failure_categories: Array<{ category: string; count: number }>;
  evaluations_by_provider: Array<{ provider: string; model: string; count: number }>;
  evaluation_trends: Array<{ date: string; submissions: number; pass_rate: number }>;
}

export interface ProviderStatus {
  provider: string;
  configured: boolean;
  default: boolean;
  model: string;
  active: boolean;
  status_message: string;
}

export interface SystemConfigStatus {
  app_env: string;
  database_type: string;
  sandbox_mode: string;
  docker_available: boolean;
  providers: ProviderStatus[];
}
