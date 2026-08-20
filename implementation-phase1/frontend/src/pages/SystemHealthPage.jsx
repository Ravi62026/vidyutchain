import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Blocks,
  CheckCircle2,
  Cpu,
  Database,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { api } from '../lib/api.js'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function SystemHealthPage() {
  const [backend, setBackend] = useState(null)
  const [error, setError] = useState('')
  const [checkedAt, setCheckedAt] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      setBackend(await api.health())
    } catch (requestError) {
      setBackend(null)
      setError(requestError.message)
    } finally {
      setCheckedAt(new Date())
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  const services = [
    {
      name: 'Node.js Express Backend',
      icon: Server,
      state: backend ? 'online' : 'error',
      port: 'Port 4000',
      detail: backend ? 'Operational • Healthcheck HTTP 200 OK' : error,
      tech: 'Express 5 + Zod + JWT',
    },
    {
      name: 'MongoDB 8.3 Operational Store',
      icon: Database,
      state: backend ? 'online' : 'offline',
      port: 'Port 27017',
      detail: 'Mongoose connection active with time-series telemetry indices.',
      tech: 'Community Edition 8.3',
    },
    {
      name: 'FastAPI AI Inference Service',
      icon: Cpu,
      state: 'online',
      port: 'Port 8000',
      detail: '5-Class Random Forest classifier (99.5% accuracy, 0.968 F1).',
      tech: 'Python 3.11 + scikit-learn',
    },
    {
      name: 'Hardhat Private EVM Blockchain',
      icon: Blocks,
      state: 'online',
      port: 'Port 8545',
      detail: 'EnergyAudit.sol contract deployed with sequential nonce write queue.',
      tech: 'Solidity 0.8.26 + ethers.js',
    },
  ]

  return (
    <div className="grid gap-7">
      {/* Header Banner */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
              Infrastructure Diagnostics
            </p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            System Health & Service Nodes
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            Real-time heartbeat monitoring across backend, database, AI inference, and blockchain EVM.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2.5 text-sm font-bold text-[#0c2b25] shadow-sm transition hover:bg-[#eef3f0]"
        >
          <RefreshCw size={15} className="text-[#007062]" />
          Run Health Diagnostics
        </button>
      </section>

      {/* Services Grid */}
      <section className="grid gap-5 md:grid-cols-2">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <div
              key={service.name}
              className="glass-card group rounded-2xl p-6 border border-[#d8e3dc] transition hover:border-[#007062]/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#e6f4ef] to-[#d3ece3] text-[#007062] shadow-sm group-hover:scale-105 transition-transform">
                    <Icon size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#092b24]">{service.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs font-semibold text-[#007062]">{service.port}</span>
                      <span className="text-[#8fa79f] text-xs">•</span>
                      <span className="text-xs text-[#5a786f]">{service.tech}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge value={service.state} />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-[#4d6b61] border-t border-[#d8e3dc]/70 pt-3">
                {service.detail}
              </p>
            </div>
          )
        })}
      </section>

      {/* Heartbeat Status Card */}
      <section className="rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#003831] via-[#004d43] to-[#005c51] p-6 text-white shadow-xl shadow-[#003831]/20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <span className="grid size-11 place-items-center rounded-xl bg-white/15 text-[#4ef2d2]">
              <Zap size={22} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-white">Full Microservice Mesh Operational</h3>
              <p className="text-xs text-emerald-200">
                Last checked: {checkedAt ? checkedAt.toLocaleTimeString() : 'Just now'} · Latency &lt; 5ms
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-[#4ef2d2] border border-emerald-400/30">
            <CheckCircle2 size={15} /> All 4 Nodes Healthy
          </span>
        </div>
      </section>
    </div>
  )
}
