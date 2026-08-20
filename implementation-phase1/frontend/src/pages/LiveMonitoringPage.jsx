import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function LiveMonitoringPage() {
  const { accessToken } = useAuth()
  const [meters, setMeters] = useState([])
  const [selectedMeter, setSelectedMeter] = useState('')
  const [latest, setLatest] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const meterResult = await api.meters(accessToken)
      const meterList = meterResult.meters ?? []
      setMeters(meterList)
      const meterId = selectedMeter || meterList[0]?.meterId || ''
      setSelectedMeter(meterId)
      if (meterId) {
        const latestResult = await api.latestTelemetry(accessToken, meterId)
        setLatest(latestResult.telemetry)
      } else {
        setLatest(null)
      }
      setLastRefresh(new Date())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, selectedMeter])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => load())
    const interval = window.setInterval(load, 15000)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(interval)
    }
  }, [load])

  const freshness = useMemo(() => {
    if (!latest?.timestamp) return 'No telemetry'
    if (!lastRefresh) return 'Checking freshness…'
    const ageSeconds = Math.max(0, Math.round((lastRefresh.getTime() - new Date(latest.timestamp).getTime()) / 1000))
    return ageSeconds < 300 ? `Fresh · ${ageSeconds}s old` : `Delayed · ${Math.round(ageSeconds / 60)}m old`
  }, [latest, lastRefresh])

  if (isLoading) {
    return <LoadingState label="Connecting to live telemetry…" />
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Live monitoring</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Telemetry stream</h2>
          <p className="mt-2 text-sm text-[#64736e]">Polling the authenticated Node.js API every 15 seconds.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedMeter} onChange={(event) => setSelectedMeter(event.target.value)} className="h-11 rounded-lg border border-[#d5e0da] bg-white px-4 text-sm font-semibold outline-none">
            {meters.map((meter) => <option key={meter.id} value={meter.meterId}>{meter.meterId}</option>)}
          </select>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {!error && meters.length === 0 ? <EmptyState title="No meters available" message="Register a meter before opening live monitoring." /> : null}

      {!error && meters.length > 0 ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[#d5e0da] bg-[#172525] p-6 text-[#eef3f0]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fa39c]">Selected meter</p>
                <h3 className="mt-2 font-display text-3xl font-bold">{selectedMeter}</h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#087a70]/20 px-3 py-1.5 text-xs font-bold text-[#8fe0d5]">
                <Activity size={14} />
                {freshness}
              </span>
            </div>

            {latest ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ['Voltage', `${latest.voltage.toFixed(1)} V`],
                  ['Current', `${latest.current.toFixed(2)} A`],
                  ['Power', `${latest.powerKw.toFixed(2)} kW`],
                  ['Power factor', latest.powerFactor.toFixed(2)],
                  ['Import', `${latest.importKwh.toFixed(2)} kWh`],
                  ['Export', `${latest.exportKwh.toFixed(2)} kWh`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-xs text-[#8fa39c]">{label}</p>
                    <p className="mt-3 font-display text-3xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-[#b8c6c0]">
                No telemetry packet has been received for this meter.
              </div>
            )}
          </div>

          <div className="grid gap-6">
            <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
              <h3 className="font-display text-xl font-bold">Packet state</h3>
              <div className="mt-5 grid gap-3 text-sm">
                <p className="flex justify-between"><span className="text-[#64736e]">Source</span><strong className="capitalize">{latest?.source ?? '—'}</strong></p>
                <p className="flex justify-between"><span className="text-[#64736e]">Timestamp</span><strong>{latest ? new Date(latest.timestamp).toLocaleTimeString() : '—'}</strong></p>
                <p className="flex justify-between"><span className="text-[#64736e]">Last refresh</span><strong>{lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}</strong></p>
                <p className="flex justify-between"><span className="text-[#64736e]">Status</span><StatusBadge value={latest?.status ?? 'offline'} /></p>
              </div>
            </div>
            <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
              <h3 className="font-display text-xl font-bold">AI and audit</h3>
              <div className="mt-5 grid gap-3 text-sm">
                <p className="flex justify-between"><span className="text-[#64736e]">AI class</span><strong>{latest?.aiAnomalyType ?? '—'}</strong></p>
                <p className="flex justify-between"><span className="text-[#64736e]">Risk</span><strong>{latest?.aiRiskScore?.toFixed(2) ?? '—'}</strong></p>
                <p className="flex justify-between"><span className="text-[#64736e]">Audit</span><StatusBadge value={latest?.blockchainAuditStatus ?? 'disabled'} /></p>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

