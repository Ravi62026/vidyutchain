import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'

export function AnalyticsPage() {
  const { accessToken } = useAuth()
  const [meters, setMeters] = useState([])
  const [selectedMeter, setSelectedMeter] = useState('')
  const [interval, setInterval] = useState('hourly')
  const [aggregation, setAggregation] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const meterResult = await api.meters(accessToken)
      const meterList = meterResult.meters ?? []
      setMeters(meterList)
      const meterId = selectedMeter || meterList[0]?.meterId || ''
      setSelectedMeter(meterId)
      if (meterId) {
        const result = await api.telemetryAggregation(accessToken, meterId, { interval })
        setAggregation(result.aggregation ?? [])
      } else {
        setAggregation([])
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, interval, selectedMeter])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  const summary = useMemo(() => ({
    importKwh: aggregation.reduce((sum, item) => sum + item.importKwh, 0),
    exportKwh: aggregation.reduce((sum, item) => sum + item.exportKwh, 0),
    readings: aggregation.reduce((sum, item) => sum + item.readings, 0),
    peak: Math.max(0, ...aggregation.map((item) => item.averagePowerKw ?? 0)),
  }), [aggregation])

  if (isLoading) {
    return <LoadingState label="Loading telemetry analytics…" />
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Telemetry analytics</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Historical energy patterns</h2>
          <p className="mt-2 text-sm text-[#64736e]">Aggregation is served by the Node.js backend from stored telemetry.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={selectedMeter} onChange={(event) => setSelectedMeter(event.target.value)} className="h-11 rounded-lg border border-[#d5e0da] bg-white px-4 text-sm font-semibold">
            {meters.map((meter) => <option key={meter.id} value={meter.meterId}>{meter.meterId}</option>)}
          </select>
          <select value={interval} onChange={(event) => setInterval(event.target.value)} className="h-11 rounded-lg border border-[#d5e0da] bg-white px-4 text-sm font-semibold">
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {!error && meters.length === 0 ? <EmptyState title="No meters available" message="Register a meter before viewing analytics." /> : null}

      {!error && meters.length > 0 ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total import', `${summary.importKwh.toFixed(2)} kWh`],
              ['Total export', `${summary.exportKwh.toFixed(2)} kWh`],
              ['Readings', summary.readings],
              ['Peak average power', `${summary.peak.toFixed(2)} kW`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64736e]">{label}</p>
                <p className="mt-3 font-display text-3xl font-bold">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-[#e7f4f1] text-[#087a70]"><BarChart3 size={21} /></span>
              <div>
                <h3 className="font-display text-xl font-bold">Aggregation buckets</h3>
                <p className="text-sm text-[#64736e]">UTC buckets returned by the backend aggregation pipeline.</p>
              </div>
            </div>
            {aggregation.length === 0 ? (
              <div className="mt-6"><EmptyState title="No aggregation data" message="Telemetry must be ingested before historical buckets can be calculated." /></div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d5e0da] text-xs uppercase tracking-[0.14em] text-[#64736e]">
                      <th className="py-3 pr-4">Bucket</th>
                      <th className="py-3 pr-4">Readings</th>
                      <th className="py-3 pr-4">Average power</th>
                      <th className="py-3 pr-4">Import</th>
                      <th className="py-3">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregation.map((item) => (
                      <tr key={item.timestamp} className="border-b border-[#d5e0da]/70 last:border-0">
                        <td className="py-3 pr-4 font-semibold">{new Date(item.timestamp).toLocaleString()}</td>
                        <td className="py-3 pr-4">{item.readings}</td>
                        <td className="py-3 pr-4">{item.averagePowerKw?.toFixed(2) ?? '—'} kW</td>
                        <td className="py-3 pr-4">{item.importKwh.toFixed(2)} kWh</td>
                        <td className="py-3">{item.exportKwh.toFixed(2)} kWh</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

