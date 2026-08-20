import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export function BlockchainAuditPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16 animate-rise">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-300/80 bg-teal-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-teal-800 shadow-sm">
          <Blocks size={14} />
          <span>Cryptographic Audit & Anti-Tamper System</span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl lg:text-6xl">
          Zero-Knowledge <span className="gradient-text-emerald">Blockchain Audit Trail</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#456157]">
          VidyutChain uses a hash-only Ethereum smart contract architecture to provide mathematically verifiable, tamper-evident audit records without storing sensitive raw consumer energy readings on-chain.
        </p>
      </div>

      {/* 3 Core Blockchain Rules */}
      <div className="mt-14 grid gap-7 md:grid-cols-3">
        <div className="glass-card rounded-3xl p-8 border border-[#d8e3dc]">
          <span className="grid size-12 place-items-center rounded-2xl bg-teal-500/10 text-teal-800 font-mono font-bold text-sm">
            01
          </span>
          <h3 className="mt-5 font-display text-xl font-bold text-[#092b24]">Zero Raw Telemetry On-Chain</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#4d6b61]">
            Raw voltage, current, and household consumption stay securely inside the operational database. Only cryptographic 32-byte Keccak-256 hashes are anchored into Ethereum blocks.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-[#d8e3dc]">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-800 font-mono font-bold text-sm">
            02
          </span>
          <h3 className="mt-5 font-display text-xl font-bold text-[#092b24]">Instant Tamper Detection</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#4d6b61]">
            When verifying an audit event, the backend reconstructs and recalculates the SHA3/Keccak-256 hash. If even a single byte of kWh or voltage is altered, on-chain verification returns false.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-[#d8e3dc]">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-800 font-mono font-bold text-sm">
            03
          </span>
          <h3 className="mt-5 font-display text-xl font-bold text-[#092b24]">Serialized Nonce Relayer</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#4d6b61]">
            To prevent Ethereum transaction nonce collisions during high-frequency telemetry spikes, the backend executes blockchain writes through a serialized, atomic promise queue.
          </p>
        </div>
      </div>

      {/* Contract Interface Breakdown */}
      <div className="mt-16 glass-panel rounded-3xl p-8 sm:p-10 border border-[#d8e3dc]">
        <div className="flex flex-col justify-between gap-4 border-b border-[#d8e3dc] pb-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#092b24]">
              Solidity Smart Contract (EnergyAudit.sol)
            </h2>
            <p className="text-xs text-[#5a786f]">EVM Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
            Solidity 0.8.26
          </span>
        </div>

        <div className="mt-6 space-y-4 font-mono text-xs">
          <div className="rounded-2xl bg-slate-900 text-slate-100 p-5 overflow-x-auto">
            <p className="text-emerald-400 font-bold">// 1. Register smart meter on-chain</p>
            <p className="mt-1 text-slate-300">function registerMeter(bytes32 meterIdHash) external onlyOwner;</p>

            <p className="mt-4 text-emerald-400 font-bold">// 2. Anchor AI anomaly event digest</p>
            <p className="mt-1 text-slate-300">function logAuditEvent(bytes32 meterIdHash, bytes32 payloadHash, string calldata eventType, uint256 timestamp) external returns (bytes32 eventId);</p>

            <p className="mt-4 text-emerald-400 font-bold">// 3. Verify cryptographic integrity against ledger</p>
            <p className="mt-1 text-slate-300">function verifyAuditEvent(bytes32 eventId, bytes32 payloadHash) external view returns (bool exists, bool verified);</p>
          </div>
        </div>
      </div>

      {/* CTA to live audit trail */}
      <div className="mt-16 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#007062]/25 transition hover:scale-105"
        >
          <span>Open Live Blockchain Audit Explorer</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
