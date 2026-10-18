import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // LLM multi-agent pipeline may take up to 90-120s
});

export interface HealthResponse {
  status: string;
  orchestrator: string;
  infrastructure: string;
  active_agents: string[];
}

export interface AnalyzeRequest {
  clinical_notes: string;
  target_language?: string;
  autonomous_floor?: number;
}

export interface AgentTraceItem {
  agent: string;
  status?: string;
  latency_ms?: number;
}

export interface GraphPathItem {
  path: string;
  risk: string;
  severity: string;
}

export interface TelemetryData {
  total_pipeline_ms: string;
  agent_trace: AgentTraceItem[];
  graph_database: string;
}

export interface AnalyzeResponse {
  telemetry: TelemetryData;
  sanitized_notes: string;
  graph_paths: GraphPathItem[];
  clinical_analysis: string;
  requires_physician_lock: boolean;
}

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/api/health');
  return response.data;
};

export const runAnalyzePipeline = async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const response = await apiClient.post<AnalyzeResponse>('/api/analyze', data);
  return response.data;
};
