import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-gray-100 border-t-brand-black" />
      <span className="text-sm text-brand-gray-600">{label}</span>
    </div>
  )
}
