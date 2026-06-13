import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

const tones: Record<Tone, string> = {
  default: 'bg-brand-gray-50 text-brand-black',
  success: 'bg-brand-success/10 text-brand-success',
  warning: 'bg-brand-warning/20 text-brand-gray-900',
  danger: 'bg-brand-accent/10 text-brand-accent',
  outline: 'border border-brand-gray-200 bg-transparent text-brand-gray-600',
}

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
