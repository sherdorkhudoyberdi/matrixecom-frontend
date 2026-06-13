import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function RatingStars({
  value = 0,
  max = 5,
  size = 'md',
  showValue,
  className,
}: RatingStarsProps) {
  const rounded = Math.round(value * 2) / 2

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= rounded
        const half = !filled && i + 0.5 === rounded
        return (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              filled || half ? 'fill-brand-warning text-brand-warning' : 'text-brand-gray-200',
            )}
          />
        )
      })}
      {showValue ? (
        <span className="ml-1 text-sm font-medium text-brand-gray-600">
          {value > 0 ? value.toFixed(1) : '0.0'}
        </span>
      ) : null}
    </div>
  )
}
