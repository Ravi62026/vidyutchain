import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound, Zap } from 'lucide-react'
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
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="animate-rise rounded-xl border border-[#d5e0da] bg-[#f8faf7]/90 p-6 shadow-2xl shadow-[#172525]/10 backdrop-blur sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-[#087a70] text-white">
            <UserRound size={22} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Create operator account</h1>
            <p className="text-sm text-[#64736e]">Authenticated access to the pilot grid</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-[#e5b7b2] bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#a43f37]">
            {error}
          </div>
        ) : null}

        <label className="mt-6 block">
          <span className="text-sm font-bold text-[#172525]">Email address</span>
          <span className="mt-2 flex items-center gap-3 rounded-lg border border-[#d5e0da] bg-white px-4 transition focus-within:border-[#087a70] focus-within:ring-4 focus-within:ring-[#087a70]/10">
            <Mail size={18} className="text-[#87958f]" />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              className="h-12 w-full bg-transparent text-sm outline-none"
              placeholder="operator@vidyutchain.in"
            />
          </span>
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-[#172525]">Password</span>
          <span className="mt-2 flex items-center gap-3 rounded-lg border border-[#d5e0da] bg-white px-4 transition focus-within:border-[#087a70] focus-within:ring-4 focus-within:ring-[#087a70]/10">
            <Lock size={18} className="text-[#87958f]" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={updateField}
              className="h-12 w-full bg-transparent text-sm outline-none"
              placeholder="Minimum 8 characters"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[#64736e]" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-[#172525]">Access role</span>
          <select
            name="role"
            value={form.role}
            onChange={updateField}
            className="mt-2 h-12 w-full rounded-lg border border-[#d5e0da] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#087a70] focus:ring-4 focus:ring-[#087a70]/10"
          >
            <option value="consumer">Consumer / operator</option>
            <option value="admin">Administrator</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#172525] text-sm font-bold text-white shadow-lg shadow-[#172525]/20 transition hover:bg-[#243737] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
        </button>

        <p className="mt-6 text-center text-sm text-[#64736e]">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#087a70] hover:text-[#08665e]">
            Sign in
          </Link>
        </p>
      </form>

      <div className="animate-rise lg:pl-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#b9d8d1] bg-[#e7f4f1] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#087a70]">
          <ShieldCheck size={15} />
          Role-based access
        </div>
        <h2 className="mt-6 font-display text-5xl font-bold tracking-[-0.04em] text-[#172525]">Provision access for the pilot grid.</h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-[#64736e]">
          Registration creates a real backend user through the Node.js API. The returned JWT is stored locally and restored securely for protected dashboard routes.
        </p>
        <div className="mt-8 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/80 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-[#172525] text-[#eef3f0]">
              <Zap size={19} />
            </span>
            <div>
              <p className="font-display font-bold">VidyutChain access boundary</p>
              <p className="text-sm text-[#64736e]">Frontend → Node.js API → AI, MongoDB and blockchain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

