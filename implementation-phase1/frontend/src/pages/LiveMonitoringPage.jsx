import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  Layers,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

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
    const interval = window.setInterval(load, 10000)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(interval)
    }
  }, [load])

  const freshness = useMemo(() => {
    if (!latest?.timestamp) return 'No Telemetry'
    if (!lastRefresh) return 'Synchronizing…'
    const ageSeconds = Math.max(0, Math.round((lastRefresh.getTime() - new Date(latest.timestamp).getTime()) / 1000))
    return ageSeconds < 300 ? `Live Stream · ${ageSeconds}s lag` : `Historical · ${Math.round(ageSeconds / 60)}m ago`
  }, [latest, lastRefresh])

  if (isLoading) {
    return <LoadingState label="Connecting to live high-frequency telemetry stream…" />
  }

  return (
    <div className="grid gap-7">
      {/* Top Header & Meter Selector */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">Telemetry Stream</p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            Real-Time Electrical Monitoring
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            Instantaneous waveform parameters streamed via REST / WebSocket pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedMeter}
              onChange={(event) => setSelectedMeter(event.target.value)}
              className="h-11 rounded-xl border border-[#d8e3dc] bg-white px-4 pr-10 text-sm font-bold text-[#092b24] shadow-sm outline-none transition focus:border-[#007062] focus:ring-4 focus:ring-[#007062]/10 cursor-pointer"
            >
              {meters.map((meter) => (
                <option key={meter.id} value={meter.meterId}>
                  {meter.meterId} — {meter.displayName}
                </option>
              ))}
            </select>
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
        <EmptyState
          title="No meters registered"
          message="Register a meter in the Fleet Registry to start monitoring live electrical streams."
        />
      ) : null}

      {!error && meters.length > 0 ? (
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Main Gauges & Waveform Surface */}
          <div className="glass-panel rounded-2xl p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-[#d8e3dc] pb-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md shadow-[#007062]/25">
                  <Zap size={24} className="fill-white/20" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">Active Device</p>
                  <h3 className="font-display text-2xl font-bold text-[#092b24]">{selectedMeter}</h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
                <Activity size={14} className="text-emerald-600 animate-pulse" />
                {freshness}
              </span>
            </div>

            {latest ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Voltage Tile */}
                <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#5a786f]">RMS Voltage</p>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Normal
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-extrabold text-[#092b24]">
                    {formatNumber(latest.voltage, 1)} <span className="text-sm font-normal text-[#5a786f]">V</span>
                  </p>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, (latest.voltage / 260) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#6a877e]">Nominal Grid: 230V ±6%</p>
                </div>

                {/* Current Tile */}
                <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#5a786f]">Current Draw</p>
                    <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      CT Sensor
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-extrabold text-[#092b24]">
                    {formatNumber(latest.current, 2)} <span className="text-sm font-normal text-[#5a786f]">A</span>
                  </p>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${Math.min(100, (latest.current / 30) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#6a877e]">Rating: 0–40A Single Phase</p>
                </div>

                {/* Active Power Tile */}
                <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#5a786f]">Active Power</p>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      Real Power
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-extrabold text-[#092b24]">
                    {formatNumber(latest.powerKw, 2)} <span className="text-sm font-normal text-[#5a786f]">kW</span>
                  </p>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, (Math.abs(latest.powerKw) / 10) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-[#6a877e]">Bidirectional net flow</p>
                </div>

                {/* Power Factor Tile */}
                <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#5a786f]">Power Factor</p>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Cos φ
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-extrabold text-[#092b24]">
                    {formatNumber(latest.powerFactor, 2)}
                  </p>
                  <p className="mt-2 text-[11px] text-[#6a877e]">
                    {latest.powerFactor >= 0.9 ? 'Optimal Efficiency (>0.90)' : 'Low PF Detected'}
                  </p>
                </div>

                {/* Total Import Tile */}
                <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#5a786f]">Grid Energy In</p>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      Import
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-extrabold text-[#005c51]">
                    {formatNumber(latest.importKwh, 2)} <span className="text-sm font-normal text-[#5a786f]">kWh</span>
                  </p>
                  <p className="mt-2 text-[11px] text-[#6a877e]">Cumulative utility consumption</p>
                </div>

                {/* Total Export Tile */}
                <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#5a786f]">Solar Energy Out</p>
                    <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-900">
                      Export
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-extrabold text-cyan-700">
                    {formatNumber(latest.exportKwh, 2)} <span className="text-sm font-normal text-[#5a786f]">kWh</span>
                  </p>
                  <p className="mt-2 text-[11px] text-[#6a877e]">Rooftop solar fed into grid</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-[#d8e3dc] p-10 text-center">
                <p className="text-sm font-semibold text-[#6a877e]">
                  No telemetry reading has arrived yet for {selectedMeter}.
                </p>
                <p className="mt-1 text-xs text-[#8fa79f]">
                  Start the simulator to begin streaming data: <code className="font-mono bg-slate-100 px-2 py-0.5 rounded">npm run demo:seed</code>
                </p>
              </div>
            )}
          </div>

          {/* Right Column: AI Risk & Cryptographic Proof */}
          <div className="grid gap-6">
            {/* Packet Metadata */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="font-display text-base font-bold text-[#092b24]">Telemetry Provenance</h4>
              <div className="mt-4 grid gap-3 text-xs">
                <div className="flex justify-between border-b border-[#d8e3dc]/70 pb-2">
                  <span className="text-[#5a786f]">Ingestion Source</span>
                  <span className="font-bold text-[#092b24] capitalize">{latest?.source ?? 'Simulator'}</span>
                </div>
                <div className="flex justify-between border-b border-[#d8e3dc]/70 pb-2">
                  <span className="text-[#5a786f]">Device Timestamp</span>
                  <span className="font-mono font-semibold text-[#092b24]">
                    {latest ? new Date(latest.timestamp).toLocaleTimeString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#d8e3dc]/70 pb-2">
                  <span className="text-[#5a786f]">Ingestion Latency</span>
                  <span className="font-semibold text-emerald-700">22ms</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#5a786f]">Telemetry Status</span>
                  <StatusBadge value={latest?.status ?? 'online'} />
                </div>
              </div>
            </div>

            {/* AI Diagnosis */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-bold text-[#092b24]">AI Anomaly Diagnosis</h4>
                <StatusBadge
                  value={
                    latest?.aiAnomalyType && latest.aiAnomalyType !== 'NORMAL'
                      ? latest.aiAnomalyType
                      : latest
                      ? 'normal'
                      : 'registered'
                  }
                />
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5a786f]">Theft / Tamper Risk</span>
                  <span className="font-mono font-bold text-[#092b24]">
                    {latest?.aiRiskScore ? `${(latest.aiRiskScore * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (latest?.aiRiskScore ?? 0) > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (latest?.aiRiskScore ?? 0) * 100)}%` }}
                  />
                </div>
              </div>

              <Link
                to={`/app/meters/${selectedMeter}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#007062] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51] transition"
              >
                View Full Historical Waveforms <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
