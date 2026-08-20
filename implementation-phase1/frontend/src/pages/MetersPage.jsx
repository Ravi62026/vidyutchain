import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gauge, Plus, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function MetersPage() {
  const { accessToken } = useAuth()
  const [meters, setMeters] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ meterId: '', displayName: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [createError, setCreateError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await api.meters(accessToken)
      setMeters(result.meters ?? [])
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

  const filteredMeters = meters.filter((meter) => {
    const search = query.trim().toLowerCase()
    return !search || meter.meterId.toLowerCase().includes(search) || meter.displayName.toLowerCase().includes(search)
  })

  const createMeter = async (event) => {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)
    try {
      await api.createMeter(accessToken, form)
      setForm({ meterId: '', displayName: '' })
      await load()
    } catch (requestError) {
      setCreateError(requestError.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087a70]">Meter registry</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em]">Registered meters</h2>
          <p className="mt-2 text-sm text-[#64736e]">Backend registration and blockchain registration status are tracked separately.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5e0da] bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-[#eef3f0]">
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={createMeter} className="h-fit rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-[#e7f4f1] text-[#087a70]">
              <Plus size={20} />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold">Register meter</h3>
              <p className="text-sm text-[#64736e]">Creates backend record and attempts chain registration.</p>
            </div>
          </div>

          {createError ? <div className="mt-5 rounded-lg border border-[#e5b7b2] bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#a43f37]">{createError}</div> : null}

          <label className="mt-6 block">
            <span className="text-sm font-bold">Meter ID</span>
            <input
              value={form.meterId}
              onChange={(event) => setForm((current) => ({ ...current, meterId: event.target.value }))}
              required
              minLength={3}
              maxLength={64}
              placeholder="VC-MTR-001"
              className="mt-2 h-12 w-full rounded-lg border border-[#d5e0da] bg-white px-4 text-sm outline-none transition focus:border-[#087a70] focus:ring-4 focus:ring-[#087a70]/10"
            />
          </label>
          <label className="mt-5 block">
            <span className="text-sm font-bold">Display name</span>
            <input
              value={form.displayName}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              required
              minLength={2}
              maxLength={120}
              placeholder="Main distribution room"
              className="mt-2 h-12 w-full rounded-lg border border-[#d5e0da] bg-white px-4 text-sm outline-none transition focus:border-[#087a70] focus:ring-4 focus:ring-[#087a70]/10"
            />
          </label>
          <button type="submit" disabled={isCreating} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#087a70] text-sm font-bold text-white transition hover:bg-[#08665e] disabled:opacity-60">
            {isCreating ? 'Registering…' : 'Register meter'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="rounded-xl border border-[#d5e0da] bg-[#f8faf7]/85 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-xl font-bold">Fleet</h3>
              <p className="mt-1 text-sm text-[#64736e]">{filteredMeters.length} of {meters.length} meters visible</p>
            </div>
            <label className="flex h-11 min-w-64 items-center gap-3 rounded-lg border border-[#d5e0da] bg-white px-4">
              <Search size={17} className="text-[#87958f]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meter or name" className="w-full bg-transparent text-sm outline-none" />
            </label>
          </div>

          {isLoading ? (
            <div className="mt-6"><LoadingState label="Loading meters…" /></div>
          ) : error ? (
            <div className="mt-6"><ErrorState message={error} /></div>
          ) : filteredMeters.length === 0 ? (
            <div className="mt-6"><EmptyState title="No meters found" message="Adjust the search or register a new meter." /></div>
          ) : (
            <div className="mt-6 grid gap-3">
              {filteredMeters.map((meter) => (
                <Link key={meter.id} to={`/app/meters/${meter.meterId}`} className="group rounded-xl border border-[#d5e0da] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-[#087a70]/40 hover:bg-white hover:shadow-lg hover:shadow-[#172525]/8">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <span className="grid size-12 place-items-center rounded-lg bg-[#e7f4f1] text-[#087a70]">
                        <Gauge size={22} />
                      </span>
                      <div>
                        <p className="font-display text-lg font-bold">{meter.meterId}</p>
                        <p className="text-sm text-[#64736e]">{meter.displayName}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={meter.status} />
                      <StatusBadge value={meter.blockchainRegistrationStatus ?? 'disabled'} />
                      <ArrowRight size={17} className="text-[#87958f] transition group-hover:translate-x-1 group-hover:text-[#087a70]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

