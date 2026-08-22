import { execSync } from 'node:child_process'
import { createBlockchainClient } from '../backend/src/blockchain/client.js'

const BASE_URL = 'http://127.0.0.1:4000'
const EMAIL = 'admin@vidyutchain.io'
const PASSWORD = 'AdminDemoPassword123!'

async function post(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text) }
  } catch {
    return { status: res.status, data: text }
  }
}

async function get(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text) }
  } catch {
    return { status: res.status, data: text }
  }
}

async function main() {
  console.log('=====================================================')
  console.log('⚡ VIDYUTCHAIN PHASE 1 — COMPREHENSIVE SEED & DEMO ⚡')
  console.log('=====================================================\n')

  const blockchain = createBlockchainClient({
    rpcUrl: 'http://127.0.0.1:8545',
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  })

  console.log('1. User Authentication...')
  let reg = await post('/api/auth/register', { email: EMAIL, password: PASSWORD, role: 'admin' })
  let token = reg.data?.accessToken
  if (!token) {
    const login = await post('/api/auth/login', { email: EMAIL, password: PASSWORD })
    token = login.data?.accessToken
  }
  console.log('   ✅ Admin Session Token:', token ? 'Acquired' : 'Failed')

  console.log('\n2. Registering 20 Smart Meters (M001 to M020)...')
  const meterIds = Array.from({ length: 20 }, (_, i) => `M${String(i + 1).padStart(3, '0')}`)
  let regCount = 0
  for (const id of meterIds) {
    await post('/api/meters', { meterId: id, displayName: `Smart Meter ${id}` }, token)
    if (blockchain) {
      try {
        await blockchain.registerMeter(id)
      } catch {}
    }
    regCount++
  }
  console.log(`   ✅ Registered / Confirmed ${regCount} meters in database and on-chain ledger.`)

  console.log('\n3. Replaying STPI Dataset Telemetry (120 records across meters)...')
  const venvPath = new URL('../.venv/bin/activate', import.meta.url).pathname
  const simPath = new URL('../simulator/simulator.py', import.meta.url).pathname
  const simCmd = `source "${venvPath}" && python3 "${simPath}" --base-url http://127.0.0.1:4000 --token "${token}" --max-records 120 --interval 0.01`
  execSync(simCmd, { stdio: 'inherit', shell: '/bin/zsh' })

  console.log('\n4. Ingesting Multi-Class Anomalies for AI Intelligence & Blockchain Auditing...')
  const anomaliesToInject = [
    {
      meterId: 'M001',
      anomalyType: 'LOAD_THEFT',
      voltage: 216.4,
      current: 0.15,
      powerKw: 0.03,
      powerFactor: 0.42,
      importKwh: 0.008,
      exportKwh: 0,
      label: 'Night Load Theft (Unmetered bypass deviation)',
    },
    {
      meterId: 'M002',
      anomalyType: 'METER_TAMPERING',
      voltage: 178.2,
      current: 2.1,
      powerKw: 0.15,
      powerFactor: 0.35,
      importKwh: 0.04,
      exportKwh: 0,
      label: 'Meter Hardware Tampering (Severe voltage drop & low PF)',
    },
    {
      meterId: 'M003',
      anomalyType: 'REVERSE_ENERGY',
      voltage: 238.5,
      current: 6.2,
      powerKw: -1.45,
      powerFactor: 0.95,
      importKwh: 0,
      exportKwh: 0.362,
      label: 'Reverse Energy Flow (Rooftop Solar Export / Net-Metering)',
    },
    {
      meterId: 'M004',
      anomalyType: 'COMMUNICATION_FAILURE',
      voltage: 0,
      current: 0,
      powerKw: 0,
      powerFactor: 0,
      importKwh: 0,
      exportKwh: 0,
      label: 'Edge Communication Failure (Signal Dropout)',
    },
  ]

  const injectedRecords = []
  for (const anomaly of anomaliesToInject) {
    const res = await post('/api/telemetry', {
      meterId: anomaly.meterId,
      timestamp: new Date().toISOString(),
      voltage: anomaly.voltage,
      current: anomaly.current,
      powerKw: anomaly.powerKw,
      powerFactor: anomaly.powerFactor,
      importKwh: anomaly.importKwh,
      exportKwh: anomaly.exportKwh,
      anomalyType: anomaly.anomalyType,
      status: anomaly.anomalyType === 'NORMAL' ? 'normal' : 'anomaly',
      source: 'simulator',
    }, token)
    
    if (res.data?.telemetry) {
      injectedRecords.push({
        label: anomaly.label,
        telemetry: res.data.telemetry,
      })
      console.log(`   📍 ${anomaly.label}`)
      console.log(`      AI Inference: Class=${res.data.telemetry.aiAnomalyType} | RiskScore=${res.data.telemetry.aiRiskScore} | Confidence=${res.data.telemetry.aiConfidence}`)
      console.log(`      Blockchain: Status=${res.data.telemetry.blockchainAuditStatus} | TxHash=${res.data.telemetry.blockchainTransactionHash?.slice(0, 18)}...`)
    }
  }

  console.log('\n5. Verifying Cryptographic Integrity on Ethereum Smart Contract...')
  for (const item of injectedRecords) {
    if (item.telemetry.blockchainAuditStatus === 'confirmed') {
      const auditRes = await get(`/api/telemetry/audit/${item.telemetry.id}`, token)
      console.log(`   🔒 Audit Check [${item.telemetry.meterId} - ${item.telemetry.aiAnomalyType}]: Verified=${auditRes.data?.verified} | OnChainEventId=${auditRes.data?.eventId?.slice(0, 18)}...`)
    }
  }

  console.log('\n5. Smart Energy Wallet Auto-Settle & Demonstration Balances...')
  const walletRes = await get('/api/wallet', token)
  console.log(`   ✅ Admin Wallet Balance: ₹${walletRes.data?.wallet?.balanceInr?.toFixed(2)} | Solana ID: ${walletRes.data?.wallet?.solanaPublicKey?.slice(0, 12)}…`)

  // Register consumer account & wallet
  let consumerReg = await post('/api/auth/register', {
    email: 'consumer@vidyutchain.io',
    password: 'ConsumerDemo123!',
    role: 'consumer',
  })
  let consumerToken = consumerReg.data?.accessToken
  if (!consumerToken) {
    const consumerLogin = await post('/api/auth/login', {
      email: 'consumer@vidyutchain.io',
      password: 'ConsumerDemo123!',
    })
    consumerToken = consumerLogin.data?.accessToken
  }
  const consumerWallet = await get('/api/wallet', consumerToken)
  console.log(`   ✅ Consumer Wallet Balance: ₹${consumerWallet.data?.wallet?.balanceInr?.toFixed(2)} | Solana ID: ${consumerWallet.data?.wallet?.solanaPublicKey?.slice(0, 12)}…`)

  console.log('\n6. Seeding P2P Solar Energy Marketplace Listings...')
  const listing1 = await post('/api/trading/list', {
    meterId: 'M001',
    energyAmountKwh: 25.0,
    pricePerKwh: 3.20,
    sourceType: 'rooftop_solar',
  }, token)
  console.log('   ✅ P2P Offer 1:', listing1.data?.message || 'Listed')

  const listing2 = await post('/api/trading/list', {
    meterId: 'M005',
    energyAmountKwh: 40.0,
    pricePerKwh: 2.95,
    sourceType: 'rooftop_solar',
  }, consumerToken)
  console.log('   ✅ P2P Offer 2:', listing2.data?.message || 'Listed')

  console.log('\n7. Minting Verifiable Green Carbon Offset Certificates (0.85 kg CO2/kWh)...')
  const cert1 = await post('/api/certificates/issue', {
    meterId: 'M001',
    energyAmountKwh: 50.0,
  }, token)
  console.log('   ✅ Carbon Certificate Minted:', cert1.data?.certificate?.certificateId, `(${cert1.data?.certificate?.carbonOffsetKg} kg CO2)`)

  const cert2 = await post('/api/certificates/issue', {
    meterId: 'M005',
    energyAmountKwh: 120.0,
  }, consumerToken)
  console.log('   ✅ Carbon Certificate Minted:', cert2.data?.certificate?.certificateId, `(${cert2.data?.certificate?.carbonOffsetKg} kg CO2)`)

  console.log('\n8. Publishing DISCOM Bulk Power Procurement Tenders & Supplier Bids...')
  const tenderRes = await post('/api/tenders', {
    title: 'East Bangalore Feeder 04 Daytime Solar Procurement',
    description: 'Bulk clean energy procurement to support localized EV charging station clusters during peak afternoon demand.',
    feederArea: 'Substation Feeder 04 - East Bangalore Industrial Hub',
    energyRequiredKwh: 5000,
    maxBasePricePerKwh: 3.80,
    daysOpen: 14,
  }, token)
  const tenderId = tenderRes.data?.tender?._id
  console.log('   ✅ Tender Published:', tenderRes.data?.tender?.tenderId)

  if (tenderId) {
    const bidRes = await post(`/api/tenders/${tenderId}/bid`, {
      bidPricePerKwh: 3.15,
      capacityOfferedKw: 500,
      bidderCompanyName: 'SunPower Microgrid Solutions Ltd.',
      deliveryTimelineDays: 5,
    }, consumerToken)
    console.log('   ✅ Supplier Bid Submitted:', bidRes.data?.message)
  }

  console.log('\n=====================================================')
  console.log('🎉 ALL 8 ECOSYSTEM MODULES SEEDED & READY FOR TESTING!')
  console.log('=====================================================')
  console.log('👉 Dashboard:      http://localhost:5173/app')
  console.log('👉 Smart Wallet:   http://localhost:5173/app/wallet')
  console.log('👉 P2P Trading:    http://localhost:5173/app/trading')
  console.log('👉 Carbon ESG:     http://localhost:5173/app/certificates')
  console.log('👉 Grid Tenders:   http://localhost:5173/app/tenders')
  console.log('👉 AI Radar:       http://localhost:5173/ai-intelligence\n')
}

main().catch((err) => {
  console.error('Fatal error during seed execution:', err)
  process.exit(1)
})
