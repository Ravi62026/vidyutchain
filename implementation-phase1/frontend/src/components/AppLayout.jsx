import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Blocks,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Gavel,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Radio,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'

const navGroups = [
  {
    group: 'GRID OPERATIONS',
    items: [
      { label: 'Command Center', href: '/app', icon: LayoutDashboard, badge: 'Live' },
      { label: 'Live Waveforms', href: '/app/live', icon: Activity },
      { label: 'Meter Fleet', href: '/app/meters', icon: Gauge },
    ],
  },
  {
    group: 'ENERGY MARKET & SETTLEMENT',
    items: [
      { label: 'Smart Wallet', href: '/app/wallet', icon: Wallet, badge: 'Auto-Pay' },
      { label: 'P2P Solar Trading', href: '/app/trading', icon: ShoppingBag, badge: 'Solana' },
      { label: 'Carbon ESG Registry', href: '/app/certificates', icon: Leaf, badge: 'CO2' },
      { label: 'Grid Tenders', href: '/app/tenders', icon: Gavel, badge: 'B2B' },
    ],
  },
  {
    group: 'INTELLIGENCE & AUDIT',
    items: [
      { label: 'Energy Analytics', href: '/app/analytics', icon: Radio },
      { label: 'AI Alert Inbox', href: '/app/alerts', icon: AlertTriangle, badge: 'ML' },
      { label: 'Blockchain Audit', href: '/app/audit', icon: Blocks, badge: 'EVM' },
    ],
  },
  {
    group: 'INFRASTRUCTURE',
    items: [
      { label: 'System Health', href: '/app/health', icon: ShieldCheck },
      { label: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
]

function Navigation({ onNavigate }) {
  return (
    <div className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.group}>
          <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#7a958c]">
            {group.group}
          </p>
          <nav className="grid gap-1">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/app'}
                  onClick={onNavigate}
                  className={({ isActive }) => [
                    'group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200',
                    isActive
                      ? 'bg-[#005c51] text-white shadow-md shadow-[#005c51]/25 ring-1 ring-white/20'
                      : 'text-[#476059] hover:bg-[#e4ece7] hover:text-[#0b241e]',
                  ].join(' ')}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          size={17}
                          className={`transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? 'text-[#38e8cb]' : 'text-[#6a877e] group-hover:text-[#005c51]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                            isActive
                              ? 'bg-[#38e8cb]/20 text-[#38e8cb]'
                              : 'bg-emerald-100/90 text-emerald-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
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
    <div className="min-h-screen bg-[#f4f7f5] text-[#111e1e]">
      {/* Background ambient grid pattern */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(0,92,81,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,92,81,0.03)_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#d8e3dc] bg-white/85 p-5 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)] backdrop-blur-2xl lg:flex lg:flex-col">
        {/* Brand Logo */}
        <div className="flex shrink-0 items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group">
            <span className="relative grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#007062] via-[#008f7d] to-[#0ea5e9] text-white shadow-lg shadow-[#007062]/25 group-hover:scale-105 transition-transform">
              <Zap size={22} className="text-white fill-white/20" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold tracking-tight text-[#003831]">
                Vidyut<span className="text-[#008f7d]">Chain</span>
              </p>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6b857d]">Smart Grid OS</p>
              </div>
            </div>
          </NavLink>
        </div>

        {/* Categorized Navigation */}
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">
          <Navigation />
        </div>

        {/* User Card & Node Status */}
        <div className="mt-auto pt-4">
          <div className="rounded-2xl border border-emerald-900/10 bg-gradient-to-b from-[#eaf4ef] to-[#e1eee7] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#005c51] text-white shadow-sm font-bold text-xs">
                  {user?.email?.charAt(0)?.toUpperCase() ?? 'A'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#0c2b25]">{user?.email}</p>
                  <span className="inline-block rounded-md bg-white/70 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#005c51]">
                    {user?.role} Role
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between border-t border-emerald-950/10 pt-3 text-[11px] text-[#4d635c]">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hardhat EVM #8545
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 font-extrabold text-rose-700 hover:text-rose-900 transition"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 lg:pl-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 border-b border-[#d8e3dc] bg-white/85 shadow-sm shadow-emerald-950/[0.02] backdrop-blur-xl">
          <div className="flex h-18 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl border border-[#d8e3dc] bg-white text-[#003831] shadow-sm lg:hidden transition hover:bg-[#eef3f0]"
                onClick={() => setIsOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007062]">
                    Substation Feeder #01 · Bangalore STPI
                  </p>
                </div>
                <h1 className="truncate font-display text-xl font-extrabold tracking-tight text-[#092b24]">
                  Operational Control Console
                </h1>
              </div>
            </div>

            {/* Quick Status Badges */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/80 px-3.5 py-1.5 shadow-sm">
                <ShieldCheck size={15} className="text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900">EVM Audit: Verified</span>
              </div>

              <div className="hidden md:flex items-center gap-2 rounded-full border border-[#d8e3dc] bg-white/90 px-3.5 py-1.5 shadow-sm">
                <Cpu size={14} className="text-[#007062]" />
                <span className="text-xs font-semibold text-[#4d635c]">AI: rf-stpi-v1 (99.5%)</span>
              </div>

              {/* User Avatar Chip */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-[#d8e3dc]">
                <div className="grid size-9 place-items-center rounded-xl bg-[#005c51] text-white shadow-sm font-bold text-xs">
                  {user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-[#0c2b25] truncate max-w-[120px]">{user?.email}</p>
                  <p className="text-[10px] text-[#6b857d] uppercase font-bold">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 animate-rise">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#092b24]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative flex h-full w-80 max-w-[85vw] flex-col border-r border-[#d8e3dc] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-[#d8e3dc]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#007062] to-[#0ea5e9] text-white shadow-md">
                  <Zap size={20} className="fill-white/20" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-[#003831]">VidyutChain</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b857d]">Mobile Console</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-9 place-items-center rounded-lg border border-[#d8e3dc] text-[#4d6b61] hover:bg-[#eef3f0]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              <Navigation onNavigate={() => setIsOpen(false)} />
            </div>

            <div className="mt-6 border-t border-[#d8e3dc] pt-4">
              <div className="rounded-xl bg-[#eaf4ef] p-3 text-xs">
                <p className="font-bold text-[#092b24] truncate">{user?.email}</p>
                <p className="capitalize text-[#4d6b61] mt-0.5">{user?.role} access</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
