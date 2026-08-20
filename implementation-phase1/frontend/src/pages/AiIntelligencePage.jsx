import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Radio,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'

const anomalyClasses = [
  {
    type: 'LOAD_THEFT',
    title: 'Electricity Load Theft / Unmetered Bypass',
    desc: 'Occurs when load is consumed during night hours without proportional voltage or power factor registered through standard current metering paths. The AI model flags sudden unmetered current drops and non-linear power deviations.',
    risk: '0.80 – 0.98 Risk Score',
    badge: 'Critical Anomaly',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    type: 'METER_TAMPERING',
    title: 'Hardware & Neutral Tampering',
    desc: 'Identified by abnormal voltage drops (e.g. voltage collapsing below 190V), inverted current sensors, or severe power factor degradation below 0.50 indicating magnet or phase disruption.',
    risk: '0.60 – 0.85 Risk Score',
    badge: 'Hardware Tamper',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  {
    type: 'REVERSE_ENERGY',
    title: 'Solar Reverse Energy Flow / Net-Metering',
    desc: 'Detected when active power flows in the negative direction (powerKw < 0) alongside exportKwh accumulation. Verified as legitimate rooftop solar injection into the local distribution grid.',
    risk: '0.90 – 0.99 Confidence',
    badge: 'Solar Export',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    type: 'COMMUNICATION_FAILURE',
    title: 'Edge Gateway Signal Dropout',
    desc: 'Triggered when zero readings are reported across all electrical parameters or packet latency exceeds heartbeat thresholds, signifying cellular/Wi-Fi signal loss at the edge meter.',
    risk: '0.50 – 0.70 Risk Score',
    badge: 'Outage / Loss',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    type: 'NORMAL',
    title: 'Nominal Grid Operation',
    desc: 'Standard household energy consumption within statutory voltage tolerances (230V ±6%), typical resistive/inductive loads, and optimal power factor (>0.90).',
    risk: '0.00 – 0.15 Risk Score',
    badge: 'Nominal State',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
]

export function AiIntelligencePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16 animate-rise">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-300/80 bg-amber-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-800 shadow-sm">
          <Cpu size={14} />
          <span>Machine Learning Intelligence Engine</span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl lg:text-6xl">
          Real-Time <span className="gradient-text-emerald">Electricity Theft & Anomaly Detection</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#456157]">
          FastAPI microservice trained on real STPI / UCI household power datasets to instantly classify multi-class anomalies and compute continuous risk scores with high explainability.
        </p>
      </div>

      {/* Model Benchmark Stats */}
      <div className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div className="glass-card rounded-2xl p-6 border border-[#d8e3dc]">
          <p className="font-display text-4xl font-extrabold text-[#007062]">99.5%</p>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">Model Accuracy</p>
          <p className="mt-1 text-xs text-[#5a786f]">Evaluated on test STPI split</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-[#d8e3dc]">
          <p className="font-display text-4xl font-extrabold text-[#007062]">0.9685</p>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">Macro F1-Score</p>
          <p className="mt-1 text-xs text-[#5a786f]">Balanced multi-class performance</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-[#d8e3dc]">
          <p className="font-display text-4xl font-extrabold text-emerald-700">100%</p>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">Theft Recall</p>
          <p className="mt-1 text-xs text-[#5a786f]">Zero false negatives on load theft</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-[#d8e3dc]">
          <p className="font-display text-4xl font-extrabold text-[#007062]">&lt;8ms</p>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">Inference Latency</p>
          <p className="mt-1 text-xs text-[#5a786f]">High-throughput batch evaluation</p>
        </div>
      </div>

      {/* 5 Anomaly Classes Detailed Grid */}
      <div className="mt-16">
        <div className="border-b border-[#d8e3dc] pb-5">
          <h2 className="font-display text-3xl font-extrabold text-[#082822]">
            5 Classification Modes & Physical Interpretations
          </h2>
          <p className="mt-1 text-sm text-[#4d6b61]">
            How the RandomForest and Isolation Forest models categorize incoming smart meter packets.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {anomalyClasses.map((item) => (
            <div
              key={item.type}
              className="glass-card rounded-3xl p-7 border border-[#d8e3dc] transition hover:border-[#007062]/40"
            >
              <div className="flex items-center justify-between border-b border-[#d8e3dc]/70 pb-4">
                <span className="font-mono text-sm font-bold text-[#092b24]">{item.type}</span>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#092b24]">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#4d6b61]">{item.desc}</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 font-mono text-xs font-bold text-[#007062] border border-slate-200/80">
                <ShieldAlert size={14} />
                <span>Expected Score: {item.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link to Alert Inbox */}
      <div className="mt-16 rounded-3xl border border-amber-900/10 bg-amber-50/70 p-8 sm:p-12 text-center">
        <h3 className="font-display text-3xl font-bold text-amber-950">
          Inspect Flagged Anomalies in Real-Time
        </h3>
        <p className="mt-2 text-sm text-amber-900/80 max-w-xl mx-auto">
          Open the operational AI alert inbox to review live classifications, risk distributions, and on-chain blockchain audits.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-800 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-amber-900"
          >
            <span>Open AI Alert Inbox</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
