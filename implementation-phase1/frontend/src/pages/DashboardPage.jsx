import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, Blocks, Gauge, RefreshCw, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function formatNumber(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

export function DashboardPage() {
  const { accessToken } = useAuth()
  const [meters, setMeters] = useState([])
  const [latestByMeter, setLatestByMeter] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const meterResult = await api.meters(accessToken)
      const meterList = meterResult.meters ?? []
      setMeters(meterList)

      const latestResults = await Promise.allSettled(
        meterList.map((meter) => api.latestTelemetry(accessToken, meter.meterId)),
      )
      const nextLatest = {}
      latestResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          nextLatest[meterList[index].meterId] = result.value.telemetry
        }
      })
      setLatestByMeter(nextLatest)
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

  const summary = useMemo(() => {
    const telemetry = Object.values(latestByMeter).filter(Boolean)
    const anomalies = telemetry.filter((item) => item.status === 'anomaly' || item.aiAnomalyType && item.aiAnomalyType !== 'NORMAL')
    const verified = telemetry.filter((item) => item.blockchainAuditStatus === 'confirmed')
    return {
      total: meters.length,
      online: meters.filter((meter) => meter.status === 'online').length,
      demand: telemetry.reduce((sum, item) => sum + (item.powerKw ?? 0), 0),
      anomalies: anomalies.length,
      verified: telemetry.length ? Math.round((verified.length / telemetry.length) * 100) : 0,
    }
  }, [meters, latestByMeter])

  if (isLoading) {
    return <LoadingState label="Loading command center…" />
  }

  if (error) {
    return <ErrorState message={error} action={<button type="button" onClick={load} className="mt-5 rounded-lg bg-[#172525] px-4 py-2 text-sm font-bold text-white">Retry</button>} />
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Command Center</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Pilot grid overview</h2>
          <p className="mt-2 text-sm text-[#64736e]">Real backend data from meters, telemetry, AI metadata and audit status.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-[#eef3f0]">
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total meters', value: summary.total, icon: Gauge },
          { label: 'Online meters', value: summary.online, icon: Activity },
          { label: 'Current demand', value: `${formatNumber(summary.demand)} kW`, icon: Zap },
          { label: 'Anomalous latest', value: summary.anomalies, icon: AlertTriangle },
          { label: 'Audit verified', value: `${summary.verified}%`, icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64736e]">{item.label}</p>
                <Icon size={18} className="text-[#087a70]" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold">{item.value}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">Meter health</h3>
              <p className="mt-1 text-sm text-[#64736e]">Latest reading and audit state per registered meter.</p>
            </div>
            <Link to="/app/meters" className="inline-flex items-center gap-1 text-sm font-bold text-[#087a70]">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {meters.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No meters registered" message="Register a meter to begin telemetry ingestion and blockchain audit tracking." />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d5e0da] text-xs uppercase tracking-[0.14em] text-[#64736e]">
                    <th className="py-3 pr-4">Meter</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Power</th>
                    <th className="py-3 pr-4">AI</th>
                    <th className="py-3 pr-4">Audit</th>
                    <th className="py-3">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((meter) => {
                    const latest = latestByMeter[meter.meterId]
                    return (
                      <tr key={meter.id} className="border-b border-[#d5e0da]/70 last:border-0">
                        <td className="py-4 pr-4">
                          <Link to={`/app/meters/${meter.meterId}`} className="font-bold text-[#172525] hover:text-[#087a70]">{meter.meterId}</Link>
                          <p className="text-xs text-[#64736e]">{meter.displayName}</p>
                        </td>
                        <td className="py-4 pr-4"><StatusBadge value={meter.status} /></td>
                        <td className="py-4 pr-4 font-semibold">{latest ? `${formatNumber(latest.powerKw)} kW` : '—'}</td>
                        <td className="py-4 pr-4"><StatusBadge value={latest?.aiAnomalyType === 'NORMAL' ? 'normal' : latest?.status ?? 'disabled'} /></td>
                        <td className="py-4 pr-4"><StatusBadge value={latest?.blockchainAuditStatus ?? meter.blockchainRegistrationStatus ?? 'disabled'} /></td>
                        <td className="py-4 text-[#64736e]">{meter.lastSeenAt ? new Date(meter.lastSeenAt).toLocaleString() : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <div className="rounded-xl border border-[#d5e0da] bg-[#172525] p-6 text-[#eef3f0]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-[#087a70]/25 text-[#8fe0d5]">
                <Blocks size={21} />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold">Audit boundary</h3>
                <p className="text-sm text-[#b8c6c0]">Hash-only evidence on EVM private chain</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              <p className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-3"><span>Raw telemetry</span><strong>Off-chain</strong></p>
              <p className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-3"><span>Payload digest</span><strong>On-chain</strong></p>
              <p className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-3"><span>Tamper check</span><strong>Enabled</strong></p>
            </div>
            <Link to="/app/audit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#eef3f0] px-4 py-3 text-sm font-bold text-[#172525]">
              Open audit trail <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
            <h3 className="font-display text-xl font-bold">Service path</h3>
            <div className="mt-5 grid gap-3 text-sm text-[#64736e]">
              {['Frontend', 'Node.js API', 'FastAPI AI', 'MongoDB', 'EVM audit chain'].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-[#e7f4f1] text-xs font-bold text-[#087a70]">{index + 1}</span>
                  <span className="font-semibold text-[#172525]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

