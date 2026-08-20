import { useCallback, useEffect, useState } from 'react'
import { Activity, Blocks, Database, RefreshCw, Server, Zap } from 'lucide-react'
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
      name: 'Node.js backend API',
      icon: Server,
      state: backend ? 'online' : 'error',
      detail: backend ? `${backend.service} · ${backend.status}` : error,
    },
    {
      name: 'MongoDB operational store',
      icon: Database,
      state: backend ? 'registered' : 'offline',
      detail: 'Database health is validated by backend startup and authenticated API behavior.',
    },
    {
      name: 'Python FastAPI AI service',
      icon: Activity,
      state: 'registered',
      detail: 'Called only through the Node.js backend after telemetry validation.',
    },
    {
      name: 'EVM audit chain',
      icon: Blocks,
      state: 'registered',
      detail: 'Configured through backend blockchain environment variables.',
    },
  ]

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">System health</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Service status</h2>
          <p className="mt-2 text-sm text-[#64736e]">Operational view of the API boundary and dependent services.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold">
          <RefreshCw size={16} /> Check now
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <div key={service.name} className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-lg bg-[#e7f4f1] text-[#087a70]">
                    <Icon size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold">{service.name}</h3>
                    <p className="mt-1 text-sm text-[#64736e]">{service.detail}</p>
                  </div>
                </div>
                <StatusBadge value={service.state} />
              </div>
            </div>
          )
        })}
      </section>

      <section className="rounded-xl border border-[#d5e0da] bg-[#172525] p-6 text-[#eef3f0]">
        <div className="flex items-center gap-3">
          <Zap className="text-[#8fe0d5]" size={22} />
          <div>
            <h3 className="font-display text-xl font-bold">Last health check</h3>
            <p className="text-sm text-[#b8c6c0]">{checkedAt ? checkedAt.toLocaleString() : 'Not checked'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

