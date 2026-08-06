const BASE = (import.meta.env?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, { ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail || Object.values(data).flat().join(' ') || 'Unable to send your message.'
    throw new Error(detail)
  }
  return data
}

export const contactApi = {
  config: () => jsonRequest('/contact/config/'),
  submit: (data) => jsonRequest('/contact/', { method: 'POST', body: JSON.stringify(data) }),
}
