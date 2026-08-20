import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function severity(score) {
  if (score >= 0.85) return { label: 'Critical', color: 'bg-rose-100 text-rose-800 border-rose-200' }
  if (score >= 0.7) return { label: 'High', color: 'bg-amber-100 text-amber-900 border-amber-200' }
  if (score >= 0.5) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  return { label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' }
}

export function AlertsPage() {
  const { accessToken } = useAuth()
  const [meters, setMeters] = useState([])
  const [telemetry, setTelemetry] = useState([])
  const [filterType, setFilterType] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const meterResult = await api.meters(accessToken)
      const meterList = meterResult.meters ?? []
      setMeters(meterList)
      const historyResults = await Promise.allSettled(
        meterList.map((meter) => api.telemetryHistory(accessToken, meter.meterId, { limit: 50 })),
      )
      const records = historyResults.flatMap((result) =>
        result.status === 'fulfilled' ? result.value.telemetry ?? [] : [],
      )
      setTelemetry(records)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  const anomalies = useMemo(
    () =>
      telemetry
        .filter((item) => item.aiAnomalyType && item.aiAnomalyType !== 'NORMAL')
        .sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp)),
    [telemetry],
  )

  const filteredAnomalies = useMemo(() => {
    if (filterType === 'ALL') return anomalies
    return anomalies.filter((item) => item.aiAnomalyType === filterType)
  }, [anomalies, filterType])

  if (isLoading) {
    return <LoadingState label="Running AI theft inference pipeline across fleet…" />
  }

  return (
    <div className="grid gap-7">
      {/* Header Banner */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-amber-800">
              AI Intelligence Inbox
            </p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            Anomaly & Electricity Theft Radar
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            FastAPI machine-learning model (rf-stpi-v1) flagging deviations and logging hash proof to EVM.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2.5 text-sm font-bold text-[#0c2b25] shadow-sm transition hover:bg-[#eef3f0]"
        >
          <RefreshCw size={15} className="text-[#007062]" />
          Re-evaluate Radar
        </button>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {!error && meters.length === 0 ? (
        <EmptyState
          title="No meters registered"
          message="AI alerts appear after smart meter telemetry is ingested into the system."
        />
      ) : null}

      {!error && meters.length > 0 && anomalies.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-[#092b24]">Grid State 100% Nominal</h3>
          <p className="mt-1.5 text-sm text-[#5a786f] max-w-md mx-auto">
            All active meters are operating within normal electrical parameters. No theft, tampering, or outages detected.
          </p>
        </div>
      ) : null}

      {!error && anomalies.length > 0 ? (
        <section className="glass-panel rounded-2xl p-6 sm:p-7">
          {/* Filter Chips Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-[#d8e3dc] pb-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-800 shadow-sm">
                <ShieldAlert size={22} />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-[#092b24]">
                  {anomalies.length} Flagged Events
                </h3>
                <p className="text-xs text-[#5a786f]">Continuous risk scoring ranked by timestamp.</p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-bold text-[#5a786f]">
              {['ALL', 'LOAD_THEFT', 'METER_TAMPERING', 'REVERSE_ENERGY'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    filterType === type ? 'bg-white text-[#007062] shadow-sm' : 'hover:text-[#092b24]'
                  }`}
                >
                  {type.replaceAll('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d8e3dc] text-[11px] font-extrabold uppercase tracking-wider text-[#6a877e]">
                  <th className="py-3 pr-4">Device</th>
                  <th className="py-3 pr-4">Anomaly Diagnosis</th>
                  <th className="py-3 pr-4">AI Risk Score</th>
                  <th className="py-3 pr-4">Severity Tier</th>
                  <th className="py-3 pr-4">Blockchain State</th>
                  <th className="py-3 pr-4">Detected At</th>
                  <th className="py-3 text-right">Audit Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8e3dc]/70">
                {filteredAnomalies.map((item) => {
                  const sev = severity(item.aiRiskScore ?? 0)
                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-white/90">
                      <td className="py-4 pr-4">
                        <Link
                          to={`/app/meters/${item.meterId}`}
                          className="font-mono text-sm font-bold text-[#092b24] group-hover:text-[#007062] transition"
                        >
                          {item.meterId}
                        </Link>
                      </td>

                      <td className="py-4 pr-4">
                        <StatusBadge value={item.aiAnomalyType} />
                      </td>

                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#092b24]">
                            {item.aiRiskScore ? (item.aiRiskScore * 100).toFixed(1) + '%' : '—'}
                          </span>
                          <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (item.aiRiskScore ?? 0) > 0.7 ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, (item.aiRiskScore ?? 0) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${sev.color}`}
                        >
                          {sev.label}
                        </span>
                      </td>

                      <td className="py-4 pr-4">
                        <StatusBadge value={item.blockchainAuditStatus ?? 'confirmed'} />
                      </td>

                      <td className="py-4 pr-4 font-mono text-xs text-[#5a786f]">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>

                      <td className="py-4 text-right">
                        <Link
                          to={`/app/audit/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8e3dc] bg-white px-3 py-1.5 text-xs font-bold text-[#007062] shadow-sm transition hover:bg-[#eaf4ef] hover:border-[#007062]"
                        >
                          <Blocks size={13} />
                          Verify Tx
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
