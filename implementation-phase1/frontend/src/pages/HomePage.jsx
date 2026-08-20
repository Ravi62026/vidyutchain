import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  Flame,
  Gauge,
  KeyRound,
  Layers,
  Lock,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'

const metrics = [
  { label: 'Virtual Fleet', value: '20+ Meters', detail: 'Real STPI / UCI household data profile' },
  { label: 'AI Accuracy', value: '99.5%', detail: '5-Class Random Forest Model (rf-stpi-v1)' },
  { label: 'Audit Security', value: '100% On-Chain', detail: 'Keccak-256 hash verified without raw data leak' },
  { label: 'Live Ingestion', value: '<50ms', detail: 'High-throughput Node.js & Mongo Pipeline' },
]

const pipeline = [
  {
    icon: Gauge,
    title: 'Smart Meter / Edge Hardware',
    desc: 'Bidirectional energy metering with Voltage, Current, Power kW, PF, and Net-Metering Import/Export support.',
    tag: 'Hardware Interface',
    link: '/architecture',
  },
  {
    icon: Radio,
    title: 'ESP32 IoT Edge Gateway',
    desc: 'RS485/Modbus bridge transmitting encrypted telemetry packets to cloud ingestion endpoints.',
    tag: 'Edge Bridge',
    link: '/architecture',
  },
  {
    icon: Database,
    title: 'Node.js & MongoDB Core',
    desc: 'Time-series telemetry collections, robust JWT authentication, role guards, and instant data aggregations.',
    tag: 'Cloud Backend',
    link: '/platform',
  },
  {
    icon: Cpu,
    title: 'FastAPI AI Intelligence Engine',
    desc: 'RandomForest & Isolation Forest classification of load theft, hardware tampering, reverse energy, and outages.',
    tag: 'Machine Learning',
    link: '/ai-intelligence',
  },
  {
    icon: Blocks,
    title: 'Immutable Ethereum EVM Audit',
    desc: 'Zero-knowledge-style hash recording on smart contracts ensuring 100% dispute-free billing integrity.',
    tag: 'Blockchain Layer',
    link: '/blockchain-audit',
  },
]

