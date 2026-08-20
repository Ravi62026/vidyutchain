import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Blocks,
  Cpu,
  Database,
  Eye,
  EyeOff,
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
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const fillAdmin = () => {
    setForm({ email: 'admin@vidyutchain.io', password: 'AdminDemoPassword123!' })
  }

  const fillConsumer = () => {
    setForm({ email: 'consumer@vidyutchain.io', password: 'ConsumerDemo123!' })
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
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_1fr]">
      {/* Left Column Narrative */}
      <div className="animate-rise">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007062] shadow-sm">
          <ShieldCheck size={15} />
          <span>Operator & Consumer Portal</span>
        </div>

        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl leading-tight">
          Sign In to the <span className="gradient-text-emerald">VidyutChain</span> Control Plane.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#456157]">
          Access live telemetry feeds, ML power theft detection radars, and blockchain audit integrity reports through the authenticated API boundary.
        </p>

        {/* Quick Fill Demo Helper Card */}
        <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#007062]">
            <KeyRound size={16} />
            <span>Quick Auto-Fill Demo Accounts:</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={fillAdmin}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8e3dc] bg-[#eaf4ef] px-3.5 py-2 text-xs font-bold text-[#005c51] transition hover:bg-[#005c51] hover:text-white"
            >
              👑 Fill Admin (Full Fleet)
            </button>
            <button
              type="button"
              onClick={fillConsumer}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8e3dc] bg-[#f4f7f5] px-3.5 py-2 text-xs font-bold text-[#4d6b61] transition hover:bg-[#4d6b61] hover:text-white"
            >
              👤 Fill Consumer (Household)
            </button>
          </div>
        </div>
      </div>

      {/* Right Column Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel animate-rise rounded-3xl p-7 shadow-2xl shadow-emerald-950/10 sm:p-9"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md shadow-[#007062]/20">
            <Zap size={22} className="fill-white/20" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#092b24]">Account Sign In</h2>
            <p className="text-xs text-[#5a786f]">Enter your credentials or click auto-fill above.</p>
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
              Email Address
            </label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-[#d8e3dc] bg-white px-4 shadow-sm transition focus-within:border-[#007062] focus-within:ring-4 focus-within:ring-[#007062]/10">
              <Mail size={17} className="text-[#8fa79f]" />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={updateField}
                className="h-12 w-full bg-transparent text-sm font-medium text-[#092b24] outline-none"
                placeholder="admin@vidyutchain.io"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
              Password
            </label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-[#d8e3dc] bg-white px-4 shadow-sm transition focus-within:border-[#007062] focus-within:ring-4 focus-within:ring-[#007062]/10">
              <Lock size={17} className="text-[#8fa79f]" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="current-password"
                value={form.password}
                onChange={updateField}
                className="h-12 w-full bg-transparent text-sm font-medium text-[#092b24] outline-none"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[#6a877e] hover:text-[#007062]"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] text-sm font-bold text-white shadow-lg shadow-[#007062]/25 transition-all hover:shadow-xl hover:shadow-[#007062]/35 disabled:opacity-60"
        >
          {isSubmitting ? 'Authenticating…' : 'Sign in to Console'}
          <ArrowRight size={16} />
        </button>

        <p className="mt-6 text-center text-xs text-[#5a786f]">
          Need an account?{' '}
          <Link to="/register" className="font-bold text-[#007062] hover:underline">
            Create new account
          </Link>
        </p>
      </form>
    </div>
  )
}
