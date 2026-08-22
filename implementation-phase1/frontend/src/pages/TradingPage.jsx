import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Cpu,
  Flame,
  Globe,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'

export function TradingPage() {
  const { accessToken } = useAuth()
  const [listings, setListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // List Energy Modal state
  const [showListModal, setShowListModal] = useState(false)
  const [listForm, setListForm] = useState({
    meterId: 'M001',
    energyAmountKwh: 15.0,
    pricePerKwh: 3.2,
    sourceType: 'rooftop_solar',
  })
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [buyingId, setBuyingId] = useState(null)

  const fetchListings = async () => {
    if (!accessToken) return
    try {
      const data = await api.getTradingListings(accessToken)
      setListings(data.marketListings || [])
      setMyListings(data.myListings || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [accessToken])

  const requestAiPriceSuggestion = async () => {
    if (!accessToken) return
    setAiLoading(true)
    try {
      const data = await api.suggestPrice(accessToken, listForm.energyAmountKwh)
      setAiPriceSuggestion(data)
      if (data.suggestedPricePerKwh) {
        setListForm((prev) => ({ ...prev, pricePerKwh: data.suggestedPricePerKwh }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleCreateListing = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await api.listEnergy(accessToken, {
        meterId: listForm.meterId,
        energyAmountKwh: Number(listForm.energyAmountKwh),
        pricePerKwh: Number(listForm.pricePerKwh),
        sourceType: listForm.sourceType,
      })
      setSuccessMessage(data.message)
      setShowListModal(false)
      fetchListings()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBuy = async (listingId, pricePerKwh, kwh) => {
    setBuyingId(listingId)
    setError('')
    setSuccessMessage('')
    try {
      const data = await api.buyEnergy(accessToken, listingId, kwh)
      setSuccessMessage(data.message)
      fetchListings()
    } catch (err) {
      setError(err.message)
    } finally {
      setBuyingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#007062]">
          <RefreshCw className="animate-spin" size={20} />
          <span>Connecting to P2P Solar Order Book…</span>
        </div>
      </div>
    )
  }

  const totalVolume = listings.reduce((acc, l) => acc + l.remainingKwh, 0)
  const avgPrice = listings.length > 0 ? (listings.reduce((acc, l) => acc + l.pricePerKwh, 0) / listings.length).toFixed(2) : '3.20'

  return (
    <div className="animate-rise space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8e3dc] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-sm shadow-[#007062]/20">
              <ShoppingBag size={18} />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#082822]">
              P2P Solar Energy Trading Hub
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#5a786f]">
            Decentralized peer-to-peer clean power marketplace. Trade surplus rooftop solar units with automated atomic wallet settlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setShowListModal(true)
              requestAiPriceSuggestion()
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#007062] px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51] transition"
          >
            <Plus size={15} />
            <span>List Surplus Solar Power</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3.5 text-xs font-bold text-rose-900">
          {error}
        </div>
      )}

      {/* Market Statistics KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Active P2P Volume</p>
          <p className="font-display text-3xl font-extrabold text-[#082822] mt-1">{totalVolume.toFixed(1)} kWh</p>
          <span className="mt-1 block text-[10px] text-emerald-700 font-semibold">100% Rooftop Solar</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Avg Clean Tariff</p>
          <p className="font-display text-3xl font-extrabold text-[#007062] mt-1">₹{avgPrice}/kWh</p>
          <span className="mt-1 block text-[10px] text-[#5a786f]">DISCOM Grid: ₹5.50/kWh</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Settlement Finality</p>
          <p className="font-display text-3xl font-extrabold text-teal-800 mt-1">&lt;400ms</p>
          <span className="mt-1 block text-[10px] text-[#5a786f]">Solana DePIN Micro-Settlement</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Consumer Savings</p>
          <p className="font-display text-3xl font-extrabold text-[#082822] mt-1">~42%</p>
          <span className="mt-1 block text-[10px] text-emerald-700 font-semibold">vs Retail Grid Tariff</span>
        </div>
      </div>

      {/* Peer Order Book Listings */}
      <div className="glass-panel rounded-3xl p-7 border border-[#d8e3dc] shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-4">
          <div className="flex items-center gap-2">
            <Sun size={18} className="text-amber-500" />
            <h3 className="font-display text-xl font-bold text-[#092b24]">
              Active Solar Energy Order Book
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#007062] border border-emerald-200">
            {listings.length} Peer Offers Open
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5a786f]">
            No surplus solar offers right now. Click "List Surplus Solar Power" above to create an offer!
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-5 border border-[#d8e3dc] shadow-sm flex flex-col justify-between space-y-4 hover:border-[#007062]/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                      <Sun size={12} />
                      {item.sourceType === 'rooftop_solar' ? 'Rooftop Solar' : 'Microgrid'}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#0c2b25]">
                      Meter: {item.meterId}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#5a786f] uppercase">Available Energy</p>
                      <p className="font-display text-2xl font-extrabold text-[#082822]">
                        {item.remainingKwh} <span className="text-sm font-semibold text-[#5a786f]">kWh</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#5a786f] uppercase">Tariff Rate</p>
                      <p className="font-display text-2xl font-extrabold text-[#007062]">
                        ₹{item.pricePerKwh.toFixed(2)} <span className="text-xs font-normal text-[#5a786f]">/kWh</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5a786f] mt-3 truncate">
                    Seller: <span className="font-semibold text-[#092b24]">{item.sellerEmail}</span>
                  </p>
                </div>

                <div className="border-t border-[#d8e3dc] pt-3">
                  <button
                    type="button"
                    disabled={buyingId === item.id}
                    onClick={() => handleBuy(item.id, item.pricePerKwh, item.remainingKwh)}
                    className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#007062] text-xs font-extrabold text-white shadow-md hover:bg-[#005c51] transition disabled:opacity-60"
                  >
                    {buyingId === item.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <span>1-Click Buy for ₹{(item.remainingKwh * item.pricePerKwh).toFixed(2)}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* List Solar Energy Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateListing}
            className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-[#d8e3dc] space-y-6 animate-rise"
          >
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-4">
              <h3 className="font-display text-xl font-bold text-[#092b24]">List Surplus Rooftop Solar</h3>
              <button
                type="button"
                onClick={() => setShowListModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#0c2b25]">Smart Meter ID:</label>
                <input
                  type="text"
                  required
                  value={listForm.meterId}
                  onChange={(e) => setListForm({ ...listForm, meterId: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-[#d8e3dc] px-3.5 text-xs font-bold text-[#092b24] outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#0c2b25]">Surplus Energy (kWh):</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  required
                  value={listForm.energyAmountKwh}
                  onChange={(e) => setListForm({ ...listForm, energyAmountKwh: Number(e.target.value) })}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-[#d8e3dc] px-3.5 text-xs font-bold text-[#092b24] outline-none"
                />
              </div>
            </div>

            {/* AI Dynamic Price Helper Box */}
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#007062] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>AI Dynamic Tariff Engine:</span>
                </span>
                <button
                  type="button"
                  onClick={requestAiPriceSuggestion}
                  disabled={aiLoading}
                  className="text-[11px] text-[#007062] font-bold hover:underline"
                >
                  {aiLoading ? 'Recalculating…' : 'Refresh Weather AI'}
                </button>
              </div>

              {aiPriceSuggestion && (
                <div className="mt-2 text-xs text-[#092b24] space-y-1">
                  <div className="flex justify-between">
                    <span>Suggested Optimal Price:</span>
                    <span className="font-mono font-extrabold text-[#007062]">
                      ₹{aiPriceSuggestion.suggestedPricePerKwh}/kWh
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5a786f]">{aiPriceSuggestion.marketAdvice}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Price per kWh (₹ INR):</label>
              <input
                type="number"
                min="0.5"
                step="0.1"
                required
                value={listForm.pricePerKwh}
                onChange={(e) => setListForm({ ...listForm, pricePerKwh: Number(e.target.value) })}
                className="mt-1.5 h-11 w-full rounded-2xl border border-[#d8e3dc] px-3.5 text-xs font-bold text-[#092b24] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-[#007062] text-xs font-bold text-white shadow-lg hover:bg-[#005c51] transition"
            >
              Publish {listForm.energyAmountKwh} kWh Offer to P2P Marketplace
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
