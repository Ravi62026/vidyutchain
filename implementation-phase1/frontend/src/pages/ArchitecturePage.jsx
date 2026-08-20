import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Layers,
  Lock,
  Radio,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react'

const tiers = [
  {
    tier: 'Tier 01',
    title: 'Smart Meter & Edge Hardware Layer',
    subtitle: 'Modbus RS485 / DLMS & ESP32 IoT Microcontroller',
    desc: 'Captures physical electrical telemetry (RMS Voltage, Load Current, Real/Reactive Power, Power Factor, and Net KWh). The ESP32 edge gateway packages readings into encrypted JSON payloads.',
    badge: 'Hardware Edge',
    tech: 'ESP32 • RS485 Transceiver • FreeRTOS • HTTPS/TLS',
  },
  {
    tier: 'Tier 02',
    title: 'Cloud Ingestion & REST Platform API',
    subtitle: 'Node.js Express 5 Engine & High-Throughput Pipeline',
    desc: 'Enforces strict Zod payload validation, HMAC-SHA256 JWT bearer authorization, and rate limiting (600 req/min). Dispatches telemetry concurrently to MongoDB persistence, FastAPI AI evaluation, and blockchain nonces.',
    badge: 'Backend Core',
    tech: 'Node.js v24 • Express 5 • Zod • Helmet • Pino Logger',
  },
  {
    tier: 'Tier 03',
    title: 'Operational Time-Series Database',
    subtitle: 'MongoDB 8.3 Enterprise Document Store',
    desc: 'Stores high-resolution telemetry records, compound indices on (meterId, timestamp desc), user authentication hashes, and on-chain transaction metadata with multi-tenant tenant isolation.',
    badge: 'Database',
    tech: 'MongoDB 8.3 • Mongoose ODM • Time-Series Indexed',
  },
  {
    tier: 'Tier 04',
    title: 'Machine Learning Intelligence Microservice',
    subtitle: 'FastAPI Python 3.11 Inference Engine',
    desc: 'Applies RandomForestClassifier and Isolation Forest trained on STPI household energy datasets. Computes real-time anomaly diagnosis, risk score (0.00–1.00), confidence percentage, and theft deviation explanations.',
    badge: 'AI Engine',
    tech: 'Python 3.11 • FastAPI • Uvicorn • scikit-learn • Pandas',
  },
  {
    tier: 'Tier 05',
    title: 'Immutable Blockchain Audit Layer',
    subtitle: 'Private EVM Hardhat Chain & EnergyAudit.sol',
    desc: 'Zero-raw-data smart contract architecture. Stores only canonical Keccak-256 evidence digests and event IDs. Provides instant tamper-proof verification: if database records are manipulated, hash validation fails immediately.',
    badge: 'Blockchain',
    tech: 'Solidity 0.8.26 • Hardhat EVM • ethers.js • Keccak-256',
  },
]

export function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16 animate-rise">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007062] shadow-sm">
          <Server size={14} />
          <span>System Architecture & Technical Blueprint</span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl lg:text-6xl">
          Five-Tier <span className="gradient-text-emerald">Resilient Architecture</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#456157]">
          VidyutChain separates high-throughput real-time telemetry processing from intensive machine learning inference and immutable blockchain auditing.
        </p>
      </div>

      {/* Architecture Flow Banner */}
      <div className="mt-14 glass-panel rounded-3xl p-8 sm:p-10 border border-[#d8e3dc] shadow-sm">
        <h3 className="font-display text-2xl font-bold text-[#092b24]">End-to-End Data Pipeline Flow</h3>
        <p className="mt-1 text-xs text-[#5a786f]">Sequential path of a single telemetry reading packet through the platform:</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-5 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <span className="font-mono text-xs font-bold text-[#007062]">STEP 01</span>
            <p className="mt-2 font-display text-sm font-bold text-[#092b24]">Meter Sample</p>
            <p className="mt-1 text-[11px] text-[#5a786f]">V, I, kW, PF, kWh</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <span className="font-mono text-xs font-bold text-[#007062]">STEP 02</span>
            <p className="mt-2 font-display text-sm font-bold text-[#092b24]">Ingestion API</p>
            <p className="mt-1 text-[11px] text-[#5a786f]">JWT & Zod Check</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <span className="font-mono text-xs font-bold text-[#007062]">STEP 03</span>
            <p className="mt-2 font-display text-sm font-bold text-[#092b24]">AI Inference</p>
            <p className="mt-1 text-[11px] text-[#5a786f]">Theft & Tamper Score</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <span className="font-mono text-xs font-bold text-[#007062]">STEP 04</span>
            <p className="mt-2 font-display text-sm font-bold text-[#092b24]">MongoDB Store</p>
            <p className="mt-1 text-[11px] text-[#5a786f]">Time-Series Indexed</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <span className="font-mono text-xs font-bold text-[#007062]">STEP 05</span>
            <p className="mt-2 font-display text-sm font-bold text-[#092b24]">EVM Digest</p>
            <p className="mt-1 text-[11px] text-[#5a786f]">Keccak-256 Hash Log</p>
          </div>
        </div>
      </div>

      {/* 5 Tiers Detailed Cards */}
      <div className="mt-14 space-y-6">
        {tiers.map((tier, idx) => (
          <div
            key={tier.tier}
            className="glass-card rounded-3xl p-7 sm:p-9 border border-[#d8e3dc] transition hover:border-[#007062]/40"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-[#d8e3dc]/70 pb-5">
              <div className="flex items-center gap-3.5">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md font-mono font-bold text-sm">
                  0{idx + 1}
                </span>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#007062]">
                    {tier.tier}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#092b24]">{tier.title}</h3>
                  <p className="text-xs text-[#5a786f]">{tier.subtitle}</p>
                </div>
              </div>

              <span className="self-start sm:self-auto rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                {tier.badge}
              </span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[#4d6b61] max-w-4xl">{tier.desc}</p>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-mono text-xs text-[#0c2b25] border border-slate-200/80">
              <span className="font-bold text-[#007062]">Tech Stack:</span>
              <span>{tier.tech}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-[#007062] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#007062]/25 transition hover:bg-[#005c51] hover:scale-105"
        >
          <span>Explore Live System Health</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
