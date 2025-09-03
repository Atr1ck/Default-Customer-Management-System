const API_BASE = 'http://localhost:5000/api';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`POST ${path} ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`PATCH ${path} ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`DELETE ${path} ${res.status}`);
  }
}

// 用户相关API
export const UserAPI = {
  login: (username: string, password: string) => 
    apiPost<{success: boolean, data?: Record<string, unknown>, message?: string}>('/login', { username, password })
};

// 违约原因相关API
export const DefaultReasonAPI = {
  list: () => apiGet<{success: boolean, data: Record<string, unknown>[]}>('/default-reasons'),
  getById: (id: string) => apiGet<{success: boolean, data?: Record<string, unknown>, message?: string}>(`/default-reasons/${id}`)
};

// 重生原因相关API
export const RecoveryReasonAPI = {
  list: () => apiGet<{success: boolean, data: Record<string, unknown>[]}>('/recovery-reasons'),
  getById: (id: string) => apiGet<{success: boolean, data?: Record<string, unknown>, message?: string}>(`/recovery-reasons/${id}`)
};

// 违约申请相关API
export const DefaultApplicationAPI = {
  create: (data: {
    customer_id: string;
    default_reason_id: string;
    severity_level: string;
    applicant_id: string;
    remarks?: string;
    attachment_url?: string;
  }) => apiPost<{success: boolean, message: string}>('/default-applications', data),
  
  audit: (appId: string, data: {
    auditor_id: string;
    audit_status: string;
    audit_remarks?: string;
  }) => apiPost<{success: boolean, message: string}>(`/default-applications/${appId}/audit`, data)
};

// 重生申请相关API
export const RecoveryApplicationAPI = {
  create: (data: {
    customer_id: string;
    original_default_app_id: string;
    recovery_reason_id: string;
    applicant_id: string;
  }) => apiPost<{success: boolean, message: string}>('/recovery-applications', data),
  
  audit: (appId: string, data: {
    auditor_id: string;
    audit_status: string;
    audit_remarks?: string;
  }) => apiPost<{success: boolean, message: string}>(`/recovery-applications/${appId}/audit`, data)
};

// 测试接口
export const TestAPI = {
  test: () => apiGet<{success: boolean, message: string}>('/test')
};

// 为了保持向后兼容，保留原有的API名称
export const ReasonAPI = DefaultReasonAPI;
export const RebirthAPI = {
  listApplications: () => apiGet<Record<string, unknown>>('/recovery-applications'),
  listReviews: () => apiGet<Record<string, unknown>>('/recovery-applications'),
  reasons: () => RecoveryReasonAPI.list(),
  createApplication: (data: Record<string, unknown>) => RecoveryApplicationAPI.create(data as {
    customer_id: string;
    original_default_app_id: string;
    recovery_reason_id: string;
    applicant_id: string;
  })
};

export const CustomerAPI = {
  list: () => apiGet('/customers')
};

export const DefaultReviewAPI = {
  list: () => apiGet('/defaultReviews')
};

export const OptionsAPI = {
  severity: () => apiGet('/severityOptions'),
  status: () => apiGet('/statusOptions')
};

export const StatisticsAPI = {
  get: () => apiGet('/statistics')
};


