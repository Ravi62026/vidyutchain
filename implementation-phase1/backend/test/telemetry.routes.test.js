import assert from 'node:assert/strict'
import http from 'node:http'
import test from 'node:test'
import { createApp } from '../src/app.js'
import {
  buildAggregationPipeline,
  buildBlockchainAuditPayload,
  buildTelemetryFilter,
  telemetryAggregationQuerySchema,
  telemetryHistoryQuerySchema,
  telemetryInputSchema,
} from '../src/routes/telemetry.routes.js'

const validTelemetry = {
  meterId: 'vc-meter-001',
  timestamp: '2026-08-20T12:00:00.000Z',
  voltage: 231.2,
  current: 4.2,
  powerKw: 0.91,
  powerFactor: 0.94,
  importKwh: 147.2,
  exportKwh: 18.6,
  anomalyType: 'NORMAL',
  source: 'simulator',
}

test('telemetry input accepts normal readings and normalizes meter IDs', () => {
  const result = telemetryInputSchema.parse(validTelemetry)

  assert.equal(result.meterId, 'VC-METER-001')
  assert.equal(result.timestamp instanceof Date, true)
  assert.equal(result.status, 'normal')
})

test('blockchain audit payload contains reproducible anomaly evidence metadata', () => {
  const payload = buildBlockchainAuditPayload(
    {
      _id: { toString: () => 'telemetry-001' },
      meterId: 'VC-METER-001',
      timestamp: new Date('2026-08-20T12:00:00.000Z'),
    },
    {
      anomalyType: 'LOAD_THEFT',
      modelVersion: 'rf-2026.08',
      riskScore: 0.94,
      confidence: 0.91,
      reasons: ['abnormal consumption pattern'],
    },
  )

  assert.deepEqual(payload, {
    telemetryId: 'telemetry-001',
    meterId: 'VC-METER-001',
    timestamp: '2026-08-20T12:00:00.000Z',
    anomalyType: 'LOAD_THEFT',
    modelVersion: 'rf-2026.08',
    riskScore: 0.94,
    confidence: 0.91,
    reasons: ['abnormal consumption pattern'],
  })
})

test('telemetry input accepts negative power for reverse energy', () => {
  const result = telemetryInputSchema.parse({
    ...validTelemetry,
    powerKw: -2.5,
    importKwh: 0,
    exportKwh: 0.625,
    status: 'anomaly',
    anomalyType: 'REVERSE_ENERGY',
  })

  assert.equal(result.powerKw, -2.5)
  assert.equal(result.exportKwh, 0.625)
  assert.equal(result.anomalyType, 'REVERSE_ENERGY')
})

test('telemetry input rejects unsafe electrical values and missing fields', () => {
  assert.equal(telemetryInputSchema.safeParse({ ...validTelemetry, voltage: 700 }).success, false)
  assert.equal(telemetryInputSchema.safeParse({ ...validTelemetry, powerFactor: 1.5 }).success, false)
  assert.equal(telemetryInputSchema.safeParse({ ...validTelemetry, importKwh: -1 }).success, false)
  assert.equal(telemetryInputSchema.safeParse({ meterId: 'VC-METER-001' }).success, false)
})

test('history query applies defaults and bounded date filters', () => {
  const query = telemetryHistoryQuerySchema.parse({
    from: '2026-08-20T00:00:00.000Z',
    to: '2026-08-21T00:00:00.000Z',
    limit: '25',
  })

  assert.equal(query.limit, 25)
  assert.deepEqual(buildTelemetryFilter('vc-meter-001', query), {
    meterId: 'VC-METER-001',
    timestamp: {
      $gte: new Date('2026-08-20T00:00:00.000Z'),
      $lte: new Date('2026-08-21T00:00:00.000Z'),
    },
  })
})

test('history query rejects reversed dates and excessive limits', () => {
  assert.equal(telemetryHistoryQuerySchema.safeParse({
    from: '2026-08-21T00:00:00.000Z',
    to: '2026-08-20T00:00:00.000Z',
  }).success, false)
  assert.equal(telemetryHistoryQuerySchema.safeParse({ limit: '501' }).success, false)
})

test('aggregation pipeline groups daily UTC readings and sorts buckets', () => {
  const query = telemetryAggregationQuerySchema.parse({ interval: 'daily' })
  const pipeline = buildAggregationPipeline('vc-meter-001', query)

  assert.deepEqual(pipeline[0], { $match: { meterId: 'VC-METER-001' } })
  assert.equal(pipeline[1].$group._id.$dateTrunc.unit, 'day')
  assert.equal(pipeline[1].$group._id.$dateTrunc.timezone, 'UTC')
  assert.deepEqual(pipeline[3], { $sort: { timestamp: 1 } })
})

test('telemetry routes reject unauthenticated access before database calls', async () => {
  const server = http.createServer(createApp())
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/telemetry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validTelemetry),
    })
    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'Authentication required' })
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('telemetry query routes reject unauthenticated access before database calls', async () => {
  const server = http.createServer(createApp())
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()

  try {
    for (const path of [
      '/api/telemetry/latest/VC-METER-001',
      '/api/telemetry/history/VC-METER-001',
      '/api/telemetry/aggregation/VC-METER-001?interval=daily',
      '/api/telemetry/audit/invalid-id',
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`)
      assert.equal(response.status, 401, path)
      assert.deepEqual(await response.json(), { error: 'Authentication required' })
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('API errors use a safe JSON response for malformed requests', async () => {
  const server = http.createServer(createApp())
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":',
    })

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'Unexpected end of JSON input' })
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})
