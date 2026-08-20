import { Blocks, Database, KeyRound, Radio, Server, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

const sections = [
  {
    title: 'API boundary',
    icon: Server,
    rows: [
      ['Base URL', import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'],
      ['Authentication', 'JWT bearer token'],
      ['Rate limit', '120 requests per minute'],
    ],
  },
  {
    title: 'AI service',
    icon: Radio,
    rows: [
      ['Access pattern', 'Node.js backend only'],
      ['Model', 'RandomForest energy anomaly classifier'],
      ['Failure behavior', 'Telemetry accepted; AI metadata omitted'],
    ],
  },
  {
    title: 'Blockchain audit',
    icon: Blocks,
    rows: [
      ['Network', 'EVM-compatible private chain'],
      ['Contract', 'EnergyAudit'],
      ['Evidence', 'Hash-only payload digest'],
    ],
  },
  {
    title: 'Operational store',
    icon: Database,
    rows: [
      ['Database', 'MongoDB'],
      ['Telemetry', 'Raw readings and AI metadata'],
      ['Audit metadata', 'Transaction hash, event ID, payload hash'],
    ],
  },
]

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Settings</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Pilot configuration</h2>
        <p className="mt-2 text-sm text-[#64736e]">Read-only configuration summary. Secrets and private keys are never displayed.</p>
      </section>

      <section className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-lg bg-[#172525] text-[#eef3f0]">
            <KeyRound size={24} />
          </span>
          <div>
            <h3 className="font-display text-2xl font-bold">{user?.email}</h3>
            <p className="mt-1 text-sm capitalize text-[#64736e]">{user?.role} access · authenticated session</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-lg bg-[#e7f4f1] text-[#087a70]">
                  <Icon size={21} />
                </span>
                <h3 className="font-display text-xl font-bold">{section.title}</h3>
              </div>
              <div className="mt-5 grid gap-3">
                {section.rows.map(([label, value]) => (
                  <p key={label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-[#64736e]">{label}</span>
                    <strong className="text-right">{value}</strong>
                  </p>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <section className="rounded-xl border border-[#b9d8d1] bg-[#e7f4f1] p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 text-[#087a70]" size={22} />
          <div>
            <h3 className="font-display text-xl font-bold">Security boundary</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64736e]">
              The frontend stores only the backend-issued access token. It never calls FastAPI directly, never receives blockchain private keys, and never writes raw telemetry to the audit chain.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

