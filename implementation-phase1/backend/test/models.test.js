import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { Alert, Meter, Telemetry, User } from '../src/models/index.js'

test('all core models load with expected names', () => {
  assert.equal(User.modelName, 'User')
  assert.equal(Meter.modelName, 'Meter')
  assert.equal(Telemetry.modelName, 'Telemetry')
  assert.equal(Alert.modelName, 'Alert')
})

test('required fields reject incomplete documents', async () => {
  await assert.rejects(new User({}).validate())
  await assert.rejects(new Meter({}).validate())
  await assert.rejects(new Telemetry({}).validate())
  await assert.rejects(new Alert({}).validate())
})

test('valid documents pass schema validation and normalize identifiers', async () => {
  const user = new User({ email: 'Operator@Example.com', passwordHash: 'hashed-password' })
  const meter = new Meter({
    meterId: 'vc-meter-001',
    owner: new mongoose.Types.ObjectId(),
    displayName: 'Main residence',
  })
  const telemetry = new Telemetry({
    meterId: 'vc-meter-001',
    timestamp: new Date(),
    voltage: 231.2,
    current: 4.2,
    powerKw: 0.91,
    powerFactor: 0.94,
    importKwh: 147.2,
    exportKwh: 18.6,
    source: 'simulator',
  })
  const alert = new Alert({
    meterId: 'vc-meter-001',
    telemetryId: new mongoose.Types.ObjectId(),
    anomalyType: 'LOAD_THEFT',
    severity: 'high',
    riskScore: 0.93,
  })

  await Promise.all([user.validate(), meter.validate(), telemetry.validate(), alert.validate()])
  assert.equal(user.email, 'operator@example.com')
  assert.equal(meter.meterId, 'VC-METER-001')
  assert.equal(telemetry.meterId, 'VC-METER-001')
  assert.equal(alert.meterId, 'VC-METER-001')
})

test('required unique and query indexes are declared', () => {
  const userIndexes = User.schema.indexes()
  const meterIndexes = Meter.schema.indexes()
  const telemetryIndexes = Telemetry.schema.indexes()
  const alertIndexes = Alert.schema.indexes()

  assert.ok(userIndexes.some(([fields, options]) => fields.email === 1 && options.unique === true))
  assert.ok(meterIndexes.some(([fields, options]) => fields.meterId === 1 && options.unique === true))
  assert.ok(telemetryIndexes.some(([fields]) => fields.meterId === 1 && fields.timestamp === -1))
  assert.ok(alertIndexes.some(([fields]) => fields.meterId === 1 && fields.status === 1 && fields.createdAt === -1))
})
