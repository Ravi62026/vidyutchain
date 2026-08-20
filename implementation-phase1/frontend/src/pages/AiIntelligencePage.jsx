import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  Gauge,
  HelpCircle,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Wrench,
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

const testPresets = [
  {
    name: '⚡ Night Load Theft Bypass',
    desc: 'Unmetered consumption deviation at 2:00 AM',
    values: { voltage: 216.4, current: 0.15, powerKw: 0.03, powerFactor: 0.42, importKwh: 0.008, exportKwh: 0, hour: 2 },
  },
  {
    name: '🧲 Magnet / Hardware Tampering',
    desc: 'Severe voltage collapse (<180V) & low PF',
    values: { voltage: 172.5, current: 2.1, powerKw: 0.22, powerFactor: 0.35, importKwh: 0.05, exportKwh: 0, hour: 20 },
  },
  {
    name: '☀️ Solar Rooftop Feed-In',
    desc: 'Reverse active power flow (-2.8 kW)',
    values: { voltage: 236.0, current: 12.5, powerKw: -2.8, powerFactor: 0.98, importKwh: 0.0, exportKwh: 4.8, hour: 13 },
  },
  {
    name: '📶 Gateway Signal Dropout',
    desc: 'Zero sensors reading & missing telemetry',
    values: { voltage: 0, current: 0, powerKw: 0, powerFactor: 0, importKwh: 0, exportKwh: 0, hour: 16 },
  },
  {
    name: '🟢 Standard Nominal Load',
    desc: 'Balanced 230V residential consumption',
    values: { voltage: 231.8, current: 8.2, powerKw: 1.85, powerFactor: 0.96, importKwh: 0.45, exportKwh: 0, hour: 15 },
  },
]

