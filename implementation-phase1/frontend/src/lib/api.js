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
  
  // Wallet & Payment
  getWallet: (token) => apiRequest('/api/wallet', { token }),
  depositWallet: (token, data) => apiRequest('/api/wallet/deposit', { method: 'POST', body: data, token }),
  withdrawWallet: (token, data) => apiRequest('/api/wallet/withdraw', { method: 'POST', body: data, token }),
  toggleAutoSettle: (token, enabled) => apiRequest('/api/wallet/auto-settle', { method: 'POST', body: { enabled }, token }),

  // P2P Solar Trading
  getTradingListings: (token) => apiRequest('/api/trading/listings', { token }),
  listEnergy: (token, data) => apiRequest('/api/trading/list', { method: 'POST', body: data, token }),
  buyEnergy: (token, listingId, kwh) => apiRequest(`/api/trading/buy/${listingId}`, { method: 'POST', body: { buyKwh: kwh }, token }),
  suggestPrice: (token, kwh) => apiRequest(`/api/trading/suggest-price?kwh=${kwh}`, { token }),

  // Carbon ESG Certificates
  getCertificates: (token) => apiRequest('/api/certificates', { token }),
  issueCertificate: (token, data) => apiRequest('/api/certificates/issue', { method: 'POST', body: data, token }),
  claimCertificate: (token, certId, purpose) => apiRequest(`/api/certificates/claim/${certId}`, { method: 'POST', body: { claimPurpose: purpose }, token }),

  // DISCOM Power Tenders
  getTenders: (token) => apiRequest('/api/tenders', { token }),
  createTender: (token, data) => apiRequest('/api/tenders', { method: 'POST', body: data, token }),
  submitBid: (token, tenderId, data) => apiRequest(`/api/tenders/${tenderId}/bid`, { method: 'POST', body: data, token }),
  awardTender: (token, tenderId, bidId) => apiRequest(`/api/tenders/${tenderId}/award`, { method: 'POST', body: { bidId }, token }),
}
