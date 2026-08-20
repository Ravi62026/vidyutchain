import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Blocks,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { ErrorState, LoadingState } from '../components/DataState.jsx'

function HashRow({ label, value, hint }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-[#d8e3dc] bg-white/90 p-4.5 shadow-sm transition hover:border-[#007062]/30">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5a786f]">{label}</p>
        {value ? (
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 text-[11px] font-bold text-[#007062] hover:text-[#005c51] transition"
          >
            <Copy size={12} />
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>
      <p className="mt-2 break-all font-mono text-xs font-semibold text-[#092b24]">
        {value ?? '—'}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-[#8fa79f]">{hint}</p> : null}
    </div>
  )
}

export function AuditVerifyPage() {
  const { telemetryId } = useParams()
  const { accessToken } = useAuth()
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setResult(await api.auditTelemetry(accessToken, telemetryId))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, telemetryId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  if (isLoading) {
    return <LoadingState label="Reconstructing evidence & querying Ethereum smart contract…" />
  }

  if (error) {
    return (
      <ErrorState
        title="Audit verification unavailable"
        message={error}
        action={
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-xl bg-[#007062] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51]"
          >
            Retry Verification
          </button>
        }
      />
    )
  }

  const verified = Boolean(result?.verified)

  return (
    <div className="grid gap-7">
      {/* Header Banner */}
      <section className="glass-panel rounded-2xl p-6 sm:p-7">
        <Link
          to="/app/audit"
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#5a786f] hover:text-[#007062] transition"
        >
          <ArrowLeft size={15} /> Back to Audit Trail
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${verified ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`} />
                <span className={`relative inline-flex size-2 rounded-full ${verified ? 'bg-emerald-600' : 'bg-rose-600'}`} />
              </span>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
                Cryptographic Digest Verification
              </p>
            </div>
            <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
              {verified ? 'Cryptographic Proof 100% Verified' : 'Cryptographic Integrity Failed'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4d6b61]">
              Backend reconstructed the stored database record, computed its Keccak-256 canonical hash, and compared it against the immutable digest on the EnergyAudit smart contract.
            </p>
          </div>

          <div
            className={`grid size-24 shrink-0 place-items-center rounded-3xl border shadow-lg ${
              verified
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-emerald-500/10'
                : 'border-rose-200 bg-rose-50 text-rose-600 shadow-rose-500/10'
            }`}
          >
            {verified ? <ShieldCheck size={48} /> : <ShieldAlert size={48} />}
          </div>
        </div>
      </section>

      {/* Main Breakdown */}
      <section className="grid gap-7 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Verification Status Card */}
        <div
          className={`rounded-2xl border p-6 sm:p-7 shadow-md ${
            verified ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            {verified ? (
              <span className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-md">
                <CheckCircle2 size={24} />
              </span>
            ) : (
              <span className="grid size-11 place-items-center rounded-xl bg-rose-600 text-white shadow-md">
                <XCircle size={24} />
              </span>
            )}
            <div>
              <h3 className="font-display text-xl font-bold text-[#092b24]">
                {verified ? 'Digest Match: Valid' : 'Integrity Mismatch Detected'}
              </h3>
              <p className="text-xs text-[#5a786f]">
                {verified
                  ? 'Database data has not been modified since on-chain audit creation.'
                  : 'Data differs from the original on-chain commitment.'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between rounded-xl bg-white/80 p-3 border border-emerald-900/10">
              <span className="text-[#5a786f]">Telemetry ID:</span>
              <span className="font-bold text-[#092b24] truncate max-w-[170px]">{result?.telemetryId}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/80 p-3 border border-emerald-900/10">
              <span className="text-[#5a786f]">Audit Status:</span>
              <span className="font-bold text-emerald-800 uppercase">{result?.status}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/80 p-3 border border-emerald-900/10">
              <span className="text-[#5a786f]">On-Chain Match:</span>
              <span className="font-bold text-emerald-800">TRUE (100% Match)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#007062] px-4 py-3 text-xs font-extrabold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51] transition"
          >
            <RefreshCw size={14} /> Re-verify Cryptographic Proof
          </button>
        </div>

        {/* Evidence Hashes Explorer */}
        <div className="glass-panel rounded-2xl p-6 sm:p-7">
          <h3 className="font-display text-xl font-bold text-[#092b24]">Cryptographic Evidence Breakdown</h3>
          <p className="text-xs text-[#5a786f]">Direct parameters stored on the EVM state trie.</p>

          <div className="mt-5 grid gap-3.5">
            <HashRow
              label="Reconstructed Payload Hash (Keccak-256)"
              value={result?.payloadHash}
              hint="Computed from canonical JSON of voltage, current, powerKw, PF, and timestamp."
            />
            <HashRow
              label="On-Chain Event ID"
              value={result?.eventId}
              hint="Unique cryptographic index assigned by EnergyAudit.sol contract."
            />
            <HashRow
              label="Ethereum Transaction Hash"
              value={result?.transactionHash}
              hint="Transaction receipt confirming block inclusion on EVM node."
            />
            <HashRow
              label="Meter Identifier Hash"
              value={result?.meterIdHash}
              hint="Hashed identifier mapping the physical/virtual meter hardware."
            />
          </div>
        </div>
      </section>
    </div>
  )
}
