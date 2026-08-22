import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Gavel,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'

export function TendersPage() {
  const { accessToken } = useAuth()
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: 'East Bangalore Feeder 04 Daytime Solar Procurement',
    description: 'Bulk clean energy procurement to support localized EV charging station clusters.',
    feederArea: 'Substation Feeder 04 - East Bangalore Industrial Hub',
    energyRequiredKwh: 2500,
    maxBasePricePerKwh: 3.8,
    daysOpen: 14,
  })

  const [bidModalTender, setBidModalTender] = useState(null)
  const [bidForm, setBidForm] = useState({
    bidPricePerKwh: 3.2,
    capacityOfferedKw: 250,
    bidderCompanyName: 'SunPower Microgrid Solutions Ltd.',
    deliveryTimelineDays: 5,
  })

  const fetchTenders = async () => {
    if (!accessToken) return
    try {
      const data = await api.getTenders(accessToken)
      setTenders(data.tenders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenders()
  }, [accessToken])

  const handleCreateTender = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await api.createTender(accessToken, {
        ...createForm,
        energyRequiredKwh: Number(createForm.energyRequiredKwh),
        maxBasePricePerKwh: Number(createForm.maxBasePricePerKwh),
        daysOpen: Number(createForm.daysOpen),
      })
      setSuccessMessage(data.message)
      setShowCreateModal(false)
      fetchTenders()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBidSubmit = async (e) => {
    e.preventDefault()
    if (!bidModalTender) return
    setError('')
    try {
      const data = await api.submitBid(accessToken, bidModalTender.id, {
        bidPricePerKwh: Number(bidForm.bidPricePerKwh),
        capacityOfferedKw: Number(bidForm.capacityOfferedKw),
        bidderCompanyName: bidForm.bidderCompanyName,
        deliveryTimelineDays: Number(bidForm.deliveryTimelineDays),
      })
      setSuccessMessage(data.message)
      setBidModalTender(null)
      fetchTenders()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAward = async (tenderId, bidId) => {
    setError('')
    try {
      const data = await api.awardTender(accessToken, tenderId, bidId)
      setSuccessMessage(data.message)
      fetchTenders()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#007062]">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading DISCOM Power Tenders…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8e3dc] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#007062] to-[#6366f1] text-white shadow-sm shadow-[#007062]/20">
              <Gavel size={18} />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#082822]">
              DISCOM Power Tenders & Reverse Bidding
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#5a786f]">
            Competitive bulk energy procurement for distribution feeders, microgrids, and industrial park demand response.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#007062] px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51] transition"
        >
          <Plus size={15} />
          <span>Publish Grid Energy Tender</span>
        </button>
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

      {/* Tenders Grid */}
      <div className="space-y-6">
        {tenders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#5a786f] glass-panel rounded-3xl border border-[#d8e3dc]">
            No energy tenders open right now. Click "Publish Grid Energy Tender" to open a power tender!
          </div>
        ) : (
          tenders.map((tender) => (
            <div
              key={tender.id}
              className="glass-panel rounded-3xl p-7 border border-[#d8e3dc] shadow-xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8e3dc] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-extrabold text-[#007062]">
                      {tender.tenderId}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        tender.status === 'open'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : tender.status === 'awarded'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tender.status}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#092b24] mt-1">{tender.title}</h3>
                  <p className="text-xs text-[#5a786f] mt-0.5">{tender.feederArea}</p>
                </div>

                <div className="flex items-center gap-3">
                  {tender.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => setBidModalTender(tender)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#007062] px-4 py-2 text-xs font-bold text-white hover:bg-[#005c51] transition"
                    >
                      <Coins size={14} />
                      <span>Submit Competitive Bid</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#5a786f] uppercase">Energy Required</span>
                  <p className="font-display text-lg font-extrabold text-[#0c2b25]">{tender.energyRequiredKwh} kWh</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#5a786f] uppercase">Ceiling Rate</span>
                  <p className="font-display text-lg font-extrabold text-[#007062]">₹{tender.maxBasePricePerKwh}/kWh</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#5a786f] uppercase">Bids Received</span>
                  <p className="font-display text-lg font-extrabold text-indigo-900">{tender.bidsCount} Suppliers</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#5a786f] uppercase">Deadline</span>
                  <p className="font-display text-sm font-bold text-[#0c2b25] mt-0.5">
                    {new Date(tender.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bids Breakdown Table */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0c2b25] mb-3">
                  Submitted Competitive Bids ({tender.bids.length}):
                </h4>
                {tender.bids.length === 0 ? (
                  <p className="text-xs text-[#5a786f] italic">No supplier bids received yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#d8e3dc] text-[10px] font-bold uppercase text-[#5a786f]">
                          <th className="pb-2">Supplier / Microgrid</th>
                          <th className="pb-2 text-right">Offered Rate (₹/kWh)</th>
                          <th className="pb-2 text-right">Capacity (kW)</th>
                          <th className="pb-2 text-center">Status</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d8e3dc]/50">
                        {tender.bids.map((bid) => (
                          <tr key={bid.id} className="hover:bg-slate-50">
                            <td className="py-3 font-semibold text-[#092b24]">
                              {bid.bidderCompanyName} <span className="text-[#5a786f] font-normal">({bid.bidderEmail})</span>
                            </td>
                            <td className="py-3 text-right font-mono font-extrabold text-[#007062]">
                              ₹{bid.bidPricePerKwh.toFixed(2)}/kWh
                            </td>
                            <td className="py-3 text-right font-mono text-[#0c2b25]">
                              {bid.capacityOfferedKw} kW
                            </td>
                            <td className="py-3 text-center">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                                  bid.status === 'accepted'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : bid.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {bid.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {tender.status === 'open' && (
                                <button
                                  type="button"
                                  onClick={() => handleAward(tender.id, bid.id)}
                                  className="rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition"
                                >
                                  Award Tender
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Tender Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateTender}
            className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-[#d8e3dc] space-y-4 animate-rise"
          >
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-3">
              <h3 className="font-display text-xl font-bold text-[#092b24]">Create Bulk Power Tender</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Tender Title:</label>
              <input
                type="text"
                required
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-[#d8e3dc] px-3 text-xs font-semibold text-[#092b24] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Feeder Substation Area:</label>
              <input
                type="text"
                required
                value={createForm.feederArea}
                onChange={(e) => setCreateForm({ ...createForm, feederArea: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-[#d8e3dc] px-3 text-xs font-semibold text-[#092b24] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#0c2b25]">Energy Required (kWh):</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={createForm.energyRequiredKwh}
                  onChange={(e) => setCreateForm({ ...createForm, energyRequiredKwh: Number(e.target.value) })}
                  className="mt-1 h-10 w-full rounded-xl border border-[#d8e3dc] px-3 text-xs font-semibold text-[#092b24] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#0c2b25]">Max Ceiling (₹/kWh):</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  required
                  value={createForm.maxBasePricePerKwh}
                  onChange={(e) => setCreateForm({ ...createForm, maxBasePricePerKwh: Number(e.target.value) })}
                  className="mt-1 h-10 w-full rounded-xl border border-[#d8e3dc] px-3 text-xs font-semibold text-[#092b24] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#007062] text-xs font-bold text-white shadow-lg hover:bg-[#005c51] transition mt-2"
            >
              Publish Procurement Tender On-Chain
            </button>
          </form>
        </div>
      )}

      {/* Submit Bid Modal */}
      {bidModalTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleBidSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-[#d8e3dc] space-y-4 animate-rise"
          >
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-3">
              <h3 className="font-display text-xl font-bold text-[#092b24]">Submit Competitive Bid</h3>
              <button
                type="button"
                onClick={() => setBidModalTender(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Company / Microgrid Name:</label>
              <input
                type="text"
                required
                value={bidForm.bidderCompanyName}
                onChange={(e) => setBidForm({ ...bidForm, bidderCompanyName: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-[#d8e3dc] px-3 text-xs font-semibold text-[#092b24] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#0c2b25]">Bid Rate (₹/kWh):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max={bidModalTender.maxBasePricePerKwh}
                  required
                  value={bidForm.bidPricePerKwh}
                  onChange={(e) => setBidForm({ ...bidForm, bidPricePerKwh: Number(e.target.value) })}
                  className="mt-1 h-10 w-full rounded-xl border border-[#d8e3dc] px-3 text-xs font-semibold text-[#092b24] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#0c2b25]">Offered Capacity (kW):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={bidForm.capacityOfferedKw}
                  onChange={(e) => setBidForm({ ...bidForm, capacityOfferedKw: Number(e.target.value) })}
                  className="mt-1 h-10 w-full rounded-xl border border-[#d8e3dc] px-3 text-xs font-semibold text-[#092b24] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#007062] text-xs font-bold text-white shadow-lg hover:bg-[#005c51] transition mt-2"
            >
              Submit Supplier Bid for ₹{bidForm.bidPricePerKwh}/kWh
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
