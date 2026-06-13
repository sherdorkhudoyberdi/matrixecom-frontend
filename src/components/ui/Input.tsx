import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-brand-gray-600">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'h-11 w-full rounded-full border border-brand-gray-200 bg-brand-gray-50 px-4 text-sm outline-none transition focus:border-brand-black focus:bg-brand-white',
          error && 'border-brand-accent',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-brand-accent">{error}</p> : null}
    </div>
  )
}
