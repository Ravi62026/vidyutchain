import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Blocks,
  Cpu,
  Layers,
  Menu,
  Radio,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'

const navLinks = [
  { label: 'Platform', href: '/platform' },
  { label: 'Architecture', href: '/architecture' },
  { label: 'AI Intelligence', href: '/ai-intelligence' },
  { label: 'Blockchain Audit', href: '/blockchain-audit' },
]

export function PublicLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#111e1e] flex flex-col">
      {/* Floating Modern Header */}
      <div className="sticky top-0 z-50 px-4 pt-3 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-7xl rounded-2xl border border-[#d8e3dc]/90 bg-white/85 px-4 sm:px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link to="/" className="group flex items-center gap-3">
              <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#007062] via-[#008f7d] to-[#0ea5e9] text-white shadow-md shadow-[#007062]/20 transition-transform duration-300 group-hover:scale-105">
                <Zap size={20} className="fill-white/20" />
              </span>
              <div>
                <span className="block font-display text-lg font-extrabold tracking-tight text-[#003831]">
                  Vidyut<span className="text-[#008f7d]">Chain</span>
                </span>
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#6b857d]">
                  Smart Grid & Blockchain OS
                </span>
              </div>
            </Link>

            {/* Middle Nav Links */}
            <nav className="hidden items-center gap-1 rounded-xl bg-[#f4f7f5]/80 p-1 lg:flex border border-[#d8e3dc]/60">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  className={({ isActive }) => [
                    'rounded-lg px-3.5 py-1.5 text-xs font-bold transition',
                    isActive
                      ? 'bg-white text-[#007062] shadow-sm font-extrabold'
                      : 'text-[#4d6b61] hover:bg-white/70 hover:text-[#003831]',
                  ].join(' ')}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Status & Action Buttons */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[11px] font-extrabold text-emerald-800 shadow-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
                </span>
                <span>Grid Online</span>
              </div>

              {user ? (
                <Link
                  to="/app"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] px-4.5 py-2 text-xs font-extrabold text-white shadow-md shadow-[#007062]/25 transition hover:shadow-lg hover:shadow-[#007062]/35 hover:-translate-y-0.5"
                >
                  <Sparkles size={13} className="text-[#38e8cb]" />
                  Command Center
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="rounded-xl px-4 py-2 text-xs font-bold text-[#355249] transition hover:bg-[#e6efe9] hover:text-[#003831]"
                  >
                    Sign In
                  </NavLink>

                  <NavLink
                    to="/login"
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#007062] to-[#005c51] px-4.5 py-2 text-xs font-extrabold text-white shadow-md shadow-[#007062]/25 transition hover:shadow-lg hover:shadow-[#007062]/35 hover:-translate-y-0.5"
                  >
                    Launch Console
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile Toggle Button */}
            <button
              type="button"
              className="grid size-9 place-items-center rounded-xl border border-[#d8e3dc] bg-white text-[#003831] shadow-sm sm:hidden"
              onClick={() => setIsOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isOpen ? (
            <div className="mt-3 border-t border-[#d8e3dc]/80 pt-3 sm:hidden">
              <div className="grid gap-2 text-xs font-bold text-[#4d6b61]">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => [
                      'rounded-lg px-3 py-2 transition',
                      isActive ? 'bg-[#007062] text-white' : 'hover:bg-slate-100',
                    ].join(' ')}
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-[#d8e3dc]">
                  {user ? (
                    <Link
                      to="/app"
                      onClick={() => setIsOpen(false)}
                      className="col-span-2 rounded-xl bg-[#007062] px-3 py-2 text-center text-xs font-bold text-white shadow-md"
                    >
                      Open Command Center
                    </Link>
                  ) : (
                    <>
                      <NavLink
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl border border-[#d8e3dc] px-3 py-2 text-center text-xs font-bold text-[#0c2b25]"
                      >
                        Sign In
                      </NavLink>
                      <NavLink
                        to="/register"
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl bg-[#007062] px-3 py-2 text-center text-xs font-bold text-white shadow-md"
                      >
                        Create Account
                      </NavLink>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </header>
      </div>

      {/* Page Content */}
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      {/* Corporate Footer */}
      <footer className="relative z-10 border-t border-[#d8e3dc] bg-white/85 py-10 text-[#4d6b61]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#005c51] text-white">
                <Zap size={18} />
              </span>
              <div>
                <p className="font-display text-base font-bold text-[#003831]">VidyutChain Platform</p>
                <p className="text-xs text-[#6b857d]">Making every meter intelligent, every unit auditable.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <NavLink to="/platform" className="hover:text-[#007062]">Platform</NavLink>
              <NavLink to="/architecture" className="hover:text-[#007062]">Architecture</NavLink>
              <NavLink to="/ai-intelligence" className="hover:text-[#007062]">AI Engine</NavLink>
              <NavLink to="/blockchain-audit" className="hover:text-[#007062]">Blockchain</NavLink>
              <span className="text-[#8fa79f]">|</span>
              <span className="text-[#6b857d]">Phase 1 Software MVP • August 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
