import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, BatteryCharging, CircleDollarSign, LoaderCircle, Plus, RefreshCw, ShoppingCart, Store, WalletCards, Zap } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'

function FeatureUnavailable({ title, detail }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cbd9d2] bg-white/55 p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf4ef] text-[#007062]"><Store size={18} /></span>
        <div>
          <p className="text-sm font-extrabold text-[#0c2b25]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#5a786f]">{detail}</p>
        </div>
      </div>
    </div>
  )
}

export function EnergyHubPage() {
  const { accessToken } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEnergyHub = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [walletResult, listingsResult] = await Promise.all([
        api.walletSummary(accessToken),
        api.energyListings(accessToken),
      ])
      setWallet(walletResult.wallet ?? walletResult)
      setListings(listingsResult.listings ?? [])
    } catch (requestError) {
      setError(requestError.message)
      setWallet(null)
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    const frame = window.requestAnimationFrame(loadEnergyHub)
    return () => window.cancelAnimationFrame(frame)
  }, [loadEnergyHub])

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#cbd9d2] bg-gradient-to-br from-[#003831] via-[#006b5c] to-[#0ea5a0] p-7 text-white shadow-xl shadow-[#007062]/15 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border-[32px] border-white/10" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8fe0d5]/30 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b9fff2]"><Zap size={13} /> Backend-settled energy economy</div>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Energy Hub</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#d5f4ee]">Turn validated surplus generation into accountable credits and future peer-to-peer energy trades. Your account, ledger and settlement are managed by VidyutChain services.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-[#d5f4ee]">
            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">No wallet extension</span>
            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Meter-linked credits</span>
            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">Audited settlement</span>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p><strong>Energy services are not connected yet.</strong> {error}</p>
          <button type="button" onClick={loadEnergyHub} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold"><RefreshCw size={14} /> Retry</button>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Available wallet balance', value: wallet ? `${wallet.availableBalance ?? 0} VC` : '—', icon: WalletCards },
          { label: 'Pending settlement', value: wallet ? `${wallet.pendingBalance ?? 0} VC` : '—', icon: LoaderCircle },
          { label: 'Solar export credited', value: wallet ? `${wallet.exportCreditsKwh ?? 0} kWh` : '—', icon: BatteryCharging },
          { label: 'Completed trades', value: wallet ? String(wallet.completedTrades ?? 0) : '—', icon: CircleDollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[#d8e3dc] bg-white/75 p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b857d]">{label}</p><Icon size={17} className="text-[#007062]" /></div>
            <p className="mt-4 font-display text-2xl font-extrabold text-[#092b24]">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-[#d8e3dc] bg-white/75 p-6 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-[#d8e3dc] pb-5 sm:flex-row sm:items-center">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007062]">Surplus marketplace</p><h2 className="mt-2 font-display text-2xl font-extrabold text-[#092b24]">Buy or sell verified energy</h2><p className="mt-1 text-sm text-[#5a786f]">Only backend-confirmed export events can become listings.</p></div>
            <button type="button" disabled={!wallet} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007062] px-4 py-2.5 text-xs font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /> Create offer</button>
          </div>
          <div className="mt-6 space-y-3">
            {loading ? <div className="flex items-center gap-2 py-8 text-sm font-semibold text-[#5a786f]"><LoaderCircle size={18} className="animate-spin text-[#007062]" /> Loading verified offers…</div> : null}
            {!loading && listings.length === 0 ? <FeatureUnavailable title="No live offers yet" detail="Marketplace listings will appear here after the backend wallet and settlement services are enabled. No sample listings are shown." /> : null}
            {listings.map((listing) => <div key={listing.id} className="flex items-center justify-between rounded-xl border border-[#d8e3dc] bg-[#f4f7f5] p-4"><div><p className="text-sm font-extrabold text-[#092b24]">{listing.energyKwh} kWh · {listing.sellerLabel}</p><p className="mt-1 text-xs text-[#5a786f]">{listing.pricePerKwh} VC / kWh · {listing.status}</p></div><button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-[#005c51] px-3 py-2 text-xs font-bold text-white"><ShoppingCart size={14} /> Buy</button></div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8e3dc] bg-[#092b24] p-6 text-white shadow-xl sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8fe0d5]">Settlement policy</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">A ledger users can trust</h2>
          <div className="mt-6 space-y-4">
            {['Meter ownership is verified before credits are issued.', 'Every export credit gets one idempotent settlement event.', 'EVM evidence remains the audit proof; Solana can settle future marketplace value.', 'Users see status and transaction proof, never private keys or gas prompts.'].map((item, index) => <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4"><span className="font-mono text-xs font-bold text-[#8fe0d5]">0{index + 1}</span><p className="text-sm leading-5 text-[#d5f4ee]">{item}</p></div>)}
          </div>
          <button type="button" disabled={!wallet} className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#8fe0d5] disabled:opacity-50">View settlement history <ArrowUpRight size={14} /></button>
        </section>
      </div>
    </div>
  )
}
