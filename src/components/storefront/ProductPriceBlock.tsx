import { Badge } from '@/components/ui/Badge'
import { formatPrice, priceRange } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProductPriceBlockProps {
  minPrice?: number | null
  maxPrice?: number | null
  compareAtPrice?: number | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function discountPercent(price: number, compareAt: number): number {
  if (compareAt <= price) return 0
  return Math.round((1 - price / compareAt) * 100)
}

export function ProductPriceBlock({
  minPrice,
  maxPrice,
  compareAtPrice,
  className,
  size = 'md',
}: ProductPriceBlockProps) {
  const hasRange =
    minPrice != null && maxPrice != null && minPrice !== maxPrice && !compareAtPrice
  const price = minPrice ?? maxPrice
  const showCompare =
    compareAtPrice != null && price != null && compareAtPrice > price
  const discount = showCompare ? discountPercent(price, compareAtPrice) : 0

  const priceClass =
    size === 'lg' ? 'text-3xl font-bold' : size === 'sm' ? 'text-sm font-bold' : 'text-lg font-bold'

  if (hasRange) {
    return <p className={cn(priceClass, className)}>{priceRange(minPrice, maxPrice)}</p>
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className={priceClass}>{formatPrice(price)}</span>
      {showCompare ? (
        <>
          <span className="text-sm text-brand-gray-400 line-through">
            {formatPrice(compareAtPrice)}
          </span>
          {discount > 0 ? (
            <Badge tone="danger" className="text-xs">
              -{discount}%
            </Badge>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
