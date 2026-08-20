import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  Gauge,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function MetersPage() {
  const { accessToken } = useAuth()
  const [meters, setMeters] = useState([])
  const [query, setQuery] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [form, setForm] = useState({ meterId: '', displayName: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

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
    const matchesSearch =
      !search ||
      meter.meterId.toLowerCase().includes(search) ||
      meter.displayName.toLowerCase().includes(search)

    if (!matchesSearch) return false

    if (filterTab === 'confirmed') {
      return meter.blockchainRegistrationStatus === 'confirmed'
    }
    if (filterTab === 'online') {
      return meter.status === 'online'
    }
    return true
  })

  const createMeter = async (event) => {
    event.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setIsCreating(true)
    try {
      await api.createMeter(accessToken, form)
      setCreateSuccess(`Meter ${form.meterId} registered and confirmed on-chain!`)
      setForm({ meterId: '', displayName: '' })
      await load()
    } catch (requestError) {
      setCreateError(requestError.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="grid gap-7">
      {/* Top Header Banner */}
      <section className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">Fleet Registry</p>
          </div>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-[#082822]">
            Smart Meter Fleet Directory
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            Manage provisioning, consumer ownership, and dual-layer DB & EVM blockchain registration.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2.5 text-sm font-bold text-[#0c2b25] shadow-sm transition hover:bg-[#eef3f0]"
        >
          <RefreshCw size={15} className="text-[#007062]" />
          Refresh Fleet
        </button>
      </section>

      {/* Main Grid: Registration Form & Fleet Grid */}
      <section className="grid gap-7 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Onboarding Form Card */}
        <form onSubmit={createMeter} className="glass-panel h-fit rounded-2xl p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md shadow-[#007062]/20">
              <Plus size={22} />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-[#092b24]">Register New Meter</h3>
              <p className="text-xs text-[#5a786f]">Provisions in MongoDB & triggers on-chain tx.</p>
            </div>
          </div>

          {createError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">
              {createError}
            </div>
          ) : null}

          {createSuccess ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              <CheckCircle2 size={16} />
              {createSuccess}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
                Meter Identifier (Serial ID)
              </label>
              <input
                value={form.meterId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, meterId: event.target.value.toUpperCase() }))
                }
                required
                minLength={3}
                maxLength={64}
                placeholder="e.g. VC-MTR-025 or HOME-METER"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#d8e3dc] bg-white px-4 font-mono text-sm font-semibold text-[#092b24] shadow-sm outline-none transition focus:border-[#007062] focus:ring-4 focus:ring-[#007062]/10"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
                Consumer / Location Display Name
              </label>
              <input
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                required
                minLength={2}
                maxLength={120}
                placeholder="e.g. Sharma Household / Substation Feeder 4"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#d8e3dc] bg-white px-4 text-sm font-semibold text-[#092b24] shadow-sm outline-none transition focus:border-[#007062] focus:ring-4 focus:ring-[#007062]/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] text-sm font-bold text-white shadow-md shadow-[#007062]/25 transition hover:shadow-lg hover:shadow-[#007062]/35 disabled:opacity-60"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={15} className="animate-spin" />
                Signing Smart Contract Transaction…
              </span>
            ) : (
              <>
                <span>Provision Meter on Blockchain</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Fleet Directory List */}
        <div className="glass-panel rounded-2xl p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-[#d8e3dc] pb-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-xl font-bold text-[#092b24]">Fleet Inventory</h3>
              <p className="text-xs text-[#5a786f]">
                {filteredMeters.length} of {meters.length} smart meters visible
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-[#5a786f]">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    filterTab === 'all' ? 'bg-white text-[#007062] shadow-sm' : 'hover:text-[#092b24]'
                  }`}
                >
                  All ({meters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('confirmed')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    filterTab === 'confirmed' ? 'bg-white text-[#007062] shadow-sm' : 'hover:text-[#092b24]'
                  }`}
                >
                  On-Chain
                </button>
              </div>

              <label className="flex h-9 min-w-44 items-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-3 shadow-sm">
                <Search size={15} className="text-[#87958f]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter meter…"
                  className="w-full bg-transparent text-xs outline-none font-medium"
                />
              </label>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6">
              <LoadingState label="Synchronizing fleet state from MongoDB…" />
            </div>
          ) : error ? (
            <div className="mt-6">
              <ErrorState message={error} />
            </div>
          ) : filteredMeters.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No meters match filter"
                message="Adjust the search term or register a new smart meter above."
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredMeters.map((meter) => (
                <Link
                  key={meter.id}
                  to={`/app/meters/${meter.meterId}`}
                  className="glass-card group flex items-center justify-between rounded-xl p-4 transition-all hover:border-[#007062]/50 hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#007062] shadow-sm group-hover:bg-[#007062] group-hover:text-white transition-colors duration-200">
                      <Gauge size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-bold text-[#092b24] group-hover:text-[#007062] transition">
                          {meter.meterId}
                        </p>
                      </div>
                      <p className="truncate text-xs text-[#5a786f]">{meter.displayName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <StatusBadge value={meter.status} />
                    <StatusBadge value={meter.blockchainRegistrationStatus ?? 'confirmed'} />
                    <span className="grid size-8 place-items-center rounded-lg border border-[#d8e3dc] bg-white text-[#5a786f] transition group-hover:border-[#007062] group-hover:text-[#007062]">
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
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
