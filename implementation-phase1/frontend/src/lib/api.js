const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'content-type': 'application/json' }
  if (token) {
    headers.authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Request failed with status ${response.status}`,
      response.status,
      payload?.details,
    )
  }

  return payload
}

export const api = {
  health: () => apiRequest('/health'),
  login: (credentials) => apiRequest('/api/auth/login', { method: 'POST', body: credentials }),
  register: (credentials) => apiRequest('/api/auth/register', { method: 'POST', body: credentials }),
  me: (token) => apiRequest('/api/auth/me', { token }),
  meters: (token) => apiRequest('/api/meters', { token }),
  createMeter: (token, meter) => apiRequest('/api/meters', { method: 'POST', body: meter, token }),
  latestTelemetry: (token, meterId) => apiRequest(`/api/telemetry/latest/${encodeURIComponent(meterId)}`, { token }),
  telemetryHistory: (token, meterId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/api/telemetry/history/${encodeURIComponent(meterId)}${query ? `?${query}` : ''}`, { token })
  },
  telemetryAggregation: (token, meterId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/api/telemetry/aggregation/${encodeURIComponent(meterId)}${query ? `?${query}` : ''}`, { token })
  },
  auditTelemetry: (token, telemetryId) => apiRequest(`/api/telemetry/audit/${encodeURIComponent(telemetryId)}`, { token }),
  walletSummary: (token) => apiRequest('/api/wallet/summary', { token }),
  energyListings: (token) => apiRequest('/api/marketplace/listings', { token }),
}
