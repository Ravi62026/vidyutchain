import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Blocks, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function Metric({ label, value, unit }) {
  return (
    <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64736e]">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold">{value ?? '—'} <span className="text-sm text-[#64736e]">{unit}</span></p>
    </div>
  )
}

export function MeterDetailPage() {
  const { meterId } = useParams()
  const { accessToken } = useAuth()
  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [latestResult, historyResult] = await Promise.all([
        api.latestTelemetry(accessToken, meterId),
        api.telemetryHistory(accessToken, meterId, { limit: 20 }),
      ])
      setLatest(latestResult.telemetry)
      setHistory(historyResult.telemetry ?? [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, meterId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  if (isLoading) {
    return <LoadingState label={`Loading ${meterId}…`} />
  }

  if (error) {
    return <ErrorState message={error} action={<button type="button" onClick={load} className="mt-5 rounded-lg bg-[#172525] px-4 py-2 text-sm font-bold text-white">Retry</button>} />
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
        <Link to="/app/meters" className="inline-flex items-center gap-2 text-sm font-bold text-[#64736e] hover:text-[#087a70]">
          <ArrowLeft size={16} /> Back to meters
        </Link>
        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Meter detail</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em]">{meterId}</h2>
            <p className="mt-2 text-sm text-[#64736e]">Latest telemetry, AI classification and blockchain audit state.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={latest?.status ?? 'offline'} />
            <StatusBadge value={latest?.blockchainAuditStatus ?? 'disabled'} />
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {!latest ? (
        <EmptyState title="No telemetry received" message="This meter is registered, but no telemetry packet has been accepted yet." />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Voltage" value={latest.voltage?.toFixed(1)} unit="V" />
            <Metric label="Current" value={latest.current?.toFixed(2)} unit="A" />
            <Metric label="Power" value={latest.powerKw?.toFixed(2)} unit="kW" />
            <Metric label="Power factor" value={latest.powerFactor?.toFixed(2)} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
              <h3 className="font-display text-xl font-bold">Recent telemetry</h3>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d5e0da] text-xs uppercase tracking-[0.14em] text-[#64736e]">
                      <th className="py-3 pr-4">Timestamp</th>
                      <th className="py-3 pr-4">Power</th>
                      <th className="py-3 pr-4">Import</th>
                      <th className="py-3 pr-4">Export</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-[#d5e0da]/70 last:border-0">
                        <td className="py-3 pr-4">{new Date(item.timestamp).toLocaleString()}</td>
                        <td className="py-3 pr-4 font-semibold">{item.powerKw.toFixed(2)} kW</td>
                        <td className="py-3 pr-4">{item.importKwh.toFixed(2)} kWh</td>
                        <td className="py-3 pr-4">{item.exportKwh.toFixed(2)} kWh</td>
                        <td className="py-3"><StatusBadge value={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
                <h3 className="font-display text-xl font-bold">AI classification</h3>
                <div className="mt-5 grid gap-3 text-sm">
                  <p className="flex justify-between"><span className="text-[#64736e]">Anomaly type</span><strong>{latest.aiAnomalyType ?? 'Unavailable'}</strong></p>
                  <p className="flex justify-between"><span className="text-[#64736e]">Risk score</span><strong>{latest.aiRiskScore?.toFixed(2) ?? '—'}</strong></p>
                  <p className="flex justify-between"><span className="text-[#64736e]">Confidence</span><strong>{latest.aiConfidence?.toFixed(2) ?? '—'}</strong></p>
                  <p className="flex justify-between"><span className="text-[#64736e]">Model</span><strong>{latest.aiModelVersion ?? '—'}</strong></p>
                </div>
                {latest.aiReasons?.length ? (
                  <div className="mt-5 rounded-lg bg-[#eef3f0] p-4 text-sm leading-6 text-[#64736e]">
                    {latest.aiReasons.map((reason) => <p key={reason}>• {reason}</p>)}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-[#d5e0da] bg-[#172525] p-6 text-[#eef3f0]">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-lg bg-[#087a70]/25 text-[#8fe0d5]">
                    <Blocks size={21} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold">Blockchain audit</h3>
                    <p className="text-sm text-[#b8c6c0]">Hash-only evidence and verification</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 text-sm">
                  <p className="flex justify-between gap-4"><span className="text-[#b8c6c0]">Status</span><strong>{latest.blockchainAuditStatus}</strong></p>
                  <p className="break-all"><span className="text-[#b8c6c0]">Transaction</span><br /><strong>{latest.blockchainTransactionHash ?? '—'}</strong></p>
                  <p className="break-all"><span className="text-[#b8c6c0]">Payload hash</span><br /><strong>{latest.blockchainPayloadHash ?? '—'}</strong></p>
                </div>
                {latest.blockchainAuditStatus === 'confirmed' ? (
                  <Link to={`/app/audit/${latest.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#eef3f0] px-4 py-3 text-sm font-bold text-[#172525]">
                    <ShieldCheck size={17} /> Verify evidence
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