export function AiIntelligencePage() {
  const [params, setParams] = useState(testPresets[0].values)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0)

  const handleInputChange = (field, value) => {
    setParams((prev) => ({ ...prev, [field]: Number(value) }))
    setSelectedPresetIndex(-1)
  }

  const applyPreset = (index) => {
    setSelectedPresetIndex(index)
    setParams(testPresets[index].values)
  }

  const runPrediction = async (currentParams = params) => {
    setLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const response = await fetch(`${apiBase}/api/telemetry/simulate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentParams),
      })
      const result = await response.json()
      if (result.prediction) {
        setPrediction(result.prediction)
      }
    } catch (err) {
      console.error('AI simulation call failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runPrediction(params)
  }, [params])

  const getRiskColor = (score) => {
    if (score >= 0.75) return 'from-rose-500 to-red-600 text-rose-800 bg-rose-50 border-rose-200'
    if (score >= 0.4) return 'from-amber-500 to-orange-500 text-amber-900 bg-amber-50 border-amber-200'
    return 'from-emerald-500 to-teal-500 text-emerald-800 bg-emerald-50 border-emerald-200'
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16 animate-rise space-y-16">
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
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
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

      {/* 🧪 INTERACTIVE AI PREDICTION PLAYGROUND (NEW) */}
      <section className="glass-panel rounded-3xl p-7 sm:p-10 border border-[#d8e3dc] shadow-2xl space-y-8 bg-white/95">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8e3dc] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#007062]" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
                Interactive AI Diagnosis Sandbox
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#092b24]">
              Live Smart Meter Telemetry Simulator
            </h2>
            <p className="text-xs text-[#5a786f] mt-1">
              Adjust voltage, current, power factor, or time of day to see how the trained Random Forest model predicts in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => runPrediction()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#007062] px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51] transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Evaluating…' : 'Re-Evaluate AI Model'}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Scenario Preset Buttons */}
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#0c2b25] mb-3">
            Quick 1-Click Anomaly Test Scenarios:
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {testPresets.map((preset, idx) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(idx)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPresetIndex === idx
                    ? 'border-[#007062] bg-[#e6f4ef] shadow-md ring-2 ring-[#007062]/20 font-bold'
                    : 'border-[#d8e3dc] bg-slate-50/80 hover:bg-white hover:border-[#007062]/40'
                }`}
              >
                <p className="text-xs font-bold text-[#0c2b25] truncate">{preset.name}</p>
                <p className="text-[10px] text-[#5a786f] mt-1 line-clamp-1">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders and Live Result Split */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Inputs / Sliders */}
          <div className="space-y-5 rounded-2xl bg-slate-50/70 p-6 border border-[#d8e3dc]">
            <h3 className="font-display text-base font-bold text-[#0c2b25] flex items-center gap-2">
              <Sliders size={16} className="text-[#007062]" />
              <span>Sensor Parameters Input</span>
            </h3>

            {/* Voltage Slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0c2b25]">RMS Voltage (V):</span>
                <span className="font-mono font-bold text-[#007062]">{params.voltage} V</span>
              </div>
              <input
                type="range"
                min="0"
                max="280"
                step="0.5"
                value={params.voltage}
                onChange={(e) => handleInputChange('voltage', e.target.value)}
                className="mt-1.5 w-full accent-[#007062] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7a958c]">
                <span>0V (Dropout)</span>
                <span>180V (Low)</span>
                <span className="font-bold text-emerald-800">230V (Nominal)</span>
                <span>280V (High)</span>
              </div>
            </div>

            {/* Current Slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0c2b25]">Load Current (A):</span>
                <span className="font-mono font-bold text-[#007062]">{params.current} A</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="0.1"
                value={params.current}
                onChange={(e) => handleInputChange('current', e.target.value)}
                className="mt-1.5 w-full accent-[#007062] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7a958c]">
                <span>0.0 A</span>
                <span>15.0 A</span>
                <span>30.0 A</span>
                <span>40.0 A</span>
              </div>
            </div>

            {/* Active Power kW Slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0c2b25]">Active Power (kW):</span>
                <span className="font-mono font-bold text-[#007062]">{params.powerKw} kW</span>
              </div>
              <input
                type="range"
                min="-5"
                max="10"
                step="0.05"
                value={params.powerKw}
                onChange={(e) => handleInputChange('powerKw', e.target.value)}
                className="mt-1.5 w-full accent-[#007062] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7a958c]">
                <span className="text-cyan-700 font-bold">-5.0 kW (Solar Export)</span>
                <span>0.0 kW</span>
                <span>5.0 kW</span>
                <span>10.0 kW</span>
              </div>
            </div>

            {/* Power Factor Slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0c2b25]">Power Factor (Cos φ):</span>
                <span className="font-mono font-bold text-[#007062]">{params.powerFactor}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.powerFactor}
                onChange={(e) => handleInputChange('powerFactor', e.target.value)}
                className="mt-1.5 w-full accent-[#007062] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7a958c]">
                <span className="text-amber-800 font-bold">&lt; 0.50 (Tampering)</span>
                <span>0.75</span>
                <span className="font-bold text-emerald-800">&gt; 0.90 (Optimal)</span>
                <span>1.00 Unity</span>
              </div>
            </div>

            {/* Time of Day Slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0c2b25] flex items-center gap-1.5">
                  <Clock size={13} className="text-[#007062]" />
                  <span>Time of Day:</span>
                </span>
                <span className="font-mono font-bold text-[#007062]">{params.hour}:00 hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                step="1"
                value={params.hour}
                onChange={(e) => handleInputChange('hour', e.target.value)}
                className="mt-1.5 w-full accent-[#007062] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7a958c]">
                <span className="text-rose-800 font-bold">0:00 (Night Bypass Window)</span>
                <span>12:00 (Noon Solar)</span>
                <span>20:00 (Peak Load)</span>
                <span>23:00</span>
              </div>
            </div>
          </div>

          {/* Right Live AI Inference Output Panel */}
          <div className="flex flex-col justify-between rounded-2xl bg-white p-6 border border-[#d8e3dc] shadow-md">
            <div>
              <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
                  Live Prediction Output
                </span>
                <span className="font-mono text-[10px] font-bold text-[#6b857d]">
                  Model: rf-stpi-v1
                </span>
              </div>

              {prediction ? (
                <div className="mt-5 space-y-5">
                  {/* Class Badge */}
                  <div>
                    <span className="text-[11px] font-bold text-[#5a786f] uppercase tracking-wider">
                      Detected Anomaly Classification:
                    </span>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-extrabold uppercase tracking-wider shadow-sm ${
                          prediction.anomalyType === 'LOAD_THEFT'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : prediction.anomalyType === 'METER_TAMPERING'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : prediction.anomalyType === 'REVERSE_ENERGY'
                            ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                            : prediction.anomalyType === 'COMMUNICATION_FAILURE'
                            ? 'bg-slate-200 text-slate-900 border-slate-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        <span className="size-2 rounded-full bg-current animate-ping" />
                        {prediction.anomalyType}
                      </span>
                    </div>
                  </div>

                  {/* Risk Score Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#0c2b25]">AI Theft / Risk Probability:</span>
                      <span className="font-mono text-sm font-extrabold text-[#007062]">
                        {(prediction.riskScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getRiskColor(
                          prediction.riskScore
                        )}`}
                        style={{ width: `${Math.max(4, prediction.riskScore * 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-[#7a958c]">
                      <span>0% Nominal</span>
                      <span>50% Warning</span>
                      <span>100% Critical Theft</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#4d6b61]">Random Forest Confidence:</span>
                      <span className="font-mono font-bold text-[#007062]">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Reasons Explanation */}
                  <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/60 p-4">
                    <p className="text-xs font-bold text-[#007062] flex items-center gap-1.5">
                      <HelpCircle size={14} />
                      <span>Model Feature Explainability:</span>
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-[#092b24]">
                      {prediction.reasons?.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#007062] font-bold">•</span>
                          <span className="capitalize">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#6a877e]">
                  Loading AI evaluation…
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-[#d8e3dc] pt-4 text-[11px] text-[#6a877e] flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                <CheckCircle2 size={13} />
                Live Sub-8ms Inference
              </span>
              <span className="font-mono">Port 8000 (FastAPI)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual System Architecture Diagram */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#d8e3dc] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8e3dc] pb-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-[#092b24]">
              Visual Machine Learning & Pipeline Flow
            </h3>
            <p className="text-xs text-[#5a786f]">
              End-to-end data flow from smart meter sampling to 5-class anomaly inference and on-chain verification.
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
            Pipeline Architecture
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#d8e3dc] shadow-inner bg-white">
          <img
            src="/ai_architecture_flow.jpg"
            alt="VidyutChain AI Energy Platform Architecture"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>

      {/* 5 Anomaly Classes Detailed Grid */}
      <div>
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
      <div className="rounded-3xl border border-amber-900/10 bg-amber-50/70 p-8 sm:p-12 text-center">
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
