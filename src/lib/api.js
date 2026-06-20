const BASE_URL = '/api';

export async function apiRequest(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function setToken(token) {
  localStorage.setItem('auth_token', token);
}

export function removeToken() {
  localStorage.removeItem('auth_token');
}

// Auth
export const auth = {
  register: (data) => apiRequest('POST', '/auth/register', data),
  login: (data) => apiRequest('POST', '/auth/login', data),
  me: () => apiRequest('GET', '/auth/me', null, getToken()),
  updateProfile: (data) => apiRequest('PUT', '/auth/me', data, getToken()),
};

// Scores
export const scores = {
  list: () => apiRequest('GET', '/scores', null, getToken()),
  add: (data) => apiRequest('POST', '/scores', data, getToken()),
  update: (id, data) => apiRequest('PUT', `/scores/${id}`, data, getToken()),
  delete: (id) => apiRequest('DELETE', `/scores/${id}`, null, getToken()),
};

// Charities
export const charities = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest('GET', `/charities${qs ? '?' + qs : ''}`, null, getToken());
  },
  get: (id) => apiRequest('GET', `/charities/${id}`, null, getToken()),
  create: (data) => apiRequest('POST', '/charities', data, getToken()),
  update: (id, data) => apiRequest('PUT', `/charities/${id}`, data, getToken()),
  delete: (id) => apiRequest('DELETE', `/charities/${id}`, null, getToken()),
};

// Draws
export const draws = {
  list: () => apiRequest('GET', '/draws', null, getToken()),
  current: () => apiRequest('GET', '/draws/current', null, getToken()),
  get: (id) => apiRequest('GET', `/draws/${id}`, null, getToken()),
  myEntry: (id) => apiRequest('GET', `/draws/${id}/my-entry`, null, getToken()),
  create: (data) => apiRequest('POST', '/draws', data, getToken()),
  simulate: (id) => apiRequest('POST', `/draws/${id}/simulate`, null, getToken()),
  publish: (id) => apiRequest('POST', `/draws/${id}/publish`, null, getToken()),
};

// Winners
export const winners = {
  list: () => apiRequest('GET', '/winners', null, getToken()),
  my: () => apiRequest('GET', '/winners/my', null, getToken()),
  verify: (id, data) => apiRequest('PUT', `/winners/${id}/verify`, data, getToken()),
};

// Subscriptions
export const subscriptions = {
  plans: () => apiRequest('GET', '/subscriptions/plans'),
  status: () => apiRequest('GET', '/subscriptions/status', null, getToken()),
  checkout: (priceId) => apiRequest('POST', '/subscriptions/checkout', { price_id: priceId }, getToken()),
  portal: () => apiRequest('POST', '/subscriptions/portal', null, getToken()),
};

// Admin
export const admin = {
  stats: () => apiRequest('GET', '/admin/stats', null, getToken()),
  users: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest('GET', `/admin/users${qs ? '?' + qs : ''}`, null, getToken());
  },
  getUser: (id) => apiRequest('GET', `/admin/users/${id}`, null, getToken()),
  updateUser: (id, data) => apiRequest('PUT', `/admin/users/${id}`, data, getToken()),
  winners: () => apiRequest('GET', '/admin/winners', null, getToken()),
  charityContributions: () => apiRequest('GET', '/admin/charity-contributions', null, getToken()),
};
