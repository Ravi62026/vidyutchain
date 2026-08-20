import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: 'admin@vidyutchain.io', password: 'AdminDemoPassword123!' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeRole, setActiveRole] = useState('admin')

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const selectRole = (role) => {
    setActiveRole(role)
    if (role === 'admin') {
      setForm({ email: 'admin@vidyutchain.io', password: 'AdminDemoPassword123!' })
    } else {
      setForm({ email: 'consumer@vidyutchain.io', password: 'ConsumerDemo123!' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(form)
      navigate(location.state?.from ?? '/app', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background ambient glowing orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 -z-10 size-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 -z-10 size-96 rounded-full bg-teal-400/15 blur-3xl" />

      <div className="mx-auto grid max-w-6xl w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Interactive Narrative Showcase */}
        <div className="animate-rise space-y-6">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007062] shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <span>Substation Secure Gateway</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl lg:text-6xl leading-[1.1]">
            Control Center & <span className="gradient-text-emerald">Grid Intelligence</span>.
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-[#456157]">
            Sign in to inspect real-time waveforms, verify AI theft classifications, and validate immutable Keccak-256 blockchain audits.
          </p>

          {/* Role Quick Switcher Pills */}
          <div className="rounded-3xl border border-[#d8e3dc] bg-white/90 p-5 shadow-sm space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#007062] flex items-center gap-2">
              <KeyRound size={15} />
              <span>Select Access Role to Auto-Fill Credentials:</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => selectRole('admin')}
                className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all text-left ${
                  activeRole === 'admin'
                    ? 'border-[#007062] bg-[#e6f4ef] shadow-md ring-2 ring-[#007062]/20'
                    : 'border-[#d8e3dc] bg-slate-50/70 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-[#0c2b25]">👑 DISCOM Admin</span>
                  {activeRole === 'admin' && <CheckCircle2 size={15} className="text-[#007062]" />}
                </div>
                <span className="mt-1 text-[11px] text-[#5a786f]">Full fleet control room & alerts</span>
              </button>

              <button
                type="button"
                onClick={() => selectRole('consumer')}
                className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all text-left ${
                  activeRole === 'consumer'
                    ? 'border-[#007062] bg-[#e6f4ef] shadow-md ring-2 ring-[#007062]/20'
                    : 'border-[#d8e3dc] bg-slate-50/70 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-[#0c2b25]">👤 Solar Prosumer</span>
                  {activeRole === 'consumer' && <CheckCircle2 size={15} className="text-[#007062]" />}
                </div>
                <span className="mt-1 text-[11px] text-[#5a786f]">Household net metering & bills</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2 text-xs font-semibold text-[#5a786f]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-700" />
              HMAC-SHA256 JWT
            </span>
            <span className="flex items-center gap-1.5">
              <Blocks size={16} className="text-teal-700" />
              Hardhat EVM Verified
            </span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="relative">
          <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-[#007062]/30 via-[#0ea5e9]/20 to-[#007062]/30 blur-xl opacity-70" />

          <form
            onSubmit={handleSubmit}
            className="relative glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#d8e3dc]/90 bg-white/90 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-6">
              <div className="flex items-center gap-3.5">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md shadow-[#007062]/20">
                  <Zap size={24} className="fill-white/20" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#092b24]">Sign In</h2>
                  <p className="text-xs text-[#5a786f]">Enter your credentials to continue</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                {activeRole}
              </span>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">
                {error}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
                  Work Email
                </label>
                <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#d8e3dc] bg-white px-4 shadow-sm transition focus-within:border-[#007062] focus-within:ring-4 focus-within:ring-[#007062]/10">
                  <Mail size={18} className="text-[#8fa79f]" />
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={updateField}
                    className="h-12 w-full bg-transparent text-sm font-semibold text-[#092b24] outline-none"
                    placeholder="user@vidyutchain.io"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
                    Password
                  </label>
                </div>
                <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#d8e3dc] bg-white px-4 shadow-sm transition focus-within:border-[#007062] focus-within:ring-4 focus-within:ring-[#007062]/10">
                  <Lock size={18} className="text-[#8fa79f]" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={updateField}
                    className="h-12 w-full bg-transparent text-sm font-semibold text-[#092b24] outline-none"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-[#6a877e] hover:text-[#007062]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#007062] to-[#005c51] text-sm font-extrabold text-white shadow-xl shadow-[#007062]/25 transition-all hover:shadow-2xl hover:shadow-[#007062]/35 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {isSubmitting ? 'Authenticating Session…' : 'Sign In to Command Console'}
              <ArrowRight size={17} />
            </button>

            <p className="mt-6 text-center text-xs text-[#5a786f]">
              Need a new account?{' '}
              <Link to="/register" className="font-bold text-[#007062] hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
