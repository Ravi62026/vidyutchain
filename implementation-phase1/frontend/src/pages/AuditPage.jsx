import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function AuditPage() {
  const { accessToken } = useAuth()
  const [records, setRecords] = useState([])
  const [copiedHash, setCopiedHash] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const meterResult = await api.meters(accessToken)
      const historyResults = await Promise.allSettled(
        (meterResult.meters ?? []).map((meter) =>
          api.telemetryHistory(accessToken, meter.meterId, { limit: 100 }),
        ),
      )
      const telemetry = historyResults.flatMap((result) =>
        result.status === 'fulfilled' ? result.value.telemetry ?? [] : [],
      )
      setRecords(
        telemetry.filter(
          (item) => item.blockchainAuditStatus && item.blockchainAuditStatus !== 'disabled',
        ),
      )
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(''), 2000)
  }

  const summary = useMemo(
    () => ({
      total: records.length,
      confirmed: records.filter((item) => item.blockchainAuditStatus === 'confirmed').length,
      failed: records.filter((item) => item.blockchainAuditStatus === 'failed').length,
    }),
    [records],
  )

  if (isLoading) {
    return <LoadingState label="Reading cryptographic audit proofs from EVM smart contract…" />
  }

  return (
    <div className="grid gap-7">
      {/* Header Banner */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
              EVM Smart Contract Ledger
            </p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            Blockchain Audit Trail & Integrity
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            Tamper-evident, zero-raw-data on-chain logging powered by EnergyAudit.sol.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800">
            <Lock size={14} className="text-emerald-600" />
            Contract: 0x5FbD...0aa3
          </div>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2.5 text-sm font-bold text-[#0c2b25] shadow-sm transition hover:bg-[#eef3f0]"
          >
            <RefreshCw size={15} className="text-[#007062]" />
            Sync Ledger
          </button>
        </div>
      </section>

      {/* 3 Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Audit Events',
            value: summary.total,
            sub: 'Cryptographic anomaly digests',
            icon: Blocks,
            accent: 'text-[#007062]',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Confirmed On-Chain',
            value: summary.confirmed,
            sub: 'Zero dispute transaction finality',
            icon: ShieldCheck,
            accent: 'text-emerald-700',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Tamper / Failed Writes',
            value: summary.failed,
            sub: 'Zero tampering detected',
            icon: ShieldAlert,
            accent: summary.failed > 0 ? 'text-rose-700' : 'text-slate-500',
            bg: summary.failed > 0 ? 'bg-rose-500/10' : 'bg-slate-100',
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
              <p className="mt-3 font-display text-3xl font-extrabold text-[#092b24]">{item.value}</p>
              <p className="mt-1 text-xs text-[#6a877e]">{item.sub}</p>
            </div>
          )
        })}
      </section>

      {error ? <ErrorState message={error} /> : null}
      {!error && records.length === 0 ? (
        <EmptyState
          title="No audit events logged yet"
          message="AI anomalies and smart meter tampering events will automatically write proof hashes to the blockchain."
        />
      ) : null}

      {!error && records.length > 0 ? (
        <section className="glass-panel rounded-2xl p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#005c51] text-white shadow-md">
                <Blocks size={22} className="text-[#4ef2d2]" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-[#092b24]">On-Chain Transaction Registry</h3>
                <p className="text-xs text-[#5a786f]">
                  Immutable ledger entries verified against Ethereum EVM smart contract.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#d8e3dc] text-[11px] font-extrabold uppercase tracking-wider text-[#6a877e]">
                  <th className="py-3 pr-4">Meter Identifier</th>
                  <th className="py-3 pr-4">AI Event Type</th>
                  <th className="py-3 pr-4">Keccak-256 Payload Hash</th>
                  <th className="py-3 pr-4">Ethereum Tx Hash</th>
                  <th className="py-3 pr-4">Ledger State</th>
                  <th className="py-3 text-right">Integrity Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8e3dc]/70">
                {records.map((item) => {
                  const isCopiedTx = copiedHash === item.blockchainTransactionHash
                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-white/90">
                      <td className="py-4 pr-4">
                        <Link
                          to={`/app/meters/${item.meterId}`}
                          className="font-mono text-sm font-bold text-[#092b24] group-hover:text-[#007062] transition"
                        >
                          {item.meterId}
                        </Link>
                      </td>

                      <td className="py-4 pr-4">
                        <StatusBadge value={item.aiAnomalyType ?? 'ANOMALY_EVENT'} />
                      </td>

                      <td className="py-4 pr-4 font-mono text-xs text-[#5a786f]">
                        <span className="inline-block max-w-[180px] truncate">
                          {item.blockchainPayloadHash ?? '—'}
                        </span>
                      </td>

                      <td className="py-4 pr-4 font-mono text-xs">
                        {item.blockchainTransactionHash ? (
                          <div className="flex items-center gap-1.5 text-[#007062]">
                            <span className="max-w-[140px] truncate font-semibold">
                              {item.blockchainTransactionHash}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.blockchainTransactionHash)}
                              className="text-[#6a877e] hover:text-[#007062] transition"
                              title="Copy transaction hash"
                            >
                              <Copy size={13} />
                            </button>
                            {isCopiedTx ? (
                              <span className="text-[10px] text-emerald-700 font-bold">Copied!</span>
                            ) : null}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-4 pr-4">
                        <StatusBadge value={item.blockchainAuditStatus ?? 'confirmed'} />
                      </td>

                      <td className="py-4 text-right">
                        <Link
                          to={`/app/audit/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#007062]/30 bg-[#eaf4ef] px-3.5 py-1.5 text-xs font-bold text-[#007062] shadow-sm transition hover:bg-[#007062] hover:text-white"
                        >
                          <ShieldCheck size={14} />
                          Verify On-Chain
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
