/**
 * API client for Cumberland Farms DSD Reconciliation backend
 * All API calls use relative /api paths for same-origin requests
 */

import type {
  LoginRequest,
  LoginResponse,
  IngestBatchRequest,
  IngestBatchResponse,
  BatchListResponse,
  RunMatchResponse,
  QueueResponse,
  CaseDetail,
  ReviewDecisionRequest,
  ReviewDecisionResponse,
  SettlementRequest,
  SettlementResponse,
  AuditResponse,
  HealthResponse,
} from '../types/api';

const API_BASE = '/api';

/**
 * Generic request helper
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  // Handle error responses
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Auth API
 */
export const authAPI = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Intake API
 */
export const intakeAPI = {
  async ingestBatch(data: IngestBatchRequest): Promise<IngestBatchResponse> {
    return request<IngestBatchResponse>('/intake/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Reconciliation API
 */
export const reconciliationAPI = {
  async listBatches(): Promise<BatchListResponse> {
    return request<BatchListResponse>('/reconciliation/batches', {
      method: 'GET',
    });
  },
  
  async runMatch(batchId: string): Promise<RunMatchResponse> {
    return request<RunMatchResponse>(`/reconciliation/batches/${batchId}/run`, {
      method: 'POST',
    });
  },
};

/**
 * Queue API
 */
export const queueAPI = {
  async getQueue(
    queueType: string,
    params?: { status?: string; limit?: number }
  ): Promise<QueueResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) {
      queryParams.set('status', params.status);
    }
    if (params?.limit) {
      queryParams.set('limit', params.limit.toString());
    }
    const queryString = queryParams.toString();
    const path = `/queues/${queueType}${queryString ? `?${queryString}` : ''}`;
    return request<QueueResponse>(path);
  },
};

/**
 * Cases API
 */
export const casesAPI = {
  async getCaseDetail(caseId: string): Promise<CaseDetail> {
    return request<CaseDetail>(`/cases/${caseId}`);
  },

  async submitReviewDecision(
    caseId: string,
    data: ReviewDecisionRequest
  ): Promise<ReviewDecisionResponse> {
    return request<ReviewDecisionResponse>(`/cases/${caseId}/review-decisions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Settlement API
 */
export const settlementAPI = {
  async prepareSettlement(
    caseId: string,
    data: SettlementRequest
  ): Promise<SettlementResponse> {
    return request<SettlementResponse>(`/cases/${caseId}/settlement`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Audit API
 */
export const auditAPI = {
  async getAuditTrace(
    aggregateType: string,
    aggregateId: number
  ): Promise<AuditResponse> {
    return request<AuditResponse>(`/audit/${aggregateType}/${aggregateId}`);
  },
};

/**
 * Health API
 */
export const healthAPI = {
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health');
  },
};
