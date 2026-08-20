import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
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
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_1fr]">
      {/* Left Narrative */}
      <div className="animate-rise">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007062] shadow-sm">
          <UserRound size={15} />
          <span>New Account Registration</span>
        </div>

        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-[#082822] sm:text-5xl leading-tight">
          Join the <span className="gradient-text-emerald">VidyutChain</span> Smart Energy Network.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#456157]">
          Create an account to register smart meters, track net-metering energy imports & exports, and verify immutable blockchain audit events.
        </p>

        <div className="mt-8 space-y-3 text-xs text-[#5a786f]">
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-[#007062] font-bold">✓</span>
            <span><strong>Consumer Role:</strong> Isolated private access to your own household meters.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-[#007062] font-bold">✓</span>
            <span><strong>Admin Role:</strong> Full fleet control room visibility across the whole grid.</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel animate-rise rounded-3xl p-7 shadow-2xl shadow-emerald-950/10 sm:p-9"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md shadow-[#007062]/20">
            <UserRound size={22} className="fill-white/20" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#092b24]">Create Account</h2>
            <p className="text-xs text-[#5a786f]">Choose your role and set up access.</p>
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
                placeholder="user@vidyutchain.io"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
              Password (Min 8 Characters)
            </label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-[#d8e3dc] bg-white px-4 shadow-sm transition focus-within:border-[#007062] focus-within:ring-4 focus-within:ring-[#007062]/10">
              <Lock size={17} className="text-[#8fa79f]" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
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

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0c2b25]">
              Access Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={updateField}
              className="mt-1.5 h-12 w-full rounded-xl border border-[#d8e3dc] bg-white px-4 text-sm font-bold text-[#092b24] shadow-sm outline-none transition focus:border-[#007062] focus:ring-4 focus:ring-[#007062]/10 cursor-pointer"
            >
              <option value="consumer">👤 Consumer / Household Owner</option>
              <option value="admin">👑 Administrator (Full Grid Fleet)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] text-sm font-bold text-white shadow-lg shadow-[#007062]/25 transition-all hover:shadow-xl hover:shadow-[#007062]/35 disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create VidyutChain Account'}
          <ArrowRight size={16} />
        </button>

        <p className="mt-6 text-center text-xs text-[#5a786f]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#007062] hover:underline">
            Sign in here
          </Link>
        </p>
      </form>
    </div>
  )
}
