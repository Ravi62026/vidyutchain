import assert from 'node:assert/strict'
import http from 'node:http'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { meterInputSchema } from '../src/routes/meter.routes.js'

test('meter input normalizes the meter identifier', () => {
  const result = meterInputSchema.parse({ meterId: ' vc-meter-001 ', displayName: 'Main residence' })

  assert.deepEqual(result, { meterId: 'VC-METER-001', displayName: 'Main residence' })
})

test('meter input rejects missing and short values', () => {
  assert.equal(meterInputSchema.safeParse({}).success, false)
  assert.equal(meterInputSchema.safeParse({ meterId: 'x', displayName: 'A' }).success, false)
})

test('meter routes reject unauthenticated access before database calls', async () => {
  const server = http.createServer(createApp())
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/meters`)
    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'Authentication required' })
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})
