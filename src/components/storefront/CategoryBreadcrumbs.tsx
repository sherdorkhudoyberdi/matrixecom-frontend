import { Link } from 'react-router-dom'
import type { Category } from '@/types/api'
import { cn } from '@/lib/utils'

interface CategoryBreadcrumbsProps {
  items?: Pick<Category, 'guid' | 'name' | 'slug'>[]
  className?: string
}

export function CategoryBreadcrumbs({ items = [], className }: CategoryBreadcrumbsProps) {
  return (
    <nav className={cn('flex flex-wrap items-center gap-2 text-sm text-brand-gray-600', className)}>
      <Link to="/" className="hover:text-brand-black">
        Home
      </Link>
      <span aria-hidden>&gt;</span>
      <Link to="/catalog" className="hover:text-brand-black">
        Shop
      </Link>
      {items.map((cat) => (
        <span key={cat.guid} className="flex items-center gap-2">
          <span aria-hidden>&gt;</span>
          <Link to={`/catalog?category=${cat.guid}`} className="hover:text-brand-black">
            {cat.name}
          </Link>
        </span>
      ))}
    </nav>
  )
}
