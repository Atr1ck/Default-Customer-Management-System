import type { DefaultReview, StatisticsData } from '../types';

const API_BASE = 'http://localhost:5000/api';

// 解包后端统一响应 { success, data, message }
type ApiEnvelope<T> = { success: boolean; data?: T; message?: string };
async function unwrapResponse<T>(p: Promise<ApiEnvelope<T>>): Promise<T> {
  const resp: ApiEnvelope<T> = await p;
  if (resp.success === false) {
    throw new Error(resp.message || '接口返回失败');
  }
  return resp.data as T;
}

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

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`DELETE ${path} ${res.status}`);
  }
}

// 非 /api 前缀的绝对路径 GET（如 /test）
async function apiGetAbsolute<T>(absolutePath: string): Promise<T> {
  const url = `http://localhost:5000${absolutePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${absolutePath} ${res.status}`);
  }
  return res.json();
}

// 用户相关API
export const UserAPI = {
  login: (username: string, password: string) =>
    apiPost<{success: boolean, data?: Record<string, unknown>, message?: string}>('/login', { username, password })
};

// 违约原因相关API
export const DefaultReasonAPI = {
  list: async () => {
    type BackendReason = {
      reason_id: string;
      reason_content: string;
      is_enabled: number | boolean;
      create_time: string;
      update_time?: string;
    };
    const data = await unwrapResponse<BackendReason[]>(apiGet(`/default-reasons`));
    return data.map((r, idx) => ({
      id: r.reason_id,
      content: r.reason_content,
      isEnabled: Boolean(r.is_enabled),
      order: idx + 1,
      createTime: r.create_time,
      updateTime: r.update_time || ''
    }));
  },
  getById: async (id: string) => {
    type BackendReason = {
      reason_id: string;
      reason_content: string;
      is_enabled: number | boolean;
      create_time: string;
      update_time?: string;
    };
    const r = await unwrapResponse<BackendReason>(apiGet(`/default-reasons/${id}`));
    return {
      id: r.reason_id,
      content: r.reason_content,
      isEnabled: Boolean(r.is_enabled),
      order: 1,
      createTime: r.create_time,
      updateTime: r.update_time || ''
    };
  },
  setEnable: (id: string, enabled: boolean) =>
    apiPut<{success: boolean, message?: string}>(`/default-reasons/${id}/enable`, { is_enabled: enabled ? 1 : 0 })
};

