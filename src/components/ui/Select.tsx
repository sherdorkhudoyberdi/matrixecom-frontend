import { cn } from '@/lib/utils'
import type { SelectHTMLAttributes } from 'react'

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ className, label, id, style, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const selectEl = (
    <select
      id={selectId}
      className={cn(
        'h-11 w-full appearance-none rounded-full border border-brand-gray-200 bg-brand-white bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pl-4 pr-12 text-sm outline-none transition focus:border-brand-black',
        className,
      )}
      style={{ backgroundImage: CHEVRON, ...style }}
      {...props}
    >
      {children}
    </select>
  )

  if (!label) return selectEl

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-brand-gray-600">
        {label}
      </label>
      {selectEl}
    </div>
  )
}