export function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pt-12 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16 lg:pb-28">
        <div className="animate-rise">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007062] shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <span>VidyutChain Smart Grid Platform • Phase 1 MVP</span>
          </div>

          {/* Main Hero Heading */}
          <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight text-[#082822] sm:text-6xl lg:text-7xl leading-[1.05]">
            AI-Powered Smart Energy & <span className="gradient-text-emerald">Blockchain Audit</span>.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-[#456157] max-w-2xl">
            VidyutChain bridges smart electricity meters with real-time AI theft detection and an immutable Ethereum-backed audit trail — creating a verifiable, transparent foundation for utilities, DISCOMs, and rooftop solar prosumers.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#007062]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#007062]/35"
            >
              <Sparkles size={17} className="text-[#64ffda]" />
              Launch Command Center
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/architecture"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d2dfd8] bg-white/90 px-6 py-4 text-sm font-bold text-[#0c2b25] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#007062]/40 hover:bg-white hover:shadow-md"
            >
              Explore Architecture
            </Link>
          </div>

          {/* Pre-seeded demo credentials quick-card */}
          <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-4 backdrop-blur-sm sm:max-w-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#007062]">
                <KeyRound size={15} />
                <span>One-Click Demo Credentials:</span>
              </div>
              <span className="rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                Pre-Loaded
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-[#204037]">
              <div className="rounded-lg bg-white/80 px-3 py-1.5 border border-emerald-100">
                <span className="text-[#6a877e]">Email: </span>
                <span className="font-bold text-[#005c51]">admin@vidyutchain.io</span>
              </div>
              <div className="rounded-lg bg-white/80 px-3 py-1.5 border border-emerald-100">
                <span className="text-[#6a877e]">Pass: </span>
                <span className="font-bold text-[#005c51]">AdminDemoPassword123!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Visual Widget */}
        <div className="relative animate-float">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-sky-500/15 blur-2xl pointer-events-none" />

          <div className="glass-panel relative rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/10">
            {/* Header of widget */}
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-[#005c51] text-white shadow-md shadow-[#005c51]/30">
                  <Activity size={22} className="text-[#4ef2d2]" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">Real-Time Feed</p>
                  <p className="font-display text-lg font-bold text-[#0c2b25]">Smart Meter M001</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            </div>

            {/* Metric Tiles */}
            <div className="mt-6 grid grid-cols-2 gap-3.5">
              <div className="rounded-2xl border border-[#d8e3dc] bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-[#5a786f]">Grid Voltage</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#092b24]">243.2 <span className="text-xs font-normal text-[#5a786f]">V</span></p>
                <span className="mt-1 inline-block text-[11px] font-bold text-emerald-700">Nominal 230V</span>
              </div>
              <div className="rounded-2xl border border-[#d8e3dc] bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-[#5a786f]">Active Load</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#092b24]">1.69 <span className="text-xs font-normal text-[#5a786f]">kW</span></p>
                <span className="mt-1 inline-block text-[11px] font-bold text-teal-700">PF 0.94 Leading</span>
              </div>
            </div>

            {/* AI Risk Score Bar */}
            <div className="mt-4 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-700" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">AI Theft Radar (rf-stpi-v1)</span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-900">Risk: 0.807</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-amber-200/70">
                <div className="h-full w-[81%] rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000" />
              </div>
              <p className="mt-2 text-xs font-medium text-amber-950/80">
                Alert: Deviation pattern matching night unmetered bypass load.
              </p>
            </div>

            {/* Blockchain Proof Badge */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/70 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Blocks size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">EVM Smart Contract Verified</p>
                  <p className="font-mono text-[11px] text-emerald-800/80 truncate max-w-[200px]">
                    0xef9c346b48dc729...
                  </p>
                </div>
              </div>
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-[#d8e3dc] bg-white/75 py-12 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
                <p className="font-display text-3xl font-extrabold text-[#005c51]">{metric.value}</p>
                <p className="mt-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">{metric.label}</p>
                <p className="mt-1 text-xs text-[#5a786f]">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complete Pipeline Architecture */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#007062]">
            End-to-End Technology Stack
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#082822] sm:text-4xl">
            From Meter Edge to Immutable Ledger
          </h2>
          <p className="mt-3 text-base text-[#4d6b61]">
            VidyutChain integrates every tier of modern power infrastructure into a unified observable control plane.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pipeline.map((item, idx) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                to={item.link}
                className="glass-card group relative flex flex-col justify-between rounded-2xl p-6 border border-[#d8e3dc] transition-all hover:border-[#007062]/50 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#e6f4ef] to-[#d3ece3] text-[#007062] shadow-sm transition group-hover:scale-105">
                      <Icon size={24} />
                    </span>
                    <span className="font-mono text-xs font-bold text-[#8fa79f]">0{idx + 1}</span>
                  </div>
                  <span className="mt-5 inline-block text-[11px] font-bold uppercase tracking-widest text-[#007062]">
                    {item.tag}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#092b24] group-hover:text-[#007062] transition flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowRight size={15} className="text-[#8fa79f] transition-transform group-hover:translate-x-1 group-hover:text-[#007062]" />
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#4d6b61]">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-[#005c51] via-[#007062] to-[#004d43] p-8 sm:p-12 text-white shadow-2xl shadow-[#005c51]/20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                Phase 1 Evaluation Active
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Experience the VidyutChain Operational Console.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-100">
                Log in to the dashboard to monitor live telemetry dials, review AI theft classifications, and verify cryptographic hashes against the private EVM chain.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-extrabold text-[#005c51] shadow-xl transition-all duration-200 hover:bg-emerald-50 hover:scale-105"
            >
              Sign In to Command Center
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
