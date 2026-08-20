import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Layers,
  Radio,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

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

  const summary = useMemo(
    () => ({
      importKwh: aggregation.reduce((sum, item) => sum + (item.importKwh ?? 0), 0),
      exportKwh: aggregation.reduce((sum, item) => sum + (item.exportKwh ?? 0), 0),
      readings: aggregation.reduce((sum, item) => sum + (item.readings ?? 0), 0),
      peak: Math.max(0, ...aggregation.map((item) => item.averagePowerKw ?? 0)),
    }),
    [aggregation],
  )

  if (isLoading) {
    return <LoadingState label="Computing time-series aggregation buckets from MongoDB…" />
  }

  return (
    <div className="grid gap-7">
      {/* Top Header & Range Selector */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
              Energy Analytics
            </p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            Historical Consumption & Net Metering
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            Automated hourly and daily aggregation served from time-series indices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMeter}
            onChange={(event) => setSelectedMeter(event.target.value)}
            className="h-11 rounded-xl border border-[#d8e3dc] bg-white px-4 font-bold text-sm text-[#092b24] shadow-sm outline-none transition focus:border-[#007062] focus:ring-4 focus:ring-[#007062]/10 cursor-pointer"
          >
            {meters.map((meter) => (
              <option key={meter.id} value={meter.meterId}>
                {meter.meterId} — {meter.displayName}
              </option>
            ))}
          </select>

          {/* Interval Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-[#5a786f]">
            <button
              type="button"
              onClick={() => setInterval('hourly')}
              className={`rounded-lg px-3 py-2 transition ${
                interval === 'hourly' ? 'bg-white text-[#007062] shadow-sm' : 'hover:text-[#092b24]'
              }`}
            >
              Hourly
            </button>
            <button
              type="button"
              onClick={() => setInterval('daily')}
              className={`rounded-lg px-3 py-2 transition ${
                interval === 'daily' ? 'bg-white text-[#007062] shadow-sm' : 'hover:text-[#092b24]'
              }`}
            >
              Daily
            </button>
          </div>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2.5 text-sm font-bold text-[#0c2b25] shadow-sm transition hover:bg-[#eef3f0]"
          >
            <RefreshCw size={15} className="text-[#007062]" /> Refresh
          </button>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {!error && meters.length === 0 ? (
        <EmptyState title="No meters available" message="Register a meter before viewing analytics." />
      ) : null}

      {!error && meters.length > 0 ? (
        <>
          {/* 4 Summary Metric Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Total Utility Import',
                value: `${formatNumber(summary.importKwh)} kWh`,
                sub: 'Grid-supplied electricity',
                icon: Zap,
                accent: 'text-[#007062]',
                bg: 'bg-emerald-500/10',
              },
              {
                label: 'Total Solar Export',
                value: `${formatNumber(summary.exportKwh)} kWh`,
                sub: 'Rooftop solar fed into grid',
                icon: Sparkles,
                accent: 'text-cyan-700',
                bg: 'bg-cyan-500/10',
              },
              {
                label: 'Telemetry Readings',
                value: summary.readings,
                sub: 'Aggregated sample count',
                icon: BarChart3,
                accent: 'text-teal-700',
                bg: 'bg-teal-500/10',
              },
              {
                label: 'Peak Average Power',
                value: `${formatNumber(summary.peak)} kW`,
                sub: 'Maximum interval load',
                icon: TrendingUp,
                accent: 'text-amber-700',
                bg: 'bg-amber-500/10',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="glass-card rounded-2xl p-5 border border-[#d8e3dc] transition hover:border-[#007062]/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5a786f]">{item.label}</p>
                    <span className={`grid size-9 place-items-center rounded-xl ${item.bg} ${item.accent}`}>
                      <Icon size={18} />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-extrabold text-[#092b24]">{item.value}</p>
                  <p className="mt-1 text-xs text-[#6a877e]">{item.sub}</p>
                </div>
              )
            })}
          </section>

          {/* Aggregation Buckets Surface */}
          <section className="glass-panel rounded-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-[#005c51] text-white shadow-md">
                  <BarChart3 size={22} className="text-[#4ef2d2]" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#092b24]">
                    Time-Series Aggregation ({interval.toUpperCase()})
                  </h3>
                  <p className="text-xs text-[#5a786f]">
                    Calculated via MongoDB pipeline for {selectedMeter}.
                  </p>
                </div>
              </div>
            </div>

            {aggregation.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#d8e3dc] p-10 text-center text-sm text-[#6a877e]">
                No aggregated data points found for this meter in the selected interval.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d8e3dc] text-[11px] font-extrabold uppercase tracking-wider text-[#6a877e]">
                      <th className="py-3 pr-4">Time Interval Bucket</th>
                      <th className="py-3 pr-4">Average Power</th>
                      <th className="py-3 pr-4">Energy Import</th>
                      <th className="py-3 pr-4">Energy Export</th>
                      <th className="py-3 text-right">Samples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8e3dc]/70">
                    {aggregation.map((bucket, index) => (
                      <tr key={index} className="group transition-colors hover:bg-white/90">
                        <td className="py-3.5 pr-4 font-mono text-xs font-semibold text-[#092b24]">
                          {bucket.bucket}
                        </td>
                        <td className="py-3.5 pr-4 font-mono font-bold text-[#092b24]">
                          {formatNumber(bucket.averagePowerKw)} kW
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-[#007062] font-semibold">
                          {formatNumber(bucket.importKwh)} kWh
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-cyan-700 font-semibold">
                          {formatNumber(bucket.exportKwh)} kWh
                        </td>
                        <td className="py-3.5 text-right font-mono text-xs text-[#5a786f]">
                          {bucket.readings} readings
                        </td>
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
