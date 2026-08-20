import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  Blocks,
  CheckCircle2,
  Cpu,
  Gauge,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

function Metric({ label, value, unit, sub, accent = 'text-[#007062]', bg = 'bg-emerald-500/10' }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc] transition hover:border-[#007062]/40">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5a786f]">{label}</p>
        <span className={`grid size-8 place-items-center rounded-lg ${bg} ${accent}`}>
          <Zap size={15} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-[#092b24]">
        {value ?? '—'} <span className="text-xs font-normal text-[#5a786f]">{unit}</span>
      </p>
      {sub ? <p className="mt-1 text-xs text-[#6a877e]">{sub}</p> : null}
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
        api.telemetryHistory(accessToken, meterId, { limit: 30 }),
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
    return <LoadingState label={`Fetching high-resolution telemetry for ${meterId}…`} />
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        action={
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-xl bg-[#007062] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51]"
          >
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div className="grid gap-7">
      {/* Top Header */}
      <section className="glass-panel rounded-2xl p-6 sm:p-7">
        <Link
          to="/app/meters"
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#5a786f] hover:text-[#007062] transition"
        >
          <ArrowLeft size={15} /> Back to Fleet Directory
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-lg shadow-[#007062]/25">
              <Gauge size={28} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
                  Smart Meter Detail
                </p>
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#082822]">
                {meterId}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge value={latest?.status ?? 'online'} />
            <StatusBadge value={latest?.blockchainAuditStatus ?? 'confirmed'} />
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2 text-xs font-bold text-[#0c2b25] shadow-sm transition hover:bg-[#eef3f0]"
            >
              <RefreshCw size={14} className="text-[#007062]" /> Refresh
            </button>
          </div>
        </div>
      </section>

      {!latest ? (
        <EmptyState
          title="No telemetry received"
          message="This meter is registered, but no readings have been streamed yet. Run the simulator to seed data."
        />
      ) : (
        <>
          {/* 4 KPI Metrics */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="RMS Voltage"
              value={formatNumber(latest.voltage, 1)}
              unit="V"
              sub="Nominal 230V Single Phase"
              accent="text-emerald-700"
              bg="bg-emerald-500/10"
            />
            <Metric
              label="Instant Current"
              value={formatNumber(latest.current, 2)}
              unit="A"
              sub="Current transformer CT line"
              accent="text-teal-700"
              bg="bg-teal-500/10"
            />
            <Metric
              label="Real Power"
              value={formatNumber(latest.powerKw, 2)}
              unit="kW"
              sub="Bidirectional net power"
              accent="text-amber-700"
              bg="bg-amber-500/10"
            />
            <Metric
              label="Power Factor"
              value={formatNumber(latest.powerFactor, 2)}
              unit=""
              sub={latest.powerFactor >= 0.9 ? 'Optimal Power Factor' : 'Low PF Alert'}
              accent="text-emerald-700"
              bg="bg-emerald-500/10"
            />
          </section>

          {/* Main Grid: Telemetry Log & AI/Blockchain Details */}
          <section className="grid gap-7 xl:grid-cols-[1.3fr_0.7fr]">
            {/* History Table */}
            <div className="glass-panel rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#092b24]">Telemetry Stream History</h3>
                  <p className="text-xs text-[#5a786f]">Latest {history.length} continuous readings.</p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d8e3dc] text-[11px] font-extrabold uppercase tracking-wider text-[#6a877e]">
                      <th className="py-3 pr-4">Timestamp</th>
                      <th className="py-3 pr-4">Power kW</th>
                      <th className="py-3 pr-4">Import kWh</th>
                      <th className="py-3 pr-4">Export kWh</th>
                      <th className="py-3 pr-4">AI Class</th>
                      <th className="py-3 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8e3dc]/70">
                    {history.map((record) => (
                      <tr key={record.id} className="group transition-colors hover:bg-white/90">
                        <td className="py-3.5 pr-4 font-mono text-xs text-[#5a786f]">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3.5 pr-4 font-mono font-bold text-[#092b24]">
                          {formatNumber(record.powerKw, 2)}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-[#007062]">
                          {formatNumber(record.importKwh, 2)}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-cyan-700">
                          {formatNumber(record.exportKwh, 2)}
                        </td>
                        <td className="py-3.5 pr-4">
                          <StatusBadge
                            value={
                              record.aiAnomalyType && record.aiAnomalyType !== 'NORMAL'
                                ? record.aiAnomalyType
                                : 'normal'
                            }
                          />
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            to={`/app/audit/${record.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#d8e3dc] bg-white px-2.5 py-1 text-[11px] font-bold text-[#007062] transition hover:bg-[#eaf4ef]"
                          >
                            <Blocks size={12} /> Proof
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Meter Identity & Cryptographic Audit Summary */}
            <div className="grid gap-6">
              {/* Provenance Card */}
              <div className="glass-panel rounded-2xl p-6">
                <h4 className="font-display text-base font-bold text-[#092b24]">Meter Topology</h4>
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#d8e3dc]/70 pb-2">
                    <span className="text-[#5a786f]">Serial Identifier</span>
                    <span className="font-mono font-bold text-[#092b24]">{meterId}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#d8e3dc]/70 pb-2">
                    <span className="text-[#5a786f]">Substation Feeder</span>
                    <span className="font-semibold text-[#092b24]">STPI-BLR-01</span>
                  </div>
                  <div className="flex justify-between border-b border-[#d8e3dc]/70 pb-2">
                    <span className="text-[#5a786f]">Total Ingested</span>
                    <span className="font-mono font-semibold text-[#092b24]">{history.length} Packets</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[#5a786f]">Ledger Commitment</span>
                    <StatusBadge value={latest.blockchainAuditStatus ?? 'confirmed'} />
                  </div>
                </div>
              </div>

              {/* On-Chain Verify CTA */}
              <div className="rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#005c51] to-[#004d43] p-6 text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-[#4ef2d2]">
                    <ShieldCheck size={22} />
                  </span>
                  <div>
                    <h4 className="font-display text-base font-bold text-white">Tamper Protection</h4>
                    <p className="text-xs text-emerald-200">Zero raw data on chain</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-emerald-100">
                  Every anomalous reading from this meter has its Keccak-256 canonical hash anchored into the EnergyAudit.sol contract.
                </p>
                <Link
                  to={`/app/audit/${latest.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#004d43] shadow-md transition hover:bg-emerald-50"
                >
                  Verify Latest Record On-Chain
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
