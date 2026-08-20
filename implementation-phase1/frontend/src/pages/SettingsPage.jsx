import {
  Blocks,
  CheckCircle2,
  Cpu,
  Database,
  KeyRound,
  Lock,
  Radio,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

const sections = [
  {
    title: 'Platform Backend API',
    icon: Server,
    rows: [
      ['API Base Endpoint', import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'],
      ['Authentication Standard', 'HMAC-SHA256 JWT Bearer Token'],
      ['High-Throughput Window', '600 requests per minute with rate guard'],
      ['Security Framework', 'Helmet 8 + Strict CORS + Zod Schema Validation'],
    ],
  },
  {
    title: 'FastAPI AI Machine Learning Node',
    icon: Cpu,
    rows: [
      ['Inference Microservice', 'FastAPI 0.115 / Uvicorn (Port 8000)'],
      ['Classification Model', 'RandomForest (rf-stpi-v1) + Isolation Forest'],
      ['Evaluated Benchmark', '99.5% Overall Accuracy · 0.968 Macro F1'],
      ['Failure Tolerance', 'Non-blocking pipeline (telemetry preserved if offline)'],
    ],
  },
  {
    title: 'EVM Private Blockchain Layer',
    icon: Blocks,
    rows: [
      ['Consortium Chain', 'Hardhat Local EVM Node (Port 8545)'],
      ['Smart Contract Address', '0x5FbDB2315678afecb367f032d93F642f64180aa3'],
      ['Storage Philosophy', 'Zero-knowledge-style canonical Keccak-256 hash only'],
      ['Concurrency Queue', 'Serialized nonce-safe relayer writer'],
    ],
  },
  {
    title: 'MongoDB Enterprise Database',
    icon: Database,
    rows: [
      ['Engine Version', 'MongoDB Community Edition 8.3'],
      ['Connection String', 'mongodb://127.0.0.1:27017/vidyutchain'],
      ['Index Strategy', 'Compound indices on (meterId, timestamp desc)'],
      ['Data Isolation', 'Multi-tenant owner-scoped query guards'],
    ],
  },
]

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="grid gap-7">
      {/* Top Banner */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
              Security & Environment
            </p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            System Architecture & Configuration
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            Observable tier configuration parameters and cryptographic zero-trust boundaries.
          </p>
        </div>
      </section>

      {/* User Session Pill */}
      <section className="glass-panel flex items-center justify-between rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-lg shadow-[#007062]/20">
            <KeyRound size={26} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                {user?.role} Access
              </span>
              <span className="text-xs text-[#8fa79f]">• Authenticated Session</span>
            </div>
            <h3 className="mt-1 font-display text-xl font-bold text-[#092b24]">{user?.email}</h3>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} />
          JWT Bearer Session Active
        </div>
      </section>

      {/* Architecture Tiers Grid */}
      <section className="grid gap-5 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div
              key={section.title}
              className="glass-card rounded-2xl p-6 border border-[#d8e3dc] transition hover:border-[#007062]/40"
            >
              <div className="flex items-center gap-3.5 border-b border-[#d8e3dc]/70 pb-4">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#e6f4ef] to-[#d3ece3] text-[#007062] shadow-sm">
                  <Icon size={22} />
                </span>
                <h3 className="font-display text-lg font-bold text-[#092b24]">{section.title}</h3>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                {section.rows.map(([label, value]) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-sans text-xs font-medium text-[#5a786f]">{label}</span>
                    <strong className="text-left sm:text-right text-[#092b24] break-all font-semibold">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* Zero Trust Security Callout */}
      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-md">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-[#092b24]">Zero-Trust Security & Privacy Boundary</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#456157]">
              The browser frontend communicates strictly through the Node.js API boundary via JWT. Sensitive blockchain private keys, internal AI RPC endpoints, and raw database credentials are kept isolated on the server tier.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
