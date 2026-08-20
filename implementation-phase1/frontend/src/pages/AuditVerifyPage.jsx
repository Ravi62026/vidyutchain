import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { ErrorState, LoadingState } from '../components/DataState.jsx'

function HashRow({ label, value }) {
  return (
    <div className="rounded-lg border border-[#d5e0da] bg-white/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64736e]">{label}</p>
      <p className="mt-2 break-all font-mono text-xs text-[#172525]">{value ?? '—'}</p>
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
    return <LoadingState label="Verifying evidence against the chain…" />
  }

  if (error) {
    return <ErrorState title="Audit verification unavailable" message={error} action={<button type="button" onClick={load} className="mt-5 rounded-lg bg-[#172525] px-4 py-2 text-sm font-bold text-white">Retry</button>} />
  }

  const verified = Boolean(result?.verified)

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
        <Link to="/app/audit" className="inline-flex items-center gap-2 text-sm font-bold text-[#64736e] hover:text-[#087a70]">
          <ArrowLeft size={16} /> Back to audit trail
        </Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Audit verification</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em]">{verified ? 'Evidence verified on-chain' : 'Verification did not pass'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64736e]">
              The backend reconstructed the stored anomaly evidence, hashed it canonically, and compared it with the digest recorded by the EnergyAudit contract.
            </p>
          </div>
          <div className={`grid size-24 place-items-center rounded-full border ${verified ? 'border-[#b9d8d1] bg-[#e7f4f1] text-[#087a70]' : 'border-[#e5b7b2] bg-[#fff1ef] text-[#a43f37]'}`}>
            {verified ? <ShieldCheck size={42} /> : <ShieldAlert size={42} />}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className={`rounded-xl border p-6 ${verified ? 'border-[#b9d8d1] bg-[#e7f4f1]' : 'border-[#e5b7b2] bg-[#fff1ef]'}`}>
          <div className="flex items-center gap-3">
            {verified ? <CheckCircle className="text-[#087a70]" size={24} /> : <XCircle className="text-[#a43f37]" size={24} />}
            <div>
              <h3 className="font-display text-xl font-bold">{verified ? 'Digest match' : 'Digest mismatch or unavailable'}</h3>
              <p className="mt-1 text-sm text-[#64736e]">
                {verified
                  ? 'The current database evidence matches the immutable blockchain digest.'
                  : 'The current database evidence does not match the on-chain digest, or audit is not confirmed.'}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm">
            <p className="flex justify-between gap-4"><span className="text-[#64736e]">Telemetry ID</span><strong className="break-all">{result?.telemetryId}</strong></p>
            <p className="flex justify-between gap-4"><span className="text-[#64736e]">Status</span><strong>{result?.status}</strong></p>
            <p className="flex justify-between gap-4"><span className="text-[#64736e]">Verified</span><strong>{String(verified)}</strong></p>
          </div>
          <button type="button" onClick={load} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#172525] px-4 py-3 text-sm font-bold text-white">
            <RefreshCw size={16} /> Re-run verification
          </button>
        </div>

        <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
          <h3 className="font-display text-xl font-bold">Evidence hashes</h3>
          <div className="mt-5 grid gap-4">
            <HashRow label="Reconstructed payload hash" value={result?.payloadHash} />
            <HashRow label="Event ID" value={result?.eventId} />
            <HashRow label="Transaction hash" value={result?.transactionHash} />
            <HashRow label="Meter ID hash" value={result?.meterIdHash} />
            <HashRow label="Event type hash" value={result?.eventTypeHash} />
          </div>
        </div>
      </section>
    </div>
  )
}

