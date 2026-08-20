import assert from 'node:assert/strict'
import test from 'node:test'
import { auditHashes, createBlockchainClient, hashAuditPayload } from '../src/blockchain/client.js'

test('audit payload hashing is stable regardless of object key order', () => {
  const first = hashAuditPayload({ meterId: 'M001', riskScore: 0.94, anomalyType: 'LOAD_THEFT' })
  const second = hashAuditPayload({ anomalyType: 'LOAD_THEFT', riskScore: 0.94, meterId: 'M001' })

  assert.equal(first, second)
})

test('audit hashes separate meter, event type, and payload digests', () => {
  const hashes = auditHashes({
    meterId: 'M001',
    eventType: 'ANOMALY_EVENT',
    payload: { riskScore: 0.94 },
  })

  assert.match(hashes.meterIdHash, /^0x[0-9a-f]{64}$/)
  assert.match(hashes.eventTypeHash, /^0x[0-9a-f]{64}$/)
  assert.match(hashes.payloadHash, /^0x[0-9a-f]{64}$/)
  assert.notEqual(hashes.payloadHash, hashAuditPayload({ riskScore: 0.95 }))
})

test('blockchain client stays disabled until deployment credentials exist', () => {
  assert.equal(createBlockchainClient({ contractAddress: '', privateKey: '' }), null)
})