// 重生原因相关API
export const RecoveryReasonAPI = {
  list: async () => {
    type BackendReason = {
      recovery_id: string;
      recovery_content: string;
      is_enabled: number | boolean;
      create_time: string;
      update_time?: string;
    };
    const data = await unwrapResponse<BackendReason[]>(apiGet(`/recovery-reasons`));
    return data.map((r, idx) => ({
      id: r.recovery_id,
      content: r.recovery_content,
      isEnabled: Boolean(r.is_enabled),
      order: idx + 1,
      createTime: r.create_time,
      updateTime: r.update_time || ''
    }));
  },
  getById: async (id: string) => {
    type BackendReason = {
      recovery_id: string;
      recovery_content: string;
      is_enabled: number | boolean;
      create_time: string;
      update_time?: string;
    };
    const r = await unwrapResponse<BackendReason>(apiGet(`/recovery-reasons/${id}`));
    return {
      id: r.recovery_id,
      content: r.recovery_content,
      isEnabled: Boolean(r.is_enabled),
      order: 1,
      createTime: r.create_time,
      updateTime: r.update_time || ''
    };
  },
  setEnable: (id: string, enabled: boolean) =>
    apiPut<{success: boolean, message?: string}>(`/recovery-reasons/${id}/enable`, { is_enabled: enabled ? 1 : 0 })
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

  list: async (filters?: {
    customer_id?: string;
    status?: 'pending' | 'approved' | 'rejected';
    start_date?: string;
    end_date?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const queryString = params.toString();
    const url = `/default-applications${queryString ? `?${queryString}` : ''}`;
    return unwrapResponse<Record<string, unknown>[]>(apiGet(url));
  },

  getById: (id: string) => apiGet<Record<string, unknown>>(`/default-applications/${id}`),

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
  test: () => apiGetAbsolute<{success: boolean, message: string}>(`/test`)
};

// 为了保持向后兼容，保留原有的API名称
export const ReasonAPI = DefaultReasonAPI;
export const RebirthAPI = {
  listApplications: () => unwrapResponse<Record<string, unknown>[]>(apiGet(`/recovery-applications`)),
  listReviews: (status?: 'pending' | 'approved' | 'rejected') => unwrapResponse<Record<string, unknown>[]>(apiGet(`/recovery-applications${status ? `?status=${status}` : ''}`)),
  listReviewsWithFilters: (filters?: { status?: 'pending' | 'approved' | 'rejected'; severity?: 'high' | 'medium' | 'low'; startDate?: string; endDate?: string; }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const qs = params.toString();
    return unwrapResponse<Record<string, unknown>[]>(apiGet(`/recovery-applications${qs ? `?${qs}` : ''}`));
  },
  reasons: () => RecoveryReasonAPI.list(),
  createApplication: (data: Record<string, unknown>) => RecoveryApplicationAPI.create(data as {
    customer_id: string;
    original_default_app_id: string;
    recovery_reason_id: string;
    applicant_id: string;
  }),
  
  audit: async (appId: string, data: {
    auditor_id: string;
    audit_status: string;
    audit_remarks?: string;
  }): Promise<{success: boolean, message: string}> => {
    return apiPost<{success: boolean, message: string}>(`/recovery-applications/${appId}/audit`, data);
  }
};

export const CustomerAPI = {
  list: async () => {
    type BackendCustomer = {
      customer_id: string;
      customer_name: string;
      current_external_rating: string;
      is_default: number | boolean;
      industry_type: string;
      region: string;
    };
    const data = await unwrapResponse<BackendCustomer[]>(apiGet(`/customers`));
    return data.map((c) => ({
      id: c.customer_id,
      name: c.customer_name,
      externalLevel: c.current_external_rating,
      isDefaulted: Boolean(c.is_default),
      industry: c.industry_type,
      region: c.region
    }));
  },
  listDefaulted: async () => {
    type BackendCustomer = {
      customer_id: string;
      customer_name: string;
      current_external_rating: string;
      is_default: number | boolean;
      industry_type: string;
      region: string;
    };
    const data = await unwrapResponse<BackendCustomer[]>(apiGet(`/customers/defaulted`));
    return data.map((c) => ({
      id: c.customer_id,
      name: c.customer_name,
      externalLevel: c.current_external_rating,
      isDefaulted: Boolean(c.is_default),
      industry: c.industry_type,
      region: c.region
    }));
  }
};

export const DefaultReviewAPI = {
  list: async (filters?: {
    customerName?: string;
    status?: 'pending' | 'approved' | 'rejected';
    startDate?: string;
    endDate?: string;
    reviewer?: string;
  }): Promise<DefaultReview[]> => {
    const params = new URLSearchParams();
    if (filters?.customerName) params.append('customerName', filters.customerName);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.reviewer) params.append('reviewer', filters.reviewer);
    
    const queryString = params.toString();
    const url = `/defaultReviews${queryString ? `?${queryString}` : ''}`;
    return unwrapResponse<DefaultReview[]>(apiGet(url));
  },
  
  audit: async (appId: string, data: {
    auditor_id: string;
    audit_status: string;
    audit_remarks?: string;
  }): Promise<{success: boolean, message: string}> => {
    return apiPost<{success: boolean, message: string}>(`/default-applications/${appId}/audit`, data);
  }
};

type OptionItem = { label: string; value: string };
export const OptionsAPI = {
  severity: async (): Promise<OptionItem[]> => unwrapResponse<OptionItem[]>(apiGet(`/severityOptions`)),
  status: async (): Promise<OptionItem[]> => unwrapResponse<OptionItem[]>(apiGet(`/statusOptions`))
};

export const StatisticsAPI = {
  get: async (): Promise<StatisticsData> => unwrapResponse<StatisticsData>(apiGet(`/statistics`))
};
