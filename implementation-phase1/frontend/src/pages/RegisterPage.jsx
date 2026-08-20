import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: 'consumer' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const setRole = (role) => {
    setForm((current) => ({ ...current, role }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await register(form)
      navigate('/app', { replace: true })
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
        {/* Left Narrative */}
        <div className="animate-rise space-y-6">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007062] shadow-sm">
            <UserRound size={14} />
            <span>New Enterprise Provisioning</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl lg:text-6xl leading-[1.1]">
            Deploy Your <span className="gradient-text-emerald">Smart Energy</span> Node.
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-[#456157]">
            Register a new operator or prosumer account to provision smart meters, stream high-resolution waveforms, and verify cryptographic blockchain audits.
          </p>

          <div className="rounded-3xl border border-[#d8e3dc] bg-white/90 p-5 shadow-sm space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#007062]">
              Select Account Tier:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('consumer')}
                className={`p-3.5 rounded-2xl border transition-all text-left ${
                  form.role === 'consumer'
                    ? 'border-[#007062] bg-[#e6f4ef] shadow-md ring-2 ring-[#007062]/20'
                    : 'border-[#d8e3dc] bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c2b25]">👤 Consumer Tier</span>
                  {form.role === 'consumer' && <CheckCircle2 size={15} className="text-[#007062]" />}
                </div>
                <span className="mt-1 block text-[11px] text-[#5a786f]">Household solar & net-metering</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3.5 rounded-2xl border transition-all text-left ${
                  form.role === 'admin'
                    ? 'border-[#007062] bg-[#e6f4ef] shadow-md ring-2 ring-[#007062]/20'
                    : 'border-[#d8e3dc] bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c2b25]">👑 Admin Tier</span>
                  {form.role === 'admin' && <CheckCircle2 size={15} className="text-[#007062]" />}
                </div>
                <span className="mt-1 block text-[11px] text-[#5a786f]">Full grid fleet telemetry & audits</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="relative">
          <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-[#007062]/30 via-[#0ea5e9]/20 to-[#007062]/30 blur-xl opacity-70" />

          <form
            onSubmit={handleSubmit}
            className="relative glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#d8e3dc]/90 bg-white/90 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3.5 border-b border-[#d8e3dc] pb-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md shadow-[#007062]/20">
                <UserRound size={24} className="fill-white/20" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-[#092b24]">Create Account</h2>
                <p className="text-xs text-[#5a786f]">Set up your email and password</p>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">
                {error}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
                  Work Email Address
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
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
                  Password (Min 8 Characters)
                </label>
                <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#d8e3dc] bg-white px-4 shadow-sm transition focus-within:border-[#007062] focus-within:ring-4 focus-within:ring-[#007062]/10">
                  <Lock size={18} className="text-[#8fa79f]" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
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
              {isSubmitting ? 'Creating Account…' : 'Register VidyutChain Account'}
              <ArrowRight size={17} />
            </button>

            <p className="mt-6 text-center text-xs text-[#5a786f]">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#007062] hover:underline">
                Sign in to console
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
