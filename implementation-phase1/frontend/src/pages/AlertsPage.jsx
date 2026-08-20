import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function severity(score) {
  if (score >= 0.9) return 'critical'
  if (score >= 0.75) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

export function AlertsPage() {
  const { accessToken } = useAuth()
  const [meters, setMeters] = useState([])
  const [telemetry, setTelemetry] = useState([])
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
      const records = historyResults.flatMap((result) => result.status === 'fulfilled' ? result.value.telemetry ?? [] : [])
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

  const anomalies = useMemo(() => telemetry
    .filter((item) => item.aiAnomalyType && item.aiAnomalyType !== 'NORMAL')
    .sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp)), [telemetry])

  if (isLoading) {
    return <LoadingState label="Loading AI alerts…" />
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">AI alert inbox</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Anomaly intelligence</h2>
          <p className="mt-2 text-sm text-[#64736e]">AI-classified telemetry records with risk score, confidence and audit state.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold">
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {!error && meters.length === 0 ? <EmptyState title="No meters registered" message="AI alerts appear after telemetry is ingested for registered meters." /> : null}
      {!error && meters.length > 0 && anomalies.length === 0 ? <EmptyState title="No AI anomalies" message="The current telemetry history does not contain non-normal AI classifications." /> : null}

      {!error && anomalies.length > 0 ? (
        <section className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#fff7e8] text-[#9a6118]"><AlertTriangle size={21} /></span>
            <div>
              <h3 className="font-display text-xl font-bold">{anomalies.length} anomalous records</h3>
              <p className="text-sm text-[#64736e]">Sorted by latest telemetry timestamp.</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d5e0da] text-xs uppercase tracking-[0.14em] text-[#64736e]">
                  <th className="py-3 pr-4">Meter</th>
                  <th className="py-3 pr-4">Anomaly</th>
                  <th className="py-3 pr-4">Risk</th>
                  <th className="py-3 pr-4">Severity</th>
                  <th className="py-3 pr-4">Audit</th>
                  <th className="py-3 pr-4">Timestamp</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((item) => (
                  <tr key={item.id} className="border-b border-[#d5e0da]/70 last:border-0">
                    <td className="py-4 pr-4 font-bold">{item.meterId}</td>
                    <td className="py-4 pr-4">{item.aiAnomalyType.replaceAll('_', ' ')}</td>
                    <td className="py-4 pr-4 font-display font-bold">{item.aiRiskScore?.toFixed(2) ?? '—'}</td>
                    <td className="py-4 pr-4"><StatusBadge value={severity(item.aiRiskScore ?? 0) === 'critical' ? 'error' : 'anomaly'} /></td>
                    <td className="py-4 pr-4"><StatusBadge value={item.blockchainAuditStatus} /></td>
                    <td className="py-4 pr-4 text-[#64736e]">{new Date(item.timestamp).toLocaleString()}</td>
                    <td className="py-4">
                      <Link to={`/app/audit/${item.id}`} className="inline-flex items-center gap-1 font-bold text-[#087a70]">
                        Verify <ArrowRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}

