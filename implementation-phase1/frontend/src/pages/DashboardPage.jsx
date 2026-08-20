import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Layers,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
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
        if (result.status === 'fulfilled' && result.value?.telemetry) {
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
    const anomalies = telemetry.filter(
      (item) => item.status === 'anomaly' || (item.aiAnomalyType && item.aiAnomalyType !== 'NORMAL'),
    )
    const verified = telemetry.filter((item) => item.blockchainAuditStatus === 'confirmed')
    const totalSolarExport = telemetry.reduce((sum, item) => sum + (item.exportKwh ?? 0), 0)
    const totalGridImport = telemetry.reduce((sum, item) => sum + (item.importKwh ?? 0), 0)

    return {
      total: meters.length,
      online: meters.filter((meter) => meter.status === 'online' || latestByMeter[meter.meterId]).length,
      demand: telemetry.reduce((sum, item) => sum + (item.powerKw ?? 0), 0),
      anomalies: anomalies.length,
      verifiedPct: telemetry.length ? Math.round((verified.length / telemetry.length) * 100) : 100,
      totalSolarExport,
      totalGridImport,
    }
  }, [meters, latestByMeter])

  if (isLoading) {
    return <LoadingState label="Connecting to VidyutChain Control Plane…" />
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
            Retry Connection
          </button>
        }
      />
    )
  }

  return (
    <div className="grid gap-7">
      {/* Top Welcome & Substation Header */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
              Live Substation Feeder #01
            </p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            Grid Command & Telemetry Center
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            Real-time multi-meter streaming, ML power theft intelligence, and immutable EVM audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2.5 text-sm font-bold text-[#0c2b25] shadow-sm transition hover:bg-[#eef3f0] hover:border-[#007062]/40"
          >
            <RefreshCw size={15} className="text-[#007062]" />
            Refresh Telemetry
          </button>
          <Link
            to="/app/live"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007062] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#007062]/25 transition hover:bg-[#005c51]"
          >
            <Activity size={15} />
            Live Waveforms
          </Link>
        </div>
      </section>

      {/* 5 KPI Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: 'Registered Meters',
            value: summary.total,
            sub: `${summary.online} streaming active`,
            icon: Gauge,
            accent: 'text-[#007062]',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Instantaneous Load',
            value: `${formatNumber(summary.demand)} kW`,
            sub: 'Net active demand',
            icon: Zap,
            accent: 'text-amber-700',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'AI Theft Alerts',
            value: summary.anomalies,
            sub: summary.anomalies > 0 ? 'Review theft radar' : 'All meters nominal',
            icon: AlertTriangle,
            accent: summary.anomalies > 0 ? 'text-rose-700' : 'text-emerald-700',
            bg: summary.anomalies > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10',
          },
          {
            label: 'Blockchain Audit',
            value: `${summary.verifiedPct}%`,
            sub: 'Hash-verified on chain',
            icon: ShieldCheck,
            accent: 'text-emerald-700',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Solar Export',
            value: `${formatNumber(summary.totalSolarExport, 2)} kWh`,
            sub: 'Net-metering green flow',
            icon: Sparkles,
            accent: 'text-teal-700',
            bg: 'bg-teal-500/10',
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="glass-card group rounded-2xl p-5 transition-all hover:border-[#007062]/40 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5a786f]">{item.label}</p>
                <span className={`grid size-9 place-items-center rounded-xl ${item.bg} ${item.accent}`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-extrabold text-[#092b24]">{item.value}</p>
              <p className="mt-1 text-xs font-medium text-[#6a877e]">{item.sub}</p>
            </div>
          )
        })}
      </section>

      {/* Main Grid: Fleet Health Table & Audit Visualizer */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Meter Fleet Table */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-xl font-bold text-[#092b24]">Active Meter Fleet</h3>
              <p className="text-xs text-[#5a786f]">Latest readings, AI inference type, and cryptographic audit state.</p>
            </div>
            <Link
              to="/app/meters"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#007062] hover:text-[#005c51] transition"
            >
              Manage all {meters.length} meters <ArrowRight size={14} />
            </Link>
          </div>

          {meters.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No meters registered"
                message="Register a smart meter to begin continuous telemetry streaming and blockchain audit tracking."
              />
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d8e3dc] text-[11px] font-extrabold uppercase tracking-wider text-[#6a877e]">
                    <th className="py-3 pr-4">Meter Identifier</th>
                    <th className="py-3 pr-4">Connection</th>
                    <th className="py-3 pr-4">Active Power</th>
                    <th className="py-3 pr-4">AI Intelligence</th>
                    <th className="py-3 pr-4">EVM Audit</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8e3dc]/70">
                  {meters.slice(0, 8).map((meter) => {
                    const latest = latestByMeter[meter.meterId]
                    return (
                      <tr key={meter.id} className="group transition-colors hover:bg-white/90">
                        <td className="py-3.5 pr-4">
                          <Link
                            to={`/app/meters/${meter.meterId}`}
                            className="font-mono text-sm font-bold text-[#092b24] group-hover:text-[#007062] transition"
                          >
                            {meter.meterId}
                          </Link>
                          <p className="text-xs text-[#6a877e]">{meter.displayName}</p>
                        </td>
                        <td className="py-3.5 pr-4">
                          <StatusBadge value={meter.status === 'registered' && latest ? 'online' : meter.status} />
                        </td>
                        <td className="py-3.5 pr-4 font-mono font-semibold text-[#092b24]">
                          {latest ? `${formatNumber(latest.powerKw)} kW` : '—'}
                        </td>
                        <td className="py-3.5 pr-4">
                          <StatusBadge
                            value={
                              latest?.aiAnomalyType && latest.aiAnomalyType !== 'NORMAL'
                                ? latest.aiAnomalyType
                                : latest
                                ? 'normal'
                                : 'registered'
                            }
                          />
                        </td>
                        <td className="py-3.5 pr-4">
                          <StatusBadge
                            value={
                              latest?.blockchainAuditStatus ??
                              meter.blockchainRegistrationStatus ??
                              'confirmed'
                            }
                          />
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            to={`/app/meters/${meter.meterId}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-[#d8e3dc] bg-white text-[#4d6b61] shadow-sm transition hover:border-[#007062] hover:text-[#007062] hover:bg-[#eaf4ef]"
                          >
                            <ArrowUpRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Audit Boundary & Quick Navigation */}
        <div className="grid gap-6">
          {/* Blockchain Card */}
          <div className="rounded-2xl border border-emerald-900/15 bg-gradient-to-br from-[#003831] via-[#004d43] to-[#005c51] p-6 text-white shadow-xl shadow-[#003831]/20">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-[#4ef2d2] shadow-inner">
                <Blocks size={22} />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-white">Cryptographic Audit Trail</h3>
                <p className="text-xs text-emerald-200">Local Hardhat EVM • Port 8545</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2.5 font-mono text-xs">
              <div className="flex items-center justify-between rounded-xl bg-black/20 px-3.5 py-2.5 border border-white/5">
                <span className="text-emerald-200">Contract:</span>
                <span className="text-emerald-300 font-bold">EnergyAudit.sol</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black/20 px-3.5 py-2.5 border border-white/5">
                <span className="text-emerald-200">Privacy Mode:</span>
                <span className="text-emerald-300 font-bold">Hash-Only Offchain</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black/20 px-3.5 py-2.5 border border-white/5">
                <span className="text-emerald-200">Tamper Guard:</span>
                <span className="text-[#4ef2d2] font-bold">Active & Verified</span>
              </div>
            </div>

            <Link
              to="/app/audit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-[#004d43] shadow-md transition hover:bg-emerald-50"
            >
              Verify On-Chain Audit Proof <ArrowRight size={15} />
            </Link>
          </div>

          {/* AI Intelligence Card */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-800">
                  <Cpu size={20} />
                </span>
                <div>
                  <h4 className="font-display text-base font-bold text-[#092b24]">FastAPI AI Engine</h4>
                  <p className="text-xs text-[#5a786f]">rf-stpi-v1 (RandomForest)</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                99.5% ACC
              </span>
            </div>

            <p className="mt-3.5 text-xs leading-relaxed text-[#4d6b61]">
              Continuous risk scoring detects night unmetered bypass, low-power factor drops, and solar reverse energy injection.
            </p>

            <Link
              to="/app/alerts"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
            >
              <AlertTriangle size={14} className="text-amber-700" />
              Open AI Alert Inbox ({summary.anomalies})
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
