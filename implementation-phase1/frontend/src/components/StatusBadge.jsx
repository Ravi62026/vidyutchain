const styles = {
  online: {
    container: 'border-emerald-200/90 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/10',
    dot: 'bg-emerald-500',
    ping: true,
  },
  registered: {
    container: 'border-teal-200/90 bg-teal-50/70 text-teal-800 shadow-sm shadow-teal-500/10',
    dot: 'bg-teal-500',
    ping: false,
  },
  offline: {
    container: 'border-slate-200 bg-slate-100/90 text-slate-600',
    dot: 'bg-slate-400',
    ping: false,
  },
  error: {
    container: 'border-rose-200 bg-rose-50 text-rose-800 shadow-sm shadow-rose-500/10',
    dot: 'bg-rose-500',
    ping: true,
  },
  confirmed: {
    container: 'border-emerald-200/90 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/10',
    dot: 'bg-emerald-500',
    ping: false,
  },
  failed: {
    container: 'border-rose-200 bg-rose-50 text-rose-800 shadow-sm shadow-rose-500/10',
    dot: 'bg-rose-500',
    ping: false,
  },
  disabled: {
    container: 'border-slate-200 bg-slate-100/80 text-slate-500',
    dot: 'bg-slate-400',
    ping: false,
  },
  normal: {
    container: 'border-emerald-200/90 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/10',
    dot: 'bg-emerald-500',
    ping: false,
  },
  anomaly: {
    container: 'border-amber-200 bg-amber-50 text-amber-900 shadow-sm shadow-amber-500/10',
    dot: 'bg-amber-500',
    ping: true,
  },
  load_theft: {
    container: 'border-rose-200 bg-rose-50 text-rose-800 shadow-sm shadow-rose-500/10',
    dot: 'bg-rose-500',
    ping: true,
  },
  meter_tampering: {
    container: 'border-amber-200 bg-amber-50 text-amber-900 shadow-sm shadow-amber-500/10',
    dot: 'bg-amber-500',
    ping: true,
  },
  reverse_energy: {
    container: 'border-cyan-200 bg-cyan-50 text-cyan-800 shadow-sm shadow-cyan-500/10',
    dot: 'bg-cyan-500',
    ping: false,
  },
  communication_failure: {
    container: 'border-rose-200 bg-rose-50 text-rose-800 shadow-sm shadow-rose-500/10',
    dot: 'bg-rose-500',
    ping: true,
  },
}

export function StatusBadge({ value, className = '' }) {
  const normalized = String(value ?? 'unknown').toLowerCase()
  const config = styles[normalized] ?? styles.disabled

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase transition-all duration-200 ${config.container} ${className}`}
    >
      <span className="relative flex size-2">
        {config.ping ? (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dot}`} />
        ) : null}
        <span className={`relative inline-flex size-2 rounded-full ${config.dot}`} />
      </span>
      <span>{normalized.replaceAll('_', ' ')}</span>
    </span>
  )
}
