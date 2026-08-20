import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Blocks,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Settings,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'

const navigation = [
  { label: 'Command Center', href: '/app', icon: LayoutDashboard },
  { label: 'Live Monitoring', href: '/app/live', icon: Activity },
  { label: 'Meters', href: '/app/meters', icon: Gauge },
  { label: 'Analytics', href: '/app/analytics', icon: Radio },
  { label: 'AI Alerts', href: '/app/alerts', icon: AlertTriangle },
  { label: 'Blockchain Audit', href: '/app/audit', icon: Blocks },
  { label: 'System Health', href: '/app/health', icon: ShieldCheck },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

function Navigation({ onNavigate }) {
  return (
    <nav className="grid gap-1">
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/app'}
            onClick={onNavigate}
            className={({ isActive }) => [
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
              isActive
                ? 'bg-[#172525] text-[#eef3f0] shadow-lg shadow-[#172525]/15'
                : 'text-[#64736e] hover:bg-[#e4ece8] hover:text-[#172525]',
            ].join(' ')}
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#eef3f0] text-[#172525]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(23,37,37,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(23,37,37,0.04)_1px,transparent_1px)] [background-size:40px_40px]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#d5e0da] bg-[#f8faf7]/92 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="flex shrink-0 items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-[#172525] text-[#eef3f0]">
            <Zap size={21} />
          </span>
          <div>
            <p className="font-display text-lg font-bold">VidyutChain</p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64736e]">Pilot Grid</p>
          </div>
        </div>
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">
          <Navigation />
        </div>
        <div className="mt-5 shrink-0 rounded-xl border border-[#d5e0da] bg-[#eef3f0] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64736e]">Signed in</p>
          <p className="mt-2 truncate text-sm font-bold">{user?.email}</p>
          <p className="mt-1 text-xs capitalize text-[#64736e]">{user?.role} access</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#d5e0da] bg-[#f8faf7] px-3 py-2 text-sm font-semibold text-[#172525] transition hover:bg-[#e4ece8]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#d5e0da] bg-[#f8faf7]/85 shadow-[0_1px_0_rgba(23,37,37,0.02)] backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg border border-[#d5e0da] bg-[#f8faf7] lg:hidden"
                onClick={() => setIsOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64736e]">VidyutChain Pilot Grid</p>
                <h1 className="truncate font-display text-xl font-bold tracking-tight">Operational console</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#b9d8d1] bg-[#e7f4f1] px-3 py-1.5 text-xs font-bold text-[#087a70] shadow-sm">
                <span className="size-2 rounded-full bg-[#087a70]" />
                API boundary active
              </span>
              <span className="rounded-full border border-[#d5e0da] bg-[#f8faf7] px-3 py-1.5 text-xs font-semibold text-[#64736e]">
                20 Aug 2026 · IST
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[#172525]/40" onClick={() => setIsOpen(false)} aria-label="Close navigation" />
          <div className="relative h-full w-80 max-w-[85vw] border-r border-[#d5e0da] bg-[#f8faf7] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-[#172525] text-[#eef3f0]">
                  <Zap size={19} />
                </span>
                <p className="font-display text-lg font-bold">VidyutChain</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="grid size-10 place-items-center rounded-lg border border-[#d5e0da]">
                <X size={19} />
              </button>
            </div>
            <div className="mt-8 max-h-[calc(100vh-10rem)] overflow-y-auto">
              <Navigation onNavigate={() => setIsOpen(false)} />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#d5e0da] px-3 py-2 text-sm font-semibold"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

