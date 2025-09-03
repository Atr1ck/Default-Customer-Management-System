const API_BASE = '/api';

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

// domain helpers
export const ReasonAPI = {
  list: () => apiGet('/defaultReasons'),
  create: (data: unknown) => apiPost('/defaultReasons', data),
  update: (id: string, data: unknown) => apiPatch(`/defaultReasons/${id}`, data),
  remove: (id: string) => apiDelete(`/defaultReasons/${id}`)
};

export const CustomerAPI = {
  list: () => apiGet('/customers')
};

export const DefaultReviewAPI = {
  list: () => apiGet('/defaultReviews')
};

export const RebirthAPI = {
  listApplications: () => apiGet('/rebirthApplications'),
  listReviews: () => apiGet('/rebirthReviews'),
  reasons: () => apiGet('/rebirthReasons'),
  createApplication: (data: unknown) => apiPost('/rebirthApplications', data)
};

export const OptionsAPI = {
  severity: () => apiGet('/severityOptions'),
  status: () => apiGet('/statusOptions')
};

export const StatisticsAPI = {
  get: () => apiGet('/statistics')
};

export const DefaultApplicationAPI = {
  create: (data: unknown) => apiPost('/defaultApplications', data)
};


