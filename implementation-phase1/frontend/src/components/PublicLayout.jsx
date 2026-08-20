import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, ArrowRight, Blocks, Menu, X, Zap } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'

const navigation = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Architecture', href: '/#architecture' },
  { label: 'Audit', href: '/#audit' },
  { label: 'Roadmap', href: '/#roadmap' },
]

export function PublicLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  useLayoutEffect(() => {
    if (location.pathname === '/' && !location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [location.hash, location.pathname])

  return (
    <div className="min-h-screen overflow-hidden bg-[#eef3f0] text-[#172525]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(23,37,37,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(23,37,37,0.045)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(8,122,112,0.12),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(60,110,170,0.10),transparent_30%)]" />

      <header className="sticky top-0 relative z-30 border-b border-[#d5e0da]/80 bg-[#eef3f0]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-[#172525] text-[#eef3f0] shadow-lg shadow-[#172525]/15 transition-transform duration-300 group-hover:rotate-3">
              <Zap size={20} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block font-display text-lg font-bold tracking-tight">VidyutChain</span>
              <span className="block text-xs font-medium uppercase tracking-[0.18em] text-[#64736e]">Energy intelligence</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl border border-[#d5e0da] bg-[#f8faf7]/70 p-1 lg:flex">
            {navigation.map((item) => (
              <a key={item.label} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#64736e] transition hover:bg-[#e7f4f1] hover:text-[#087a70]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <NavLink to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#64736e] transition hover:bg-[#e4ece8] hover:text-[#172525]">
              Sign in
            </NavLink>
            <NavLink to="/register" className="group inline-flex items-center gap-2 rounded-lg bg-[#087a70] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#087a70]/20 transition hover:bg-[#08665e]">
              Request access
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </NavLink>
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg border border-[#c6d5cf] bg-[#f8faf7] text-[#172525] shadow-sm lg:hidden"
            onClick={() => setIsOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isOpen ? (
          <div className="border-t border-[#d5e0da] bg-[#f8faf7]/95 px-5 py-5 shadow-lg lg:hidden">
            <div className="grid gap-2">
              {navigation.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#64736e] hover:bg-[#e4ece8]">
                  {item.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <NavLink to="/login" className="rounded-lg border border-[#d5e0da] px-3 py-2 text-center text-sm font-semibold">Sign in</NavLink>
                <NavLink to="/register" className="rounded-lg bg-[#087a70] px-3 py-2 text-center text-sm font-semibold text-white">Request access</NavLink>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-[#d5e0da] bg-[#172525] text-[#eef3f0]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-[#eef3f0] text-[#172525]">
                <Zap size={20} />
              </span>
              <div>
                <p className="font-display text-lg font-bold">VidyutChain</p>
                <p className="text-sm text-[#b8c6c0]">Making every meter intelligent, every unit accountable.</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#b8c6c0]">
              AI-powered energy telemetry, anomaly intelligence, and hash-only blockchain audit evidence for pilot grids and government evaluation.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8fa39c]">Platform</p>
            <div className="mt-4 grid gap-3 text-sm text-[#d8e2de]">
              <a href="/#platform" className="hover:text-white">Energy monitoring</a>
              <a href="/#architecture" className="hover:text-white">IoT architecture</a>
              <a href="/#audit" className="hover:text-white">Blockchain audit</a>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8fa39c]">System</p>
            <div className="mt-4 grid gap-3 text-sm text-[#d8e2de]">
              <span className="inline-flex items-center gap-2"><Activity size={15} /> Node.js API boundary</span>
              <span className="inline-flex items-center gap-2"><Blocks size={15} /> EVM private audit chain</span>
              <span className="inline-flex items-center gap-2"><Zap size={15} /> FastAPI AI inference</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-[#8fa39c]">
          © 2026 VidyutChain · Pilot simulation environment
        </div>
      </footer>
    </div>
  )
}

