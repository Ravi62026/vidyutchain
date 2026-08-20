import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyTelemetry } from '../src/ai/client.js'

const telemetry = {
  meterId: 'M001',
  timestamp: new Date('2026-08-20T12:00:00.000Z'),
  voltage: 231.2,
  current: 4.2,
  powerKw: 0.91,
  powerFactor: 0.94,
  importKwh: 0.2275,
  exportKwh: 0,
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body
    },
  }
}

test('AI client parses a valid prediction response', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, 'POST')
    assert.equal(JSON.parse(options.body).meterId, 'M001')
    return response(200, {
      meterId: 'M001',
      modelVersion: 'rf-stpi-v1',
      anomalyType: 'NORMAL',
      status: 'normal',
      riskScore: 0.1,
      confidence: 0.9,
      reasons: ['reading is consistent with the learned normal profile'],
    })
  }

  try {
    const result = await classifyTelemetry(telemetry)
    assert.equal(result.anomalyType, 'NORMAL')
    assert.equal(result.riskScore, 0.1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('AI client fails open on non-success responses', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => response(503, { error: 'unavailable' })

  try {
    assert.equal(await classifyTelemetry(telemetry), null)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('AI client fails open on network errors', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error('AI service offline')
  }

  try {
    assert.equal(await classifyTelemetry(telemetry), null)
  } finally {
    globalThis.fetch = originalFetch
  }
})
