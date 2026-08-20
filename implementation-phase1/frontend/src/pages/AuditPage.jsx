import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Blocks, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function AuditPage() {
  const { accessToken } = useAuth()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const meterResult = await api.meters(accessToken)
      const historyResults = await Promise.allSettled(
        (meterResult.meters ?? []).map((meter) => api.telemetryHistory(accessToken, meter.meterId, { limit: 100 })),
      )
      const telemetry = historyResults.flatMap((result) => result.status === 'fulfilled' ? result.value.telemetry ?? [] : [])
      setRecords(telemetry.filter((item) => item.blockchainAuditStatus && item.blockchainAuditStatus !== 'disabled'))
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

  const summary = useMemo(() => ({
    total: records.length,
    confirmed: records.filter((item) => item.blockchainAuditStatus === 'confirmed').length,
    failed: records.filter((item) => item.blockchainAuditStatus === 'failed').length,
  }), [records])

  if (isLoading) {
    return <LoadingState label="Loading blockchain audit trail…" />
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Blockchain audit</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Hash-only evidence trail</h2>
          <p className="mt-2 text-sm text-[#64736e]">Raw telemetry remains off-chain. Only canonical evidence hashes and transaction proof are audited.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold">
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Audit records', summary.total, Blocks],
          ['Confirmed', summary.confirmed, ShieldCheck],
          ['Failed writes', summary.failed, ShieldAlert],
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64736e]">{label}</p>
              <Icon size={18} className="text-[#087a70]" />
            </div>
            <p className="mt-4 font-display text-3xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      {error ? <ErrorState message={error} /> : null}
      {!error && records.length === 0 ? <EmptyState title="No audit records" message="AI anomaly events will appear here after blockchain audit logging is attempted." /> : null}

      {!error && records.length > 0 ? (
        <section className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d5e0da] text-xs uppercase tracking-[0.14em] text-[#64736e]">
                  <th className="py-3 pr-4">Telemetry</th>
                  <th className="py-3 pr-4">Meter</th>
                  <th className="py-3 pr-4">Event</th>
                  <th className="py-3 pr-4">Payload hash</th>
                  <th className="py-3 pr-4">Transaction</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((item) => (
                  <tr key={item.id} className="border-b border-[#d5e0da]/70 last:border-0">
                    <td className="py-4 pr-4 font-mono text-xs">{item.id}</td>
                    <td className="py-4 pr-4 font-bold">{item.meterId}</td>
                    <td className="py-4 pr-4">{item.aiAnomalyType ?? 'ANOMALY_EVENT'}</td>
                    <td className="max-w-52 truncate py-4 pr-4 font-mono text-xs">{item.blockchainPayloadHash ?? '—'}</td>
                    <td className="max-w-52 truncate py-4 pr-4 font-mono text-xs">{item.blockchainTransactionHash ?? '—'}</td>
                    <td className="py-4 pr-4"><StatusBadge value={item.blockchainAuditStatus} /></td>
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

