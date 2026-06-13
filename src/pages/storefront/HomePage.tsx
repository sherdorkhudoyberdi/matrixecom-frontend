import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as catalogApi from '@/api/catalog'
import { Badge } from '@/components/ui/Badge'
import { ProductPriceBlock } from '@/components/storefront/ProductPriceBlock'
import { RatingStars } from '@/components/ui/RatingStars'
import { Spinner } from '@/components/ui/Spinner'
import heroImage from '@/assets/hero.png'

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () =>
      catalogApi.listProducts({ page: 1, limit: 8, sort: 'review_count_desc' }),
  })

  return (
    <div>
      <section className="container-shop grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
        <div className="space-y-6">
          <Badge tone="outline" className="w-fit">
            New arrivals
          </Badge>
          <h1 className="heading-xl leading-tight">
            FIND CLOTHES<br />THAT MATCHES<br />YOUR STYLE
          </h1>
          <p className="max-w-md text-brand-gray-600">
            Browse our curated collection of premium fashion. Bold looks, clean lines, and
            quality you can feel.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/catalog"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-black px-8 font-semibold text-brand-white"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-8 pt-4">
            {[
              { label: 'International Brands', value: '200+' },
              { label: 'High-Quality Products', value: '2,000+' },
              { label: 'Happy Customers', value: '30,000+' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-brand-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-brand-gray-50">
          <img src={heroImage} alt="Fashion hero" className="h-full w-full object-cover" />
          <div className="absolute right-6 top-6 rounded-full bg-brand-white px-4 py-2 text-sm font-bold shadow">
            <Star className="mr-1 inline h-4 w-4 fill-brand-warning text-brand-warning" />
            4.8 Rating
          </div>
        </div>
      </section>

      <section className="bg-brand-gray-50 py-16">
        <div className="container-shop">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="heading-lg">NEW ARRIVALS</h2>
            <Link to="/catalog" className="text-sm font-semibold underline">
              View All
            </Link>
          </div>
          {isLoading ? (
            <Spinner />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data?.items.map((product) => (
                <Link
                  key={product.guid}
                  to={`/product/${product.slug}`}
                  className="group overflow-hidden rounded-2xl bg-brand-white transition hover:shadow-lg"
                >
                  <div className="aspect-square overflow-hidden bg-brand-gray-100">
                    {product.main_image ? (
                      <img
                        src={product.main_image}
                        alt={product.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-brand-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="font-semibold">{product.name}</h3>
                    <RatingStars value={4} size="sm" />
                    <ProductPriceBlock
                      minPrice={product.min_price}
                      maxPrice={product.max_price}
                      compareAtPrice={product.min_compare_at_price}
                      size="sm"
                    />
                    {!product.in_stock ? (
                      <Badge tone="danger">Out of stock</Badge>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
