import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Blocks,
  CheckCircle,
  Database,
  Gauge,
  Radio,
  ShieldCheck,
} from 'lucide-react'

const metrics = [
  { label: 'Meters monitored', value: '20', detail: 'Pilot simulation fleet' },
  { label: 'AI classes', value: '5', detail: 'Theft, tamper, reverse, comms' },
  { label: 'Audit proof', value: 'Hash-only', detail: 'Raw telemetry stays off-chain' },
]

const pipeline = [
  { icon: Gauge, title: 'Smart meter', text: 'Voltage, current, power, PF, import and export readings.' },
  { icon: Radio, title: 'Edge gateway', text: 'RS485, DLMS/COSEM or Modbus path through ESP32-class hardware.' },
  { icon: Database, title: 'Node.js API', text: 'Validated telemetry, alerts, history and operational persistence.' },
  { icon: Activity, title: 'FastAPI AI', text: 'RandomForest anomaly classification with risk score and reasons.' },
  { icon: Blocks, title: 'EVM audit chain', text: 'Hash-only evidence, transaction hash and tamper verification.' },
]

export function HomePage() {
  return (
    <div>
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b9d8d1] bg-[#e7f4f1] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#087a70]">
            <span className="size-2 animate-pulse rounded-full bg-[#087a70]" />
            Pilot simulation environment
          </div>
          <h1 className="mt-7 max-w-3xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-[#172525] sm:text-6xl lg:text-7xl">
            Energy intelligence with verifiable audit evidence.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#64736e]">
            VidyutChain connects smart-meter telemetry, AI anomaly detection, and an EVM-compatible private audit chain into one operational platform for utility and government evaluation.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#172525] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#172525]/20 transition hover:-translate-y-0.5 hover:bg-[#243737]">
              Start pilot access
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#architecture" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5e0da] bg-[#f8faf7]/80 px-6 py-3.5 text-sm font-bold text-[#172525] transition hover:-translate-y-0.5 hover:bg-white">
              View architecture
            </a>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-[#d5e0da] bg-[#f8faf7]/75 p-4 backdrop-blur">
                <p className="font-display text-2xl font-bold text-[#172525]">{metric.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#087a70]">{metric.label}</p>
                <p className="mt-1 text-xs text-[#64736e]">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-float">
          <div className="absolute -inset-6 rounded-[2rem] bg-[#087a70]/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-xl border border-[#d5e0da] bg-[#172525] p-5 text-[#eef3f0] shadow-2xl shadow-[#172525]/25">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fa39c]">Live telemetry</p>
                <p className="mt-1 font-display text-xl font-bold">VC-MTR-001</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#087a70]/20 px-3 py-1.5 text-xs font-bold text-[#8fe0d5]">
                <span className="size-2 animate-pulse rounded-full bg-[#8fe0d5]" />
                Simulator feed
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ['Voltage', '231.2 V'],
                ['Current', '4.2 A'],
                ['Power', '0.91 kW'],
                ['Power factor', '0.94'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-[#8fa39c]">{label}</p>
                  <p className="mt-2 font-display text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">AI anomaly risk</p>
                <p className="font-display text-xl font-bold text-[#f0b35c]">0.94</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[94%] rounded-full bg-[#f0b35c]" />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#b8c6c0]">LOAD_THEFT pattern detected by RF-energy-2026.08</p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg border border-[#8fe0d5]/20 bg-[#087a70]/15 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#8fe0d5]" size={22} />
                <div>
                  <p className="text-sm font-bold">Audit verified</p>
                  <p className="text-xs text-[#b8c6c0]">Hash matches on-chain evidence</p>
                </div>
              </div>
              <CheckCircle className="text-[#8fe0d5]" size={20} />
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="border-y border-[#d5e0da] bg-[#f8faf7]/70 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Operational platform</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em]">One control plane for meters, AI and audit.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Live monitoring', 'Track voltage, current, power, power factor, import and export with source-aware freshness states.'],
              ['AI alert inbox', 'Investigate load theft, tampering, reverse energy and communication failures with risk scores and reasons.'],
              ['Blockchain audit', 'Verify hash-only evidence against an EVM-compatible private chain without exposing raw telemetry.'],
            ].map(([title, text], index) => (
              <div key={title} className="group rounded-xl border border-[#d5e0da] bg-[#eef3f0] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-[#172525]/8">
                <span className="font-display text-sm font-bold text-[#087a70]">0{index + 1}</span>
                <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#64736e]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Architecture</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em]">Designed for real IoT, demonstrated with simulation.</h2>
            <p className="mt-5 text-sm leading-7 text-[#64736e]">
              The production path supports smart meters through RS485 and ESP32 edge gateways. Phase 1 uses a clearly labeled simulator feed so the software chain can be evaluated without claiming physical hardware connectivity.
            </p>
          </div>
          <div className="grid gap-3">
            {pipeline.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="group flex items-center gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/80 p-4 transition hover:border-[#087a70]/40 hover:bg-white">
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#e7f4f1] text-[#087a70] transition group-hover:scale-105">
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold">{item.title}</p>
                    <p className="mt-1 text-sm text-[#64736e]">{item.text}</p>
                  </div>
                  <span className="font-display text-sm font-bold text-[#87958f]">{String(index + 1).padStart(2, '0')}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="audit" className="bg-[#172525] py-20 text-[#eef3f0]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8fe0d5]">Tamper evidence</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em]">Blockchain proof without exposing raw telemetry.</h2>
            <p className="mt-5 text-sm leading-7 text-[#b8c6c0]">
              The backend canonicalizes anomaly evidence, stores only hashes on-chain, and verifies the current database record against the immutable digest. Changed evidence returns a failed verification state.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <div className="grid gap-3 font-mono text-xs">
              <div className="rounded-lg bg-black/20 p-4">
                <p className="text-[#8fa39c]">payloadHash</p>
                <p className="mt-2 break-all text-[#8fe0d5]">0x2503e653b0ace3a267c9305af352cb4b0b6efbb0c58e4f8d4ca8e97e83aa7033</p>
              </div>
              <div className="rounded-lg bg-black/20 p-4">
                <p className="text-[#8fa39c]">transactionHash</p>
                <p className="mt-2 break-all text-[#d8e2de]">0x3cc3d212388dc077630a2e46b54dc2f103095f85755369e456c374e6e2616f95</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#8fe0d5]/20 bg-[#087a70]/15 p-4 text-sm font-bold text-[#8fe0d5]">
                <ShieldCheck size={18} />
                Verification: exists on-chain
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/80 p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Pilot access</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em]">Open the operational console.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#64736e]">
                Sign in to inspect meters, telemetry, AI alerts and blockchain audit evidence through the Node.js API boundary.
              </p>
            </div>
            <Link to="/login" className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#087a70] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#087a70]/20 transition hover:-translate-y-0.5 hover:bg-[#08665e]">
              Sign in to console
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

