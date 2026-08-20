#!/usr/bin/env node

const baseUrl = (process.env.VIDYUTCHAIN_BASE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '')
const email = process.env.E2E_EMAIL || `e2e-${Date.now()}@vidyutchain.local`
const password = process.env.E2E_PASSWORD
const meterId = (process.env.E2E_METER_ID || `E2E-METER-${Date.now()}`).toUpperCase()

if (!password || password.length < 8) {
  console.error('E2E_PASSWORD must be provided and contain at least 8 characters')
  process.exit(2)
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }
  return { response, body }
}

function assertStatus(result, expected, label) {
  if (result.response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, received ${result.response.status}: ${JSON.stringify(result.body)}`)
  }
}

function authHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` }
}

async function registerOrLogin() {
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role: 'consumer' }),
  })

  if (registration.response.status === 201) {
    return registration.body.accessToken
  }
  if (registration.response.status !== 409) {
    assertStatus(registration, 201, 'register user')
  }

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  assertStatus(login, 200, 'login user')
  return login.body.accessToken
}

async function registerOrFindMeter(accessToken) {
  const headers = authHeaders(accessToken)
  const registration = await request('/api/meters', {
    method: 'POST',
    headers,
    body: JSON.stringify({ meterId, displayName: 'End-to-end test meter' }),
  })

  if (registration.response.status === 201) {
    return
  }
  if (registration.response.status !== 500) {
    const existing = await request(`/api/meters/${meterId}`, { headers })
    assertStatus(existing, 200, 'find existing meter')
    return
  }

  assertStatus(registration, 201, 'register meter')
}

async function main() {
  const health = await request('/health')
  assertStatus(health, 200, 'health check')

  const accessToken = await registerOrLogin()
  await registerOrFindMeter(accessToken)
  const headers = authHeaders(accessToken)
  const timestamp = new Date().toISOString()

  const telemetry = await request('/api/telemetry', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      meterId,
      timestamp,
      voltage: 231.2,
      current: 4.2,
      powerKw: 0.91,
      powerFactor: 0.94,
      importKwh: 147.2,
      exportKwh: 0,
      anomalyType: 'NORMAL',
      status: 'normal',
      source: 'manual',
    }),
  })
  assertStatus(telemetry, 201, 'ingest telemetry')

  const latest = await request(`/api/telemetry/latest/${meterId}`, { headers })
  assertStatus(latest, 200, 'query latest')
  if (latest.body.telemetry?.meterId !== meterId) {
    throw new Error(`query latest: expected meter ${meterId}`)
  }

  const history = await request(`/api/telemetry/history/${meterId}?limit=10`, { headers })
  assertStatus(history, 200, 'query history')
  if (history.body.count < 1) {
    throw new Error('query history: expected at least one stored record')
  }

  const aggregation = await request(`/api/telemetry/aggregation/${meterId}?interval=daily`, { headers })
  assertStatus(aggregation, 200, 'query aggregation')
  if (!Array.isArray(aggregation.body.aggregation) || aggregation.body.aggregation.length < 1) {
    throw new Error('query aggregation: expected at least one bucket')
  }

  const unauthenticated = await request('/api/telemetry', {
    method: 'POST',
    body: JSON.stringify({ meterId }),
  })
  assertStatus(unauthenticated, 401, 'reject unauthenticated telemetry')

  const invalid = await request('/api/telemetry', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...telemetry.body.telemetry, voltage: 700 }),
  })
  assertStatus(invalid, 400, 'reject invalid telemetry')

  const unknownMeter = await request('/api/telemetry', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      meterId: 'UNKNOWN-METER',
      timestamp,
      voltage: 231.2,
      current: 4.2,
      powerKw: 0.91,
      powerFactor: 0.94,
      importKwh: 1,
      exportKwh: 0,
      anomalyType: 'NORMAL',
      status: 'normal',
      source: 'manual',
    }),
  })
  assertStatus(unknownMeter, 404, 'reject unknown meter')

  console.log(JSON.stringify({
    status: 'passed',
    baseUrl,
    email,
    meterId,
    checks: [
      'health',
      'register-or-login',
      'register-or-find-meter',
      'ingest-telemetry',
      'query-latest',
      'query-history',
      'query-aggregation',
      'reject-unauthenticated',
      'reject-invalid-telemetry',
      'reject-unknown-meter',
    ],
  }, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'failed', error: error.message }, null, 2))
  process.exitCode = 1
})
