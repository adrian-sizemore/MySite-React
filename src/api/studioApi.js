const BASE = (import.meta.env?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
const TOKEN_KEY = 'content-studio-token'
const REFRESH_KEY = 'content-studio-refresh-token'

async function refreshAccessToken() {
  const refresh = sessionStorage.getItem(REFRESH_KEY)
  if (!refresh) return false
  const response = await fetch(`${BASE}/admin/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ refresh }) })
  if (!response.ok) {
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(REFRESH_KEY)
    return false
  }
  const data = await response.json()
  sessionStorage.setItem(TOKEN_KEY, data.access)
  if (data.refresh) sessionStorage.setItem(REFRESH_KEY, data.refresh)
  return true
}

async function request(path, options = {}, authenticated = true, retried = false) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (response.status === 401 && authenticated && !retried && await refreshAccessToken()) return request(path, options, authenticated, true)
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && authenticated) { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(REFRESH_KEY) }
    const detail = typeof data?.detail === 'object' ? Object.entries(data.detail).map(([field, errors]) => `${field}: ${[].concat(errors).join(' ')}`).join(' ') : data?.detail
    throw new Error(detail || 'The content studio request failed.')
  }
  return data
}

export const studioApi = {
  isAuthenticated: () => Boolean(sessionStorage.getItem(TOKEN_KEY)),
  session: () => Promise.resolve({ authenticated: Boolean(sessionStorage.getItem(TOKEN_KEY)), user: { name: 'Adrian Sizemore' } }),
  async login(username, password, totpCode) {
    const result = await request('/admin/token/', { method: 'POST', body: JSON.stringify({ username, password, totp_code: totpCode }) }, false)
    sessionStorage.setItem(TOKEN_KEY, result.access)
    sessionStorage.setItem(REFRESH_KEY, result.refresh)
    return { authenticated: true, user: { username, name: 'Adrian Sizemore' }, expiresIn: result.expires_in }
  },
  logout() { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(REFRESH_KEY); return Promise.resolve({ authenticated: false }) },
  list: () => request('/studio/content/'),
  create: (body) => request('/studio/content/', { method: 'POST', body: JSON.stringify(body) }),
  save: (id, body) => request(`/studio/content/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id) => request(`/studio/content/${id}/`, { method: 'DELETE' }),
  publish: (id) => request(`/studio/content/${id}/publish/`, { method: 'POST', body: '{}' }),
  unpublish: (id) => request(`/studio/content/${id}/unpublish/`, { method: 'POST', body: '{}' }),
  reorder: (modelName, ids, scope = {}) => request('/studio/content/reorder/', { method: 'PUT', body: JSON.stringify({ model_name: modelName, ids, ...scope }) }),
  messages: () => request('/studio/messages/'),
  updateMessage: (id, status) => request(`/studio/messages/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteMessage: (id) => request(`/studio/messages/${id}/`, { method: 'DELETE' }),
}
