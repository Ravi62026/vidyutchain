import { expect } from 'chai'
import hre from 'hardhat'

const { ethers } = hre

describe('EnergyAudit', function () {
  async function deployAudit() {
    const auditFactory = await ethers.getContractFactory('EnergyAudit')
    const audit = await auditFactory.deploy()
    await audit.waitForDeployment()
    return audit
  }

  it('registers a meter and prevents duplicate registration', async function () {
    const audit = await deployAudit()
    const meterIdHash = ethers.id('VC-METER-001')

    await expect(audit.registerMeter(meterIdHash))
      .to.emit(audit, 'MeterRegistered')

    expect(await audit.registeredMeters(meterIdHash)).to.equal(true)
    await expect(audit.registerMeter(meterIdHash)).to.be.revertedWith('meter already registered')
  })

  it('logs and verifies a hashed audit event without storing raw telemetry', async function () {
    const audit = await deployAudit()
    const meterIdHash = ethers.id('VC-METER-001')
    const eventTypeHash = ethers.id('ANOMALY_EVENT')
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
      meterId: 'VC-METER-001',
      anomalyType: 'LOAD_THEFT',
      riskScore: 0.94,
    })))

    await audit.registerMeter(meterIdHash)
    const transaction = await audit.logAuditEvent(meterIdHash, eventTypeHash, payloadHash)
    const receipt = await transaction.wait()
    const eventId = ethers.solidityPackedKeccak256(
      ['bytes32', 'bytes32', 'bytes32'],
      [meterIdHash, eventTypeHash, payloadHash],
    )

    expect(receipt.status).to.equal(1)
    const [exists, returnedEventId] = await audit.verifyAuditEvent(meterIdHash, eventTypeHash, payloadHash)
    expect(exists).to.equal(true)
    expect(returnedEventId).to.equal(eventId)

    const record = await audit.getAuditRecord(eventId)
    expect(record.meterIdHash).to.equal(meterIdHash)
    expect(record.eventTypeHash).to.equal(eventTypeHash)
    expect(record.payloadHash).to.equal(payloadHash)
    expect(record.submitter).to.equal(await audit.runner.getAddress())
  })

  it('rejects events for unregistered meters and changed payload hashes', async function () {
    const audit = await deployAudit()
    const meterIdHash = ethers.id('VC-METER-001')
    const eventTypeHash = ethers.id('ENERGY_CHECKPOINT')
    const payloadHash = ethers.id('payload-v1')

    await expect(audit.logAuditEvent(meterIdHash, eventTypeHash, payloadHash))
      .to.be.revertedWith('meter not registered')

    await audit.registerMeter(meterIdHash)
    await audit.logAuditEvent(meterIdHash, eventTypeHash, payloadHash)

    const [exists] = await audit.verifyAuditEvent(meterIdHash, eventTypeHash, ethers.id('payload-tampered'))
    expect(exists).to.equal(false)
  })
})
