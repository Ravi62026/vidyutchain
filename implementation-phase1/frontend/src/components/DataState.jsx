import { AlertTriangle, LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Loading operational data…' }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-[#d5e0da] bg-[#f8faf7]/80">
      <div className="flex items-center gap-3 text-sm font-semibold text-[#64736e]">
        <LoaderCircle className="animate-spin text-[#087a70]" size={20} />
        {label}
      </div>
    </div>
  )
}

export function ErrorState({ title = 'Unable to load data', message, action }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-[#e5b7b2] bg-[#fff1ef] p-6 text-center">
      <div className="max-w-md">
        <AlertTriangle className="mx-auto text-[#a43f37]" size={28} />
        <h2 className="mt-4 font-display text-xl font-bold text-[#172525]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#64736e]">{message}</p>
        {action}
      </div>
    </div>
  )
}

export function EmptyState({ title, message }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-[#d5e0da] bg-[#f8faf7]/70 p-6 text-center">
      <div>
        <h2 className="font-display text-xl font-bold text-[#172525]">{title}</h2>
        <p className="mt-2 text-sm text-[#64736e]">{message}</p>
      </div>
    </div>
  )
}

