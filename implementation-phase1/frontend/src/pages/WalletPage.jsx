import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Blocks,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  Flame,
  HelpCircle,
  History,
  Landmark,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'

export function WalletPage() {
  const { accessToken } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedSolana, setCopiedSolana] = useState(false)
  const [copiedEth, setCopiedEth] = useState(false)

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState(1000)
  const [withdrawAmount, setWithdrawAmount] = useState(500)
  const [withdrawUpi, setWithdrawUpi] = useState('user@oksbi')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')

  const fetchWallet = async () => {
    if (!accessToken) return
    try {
      const data = await api.getWallet(accessToken)
      setWallet(data.wallet)
      setTransactions(data.transactions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallet()
  }, [accessToken])

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'solana') {
      setCopiedSolana(true)
      setTimeout(() => setCopiedSolana(false), 2000)
    } else {
      setCopiedEth(true)
      setTimeout(() => setCopiedEth(false), 2000)
    }
  }

  const toggleAutoSettle = async () => {
    if (!wallet || !accessToken) return
    try {
      const data = await api.toggleAutoSettle(accessToken, !wallet.autoSettleEnabled)
      setWallet((prev) => ({ ...prev, autoSettleEnabled: data.autoSettleEnabled }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setActionSuccess('')
    try {
      const data = await api.depositWallet(accessToken, { amountInr: Number(depositAmount) })
      setActionSuccess(data.message)
      setShowDepositModal(false)
      fetchWallet()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setActionSuccess('')
    try {
      const data = await api.withdrawWallet(accessToken, {
        amountInr: Number(withdrawAmount),
        payoutUpiId: withdrawUpi,
      })
      setActionSuccess(data.message)
      setShowWithdrawModal(false)
      fetchWallet()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#007062]">
          <RefreshCw className="animate-spin" size={20} />
          <span>Syncing Dual-Vault Smart Wallet…</span>
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
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-sm shadow-[#007062]/20">
              <Wallet size={18} />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#082822]">
              Smart Energy Wallet
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#5a786f]">
            Custodial multi-chain energy account with real-time solar feed-in auto-credits and instant P2P settlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#007062] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51] transition"
          >
            <Plus size={15} />
            <span>Add Money (Top-Up)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8e3dc] bg-white px-4 py-2.5 text-xs font-bold text-[#0c2b25] shadow-sm hover:bg-slate-50 transition"
          >
            <Landmark size={15} />
            <span>Withdraw to UPI</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Balance Hero & Dual Vault Card */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Balance Card */}
        <div className="glass-panel rounded-3xl p-7 border border-[#d8e3dc] shadow-xl relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#007062]">
              <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
              Live Account Balance
            </span>
            <span className="font-mono text-xs text-[#5a786f]">1 Vidyut Credit = ₹1.00 INR</span>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold text-[#5a786f] uppercase tracking-wider">Total Available Funds</p>
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold text-[#082822] tracking-tight mt-1">
              ₹{wallet?.balanceInr?.toFixed(2)}
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#d8e3dc] pt-6">
            <div>
              <p className="text-[11px] font-bold text-[#5a786f] uppercase flex items-center gap-1">
                <Sun size={13} className="text-amber-500" />
                <span>Solar Export Earnings</span>
              </p>
              <p className="font-display text-xl font-extrabold text-[#007062] mt-0.5">
                ₹{wallet?.totalSolarEarningsInr?.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#5a786f] uppercase flex items-center gap-1">
                <Flame size={13} className="text-teal-600" />
                <span>CO₂ Offset Certified</span>
              </p>
              <p className="font-display text-xl font-extrabold text-teal-800 mt-0.5">
                {wallet?.totalCarbonOffsetKg?.toFixed(2)} kg
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Settle Mandate & Multi-Chain ID Card */}
        <div className="glass-panel rounded-3xl p-7 border border-[#d8e3dc] shadow-xl flex flex-col justify-between space-y-6">
          {/* Auto-Settle Switch */}
          <div className="rounded-2xl border border-emerald-200 bg-[#eaf6f1] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-base font-bold text-[#0c2b25] flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#007062]" />
                  <span>Smart Auto-Settle Mandate</span>
                </p>
                <p className="text-[11px] text-[#4d6b61] mt-1">
                  Auto-credit ₹{wallet?.feedInTariffRateInr}/kWh whenever smart meter exports power.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleAutoSettle}
                className="text-[#007062] hover:opacity-80 transition"
              >
                {wallet?.autoSettleEnabled ? (
                  <ToggleRight size={36} className="text-[#007062]" />
                ) : (
                  <ToggleLeft size={36} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Dual-Vault Blockchain Addresses */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
              Custodial DePIN Vault Identifiers:
            </p>

            {/* Solana Address */}
            <div className="rounded-2xl border border-[#d8e3dc] bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#0c2b25] flex items-center gap-1">
                  <span className="size-2 rounded-full bg-cyan-500" />
                  Solana DePIN Address (P2P Settlements)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(wallet?.solanaPublicKey, 'solana')}
                  className="text-xs text-[#007062] hover:underline flex items-center gap-1 font-bold"
                >
                  <Copy size={12} />
                  <span>{copiedSolana ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="mt-1 font-mono text-[11px] text-[#5a786f] truncate">
                {wallet?.solanaPublicKey}
              </p>
            </div>

            {/* Ethereum Address */}
            <div className="rounded-2xl border border-[#d8e3dc] bg-white p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#0c2b25] flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  EVM Regulatory Audit Address
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(wallet?.ethereumAddress, 'eth')}
                  className="text-xs text-[#007062] hover:underline flex items-center gap-1 font-bold"
                >
                  <Copy size={12} />
                  <span>{copiedEth ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="mt-1 font-mono text-[11px] text-[#5a786f] truncate">
                {wallet?.ethereumAddress}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Passbook Transaction History Table */}
      <div className="glass-panel rounded-3xl p-7 sm:p-8 border border-[#d8e3dc] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8e3dc] pb-5">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#007062]" />
            <h3 className="font-display text-xl font-bold text-[#092b24]">
              Wallet Passbook & Transaction Ledger
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-[#007062]">
            {transactions.length} Verified Entries
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#d8e3dc] text-[11px] font-extrabold uppercase tracking-wider text-[#5a786f]">
                <th className="pb-3 pl-2">Timestamp</th>
                <th className="pb-3">Transaction Type</th>
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Energy (kWh)</th>
                <th className="pb-3 text-right">Amount (₹)</th>
                <th className="pb-3 text-right pr-2">Solana Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8e3dc]/60">
              {transactions.map((tx) => {
                const isCredit = tx.amountInr > 0
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pl-2 font-mono text-[11px] text-[#5a786f]">
                      {new Date(tx.createdAt).toLocaleDateString()}{' '}
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          tx.type === 'SOLAR_EXPORT_CREDIT'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : tx.type === 'P2P_BUY_DEBIT'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : tx.type === 'P2P_SELL_CREDIT'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-[#092b24] max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-[#0c2b25]">
                      {tx.energyKwh > 0 ? `${tx.energyKwh} kWh` : '—'}
                    </td>
                    <td className={`py-3.5 text-right font-mono text-sm font-extrabold ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isCredit ? `+₹${tx.amountInr.toFixed(2)}` : `-₹${Math.abs(tx.amountInr).toFixed(2)}`}
                    </td>
                    <td className="py-3.5 text-right pr-2 font-mono text-[10px] text-[#6b857d]">
                      {tx.solanaTxSignature ? `${tx.solanaTxSignature.slice(0, 12)}…` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Top-Up Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleDeposit}
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-[#d8e3dc] space-y-6 animate-rise"
          >
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-4">
              <h3 className="font-display text-xl font-bold text-[#092b24]">Top-Up Wallet Funds</h3>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Select Preset Amount:</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      depositAmount === amt
                        ? 'border-[#007062] bg-emerald-50 text-[#007062] ring-2 ring-[#007062]/20'
                        : 'border-[#d8e3dc] bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Custom Amount (₹ INR):</label>
              <input
                type="number"
                min="10"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="mt-1.5 h-12 w-full rounded-2xl border border-[#d8e3dc] px-4 text-sm font-bold text-[#092b24] outline-none focus:border-[#007062]"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full h-12 rounded-2xl bg-[#007062] text-sm font-bold text-white shadow-lg hover:bg-[#005c51] transition"
            >
              {actionLoading ? 'Processing Top-Up…' : `Confirm ₹${depositAmount} Instant Deposit`}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleWithdraw}
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-[#d8e3dc] space-y-6 animate-rise"
          >
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-4">
              <h3 className="font-display text-xl font-bold text-[#092b24]">Withdraw Solar Earnings</h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Withdrawal Amount (₹ INR):</label>
              <input
                type="number"
                min="10"
                max={wallet?.balanceInr || 1000}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="mt-1.5 h-12 w-full rounded-2xl border border-[#d8e3dc] px-4 text-sm font-bold text-[#092b24] outline-none focus:border-[#007062]"
              />
              <p className="text-[11px] text-[#5a786f] mt-1">Available: ₹{wallet?.balanceInr?.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0c2b25]">Receiving UPI ID / Bank VPA:</label>
              <input
                type="text"
                value={withdrawUpi}
                onChange={(e) => setWithdrawUpi(e.target.value)}
                placeholder="e.g. user@oksbi"
                className="mt-1.5 h-12 w-full rounded-2xl border border-[#d8e3dc] px-4 text-sm font-bold text-[#092b24] outline-none focus:border-[#007062]"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full h-12 rounded-2xl bg-[#007062] text-sm font-bold text-white shadow-lg hover:bg-[#005c51] transition"
            >
              {actionLoading ? 'Processing Payout…' : `Confirm ₹${withdrawAmount} UPI Transfer`}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
