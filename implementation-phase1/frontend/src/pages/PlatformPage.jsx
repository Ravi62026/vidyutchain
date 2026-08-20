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
  Sparkles,
  Zap,
} from 'lucide-react'

export function PlatformPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16 animate-rise">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007062] shadow-sm">
          <Layers size={14} />
          <span>VidyutChain Platform Overview</span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl lg:text-6xl">
          Unified Smart Energy & <span className="gradient-text-emerald">Grid Intelligence</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#456157]">
          An end-to-end platform engineered for state utilities (DISCOMs), power regulators, and rooftop solar prosumers. Combining high-throughput IoT ingestion with machine-learning theft detection and immutable blockchain audits.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="mt-16 grid gap-7 md:grid-cols-3">
        <div className="glass-card rounded-3xl p-8 border border-[#d8e3dc] transition hover:border-[#007062]/40 hover:shadow-xl">
          <span className="grid size-14 place-items-center rounded-2xl bg-emerald-500/10 text-[#007062] shadow-sm">
            <Gauge size={28} />
          </span>
          <span className="mt-6 inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#007062]">
            Pillar 01
          </span>
          <h3 className="mt-1 font-display text-2xl font-bold text-[#092b24]">High-Frequency Telemetry</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#4d6b61]">
            Ingests Voltage (V), Current (A), Active Power (kW), Power Factor (Cos φ), and bidirectional import/export kWh in sub-50ms latency batches from smart meters.
          </p>
          <ul className="mt-6 space-y-2.5 text-xs font-semibold text-[#092b24]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>DLMS/COSEM & Modbus RS485 Ready</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Multi-tenant owner data isolation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Time-series indexing on MongoDB 8.3</span>
            </li>
          </ul>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-[#d8e3dc] transition hover:border-[#007062]/40 hover:shadow-xl">
          <span className="grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-800 shadow-sm">
            <Cpu size={28} />
          </span>
          <span className="mt-6 inline-block text-[11px] font-extrabold uppercase tracking-widest text-amber-800">
            Pillar 02
          </span>
          <h3 className="mt-1 font-display text-2xl font-bold text-[#092b24]">AI Electricity Theft Radar</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#4d6b61]">
            FastAPI machine learning engine classifying 5 distinct operational modes with continuous risk scoring (0.00–1.00) and automated anomaly notifications.
          </p>
          <ul className="mt-6 space-y-2.5 text-xs font-semibold text-[#092b24]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
              <span>99.5% accuracy trained on STPI datasets</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
              <span>Unmetered bypass & load theft detection</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
              <span>Low PF and hardware tampering alerts</span>
            </li>
          </ul>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-[#d8e3dc] transition hover:border-[#007062]/40 hover:shadow-xl">
          <span className="grid size-14 place-items-center rounded-2xl bg-teal-500/10 text-teal-800 shadow-sm">
            <Blocks size={28} />
          </span>
          <span className="mt-6 inline-block text-[11px] font-extrabold uppercase tracking-widest text-teal-800">
            Pillar 03
          </span>
          <h3 className="mt-1 font-display text-2xl font-bold text-[#092b24]">Blockchain Audit Integrity</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#4d6b61]">
            Zero-knowledge-style canonical Keccak-256 hash logging on Solidity smart contracts. Guarantees immutable dispute resolution without exposing private raw telemetry.
          </p>
          <ul className="mt-6 space-y-2.5 text-xs font-semibold text-[#092b24]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
              <span>EnergyAudit.sol EVM smart contract</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
              <span>Automatic tamper detection on verification</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
              <span>Serialized nonce queue for zero collisions</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Target Audiences & Use Cases */}
      <div className="mt-16 rounded-3xl border border-[#d8e3dc] bg-white/80 p-8 sm:p-12 shadow-sm">
        <h2 className="font-display text-3xl font-extrabold text-[#082822]">
          Built for Multi-Stakeholder Energy Ecosystems
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-900/10 bg-[#f4f7f5] p-6">
            <h4 className="font-display text-xl font-bold text-[#005c51]">🏢 DISCOM & Grid Operators (B2B)</h4>
            <p className="mt-2 text-xs leading-relaxed text-[#4d6b61]">
              Substation-level fleet control room to observe aggregated technical & commercial (AT&C) losses, locate unmetered theft hotspots in real-time, and enforce cryptographic compliance.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-900/10 bg-[#f4f7f5] p-6">
            <h4 className="font-display text-xl font-bold text-teal-800">🏡 Solar Prosumers & Households (B2C)</h4>
            <p className="mt-2 text-xs leading-relaxed text-[#4d6b61]">
              Dedicated mobile PWA and consumer dashboard to monitor real-time consumption, solar feed-in tariffs, net-metering exports, and independently verify billing data on-chain.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#007062]/25 transition hover:scale-105"
          >
            <span>Launch Platform Console</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
