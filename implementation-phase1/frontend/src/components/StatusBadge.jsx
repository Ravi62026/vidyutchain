const styles = {
  online: 'border-[#b9d8d1] bg-[#e7f4f1] text-[#087a70]',
  registered: 'border-[#d5e0da] bg-[#eef3f0] text-[#64736e]',
  offline: 'border-[#d5e0da] bg-[#eef3f0] text-[#64736e]',
  error: 'border-[#e5b7b2] bg-[#fff1ef] text-[#a43f37]',
  confirmed: 'border-[#b9d8d1] bg-[#e7f4f1] text-[#087a70]',
  failed: 'border-[#e5b7b2] bg-[#fff1ef] text-[#a43f37]',
  disabled: 'border-[#d5e0da] bg-[#eef3f0] text-[#64736e]',
  normal: 'border-[#b9d8d1] bg-[#e7f4f1] text-[#087a70]',
  anomaly: 'border-[#efd3a4] bg-[#fff7e8] text-[#9a6118]',
  communication_failure: 'border-[#e5b7b2] bg-[#fff1ef] text-[#a43f37]',
}

export function StatusBadge({ value }) {
  const normalized = String(value ?? 'unknown').toLowerCase()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${styles[normalized] ?? styles.disabled}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {normalized.replaceAll('_', ' ')}
    </span>
  )
}

