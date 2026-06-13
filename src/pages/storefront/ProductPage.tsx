import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as cartApi from '@/api/cart'
import * as catalogApi from '@/api/catalog'
import * as reviewsApi from '@/api/reviews'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CategoryBreadcrumbs } from '@/components/storefront/CategoryBreadcrumbs'
import { ProductPriceBlock } from '@/components/storefront/ProductPriceBlock'
import { RatingStars } from '@/components/ui/RatingStars'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { formatDate, reviewAuthorName } from '@/lib/format'
import { ROLES } from '@/lib/roles'
import { getErrorMessage } from '@/lib/utils'
import {
  getAttributeNames,
  getAttributeValues,
  getDefaultSelections,
  resolveVariant,
  variantImage,
  type AttributeSelections,
} from '@/lib/variants'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated, roleId } = useAuth()
  const queryClient = useQueryClient()
  const [selections, setSelections] = useState<AttributeSelections>({})
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState<string | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.getProduct({ slug: slug! }),
    enabled: !!slug,
  })

  const product = data?.item
  const variants = product?.variants ?? []

  useEffect(() => {
    if (variants.length) {
      setSelections(getDefaultSelections(variants))
    }
  }, [product?.guid])

  const selectedVariant = useMemo(
    () => resolveVariant(variants, selections),
    [variants, selections],
  )

  const attributeNames = useMemo(() => getAttributeNames(variants), [variants])

  useEffect(() => {
    const img = variantImage(selectedVariant, product?.images?.[0]) ?? product?.images?.[0]
    setActiveImage(img)
  }, [selectedVariant, product])

  const { data: similar } = useQuery({
    queryKey: ['similar', slug],
    queryFn: () => catalogApi.similarProducts({ slug: slug!, limit: 4 }),
    enabled: !!slug,
  })

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.guid],
    queryFn: () => reviewsApi.listProductReviews(product!.guid, { page: 1, limit: 10 }),
    enabled: !!product?.guid,
  })

  const addMutation = useMutation({
    mutationFn: () => cartApi.addToCart(selectedVariant!.guid, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (isLoading || !product) {
    return <Spinner className="min-h-[50vh]" />
  }

  const maxQty = selectedVariant?.stock_quantity ?? 1
  const categoryPath =
    product.category_path?.length
      ? product.category_path
      : product.category
        ? [product.category]
        : []

  return (
    <div className="container-shop py-10">
      <CategoryBreadcrumbs items={categoryPath} className="mb-6" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-brand-gray-50">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-brand-gray-400">
                No image
              </div>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(selectedVariant?.images?.length
              ? selectedVariant.images
              : product.images ?? []
            ).map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(url)}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-brand-gray-100"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            {product.brand?.name ? (
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gray-400">
                {product.brand.name}
              </p>
            ) : null}
            <h1 className="mt-2 text-4xl font-black">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <RatingStars value={product.avg_rating ?? 0} showValue />
              <span className="text-sm text-brand-gray-600">
                ({product.review_count ?? 0} reviews)
              </span>
            </div>
          </div>

          <ProductPriceBlock
            minPrice={selectedVariant?.price ?? product.variants?.[0]?.price}
            compareAtPrice={
              selectedVariant?.compare_at_price ?? product.variants?.[0]?.compare_at_price
            }
            size="lg"
          />

          <p className="text-brand-gray-600">{product.description}</p>

          {attributeNames.map((name) => (
            <div key={name}>
              <p className="mb-2 text-sm font-semibold">
                {name}: <span className="font-normal">{selections[name]}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {getAttributeValues(variants, name, selections).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setSelections((s) => ({ ...s, [name]: value }))
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selections[name] === value
                        ? 'border-brand-black bg-brand-black text-brand-white'
                        : 'border-brand-gray-200 hover:border-brand-black'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full border border-brand-gray-200">
              <button
                type="button"
                className="p-3"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                className="p-3"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {selectedVariant && !selectedVariant.in_stock ? (
              <Badge tone="danger">Out of stock</Badge>
            ) : null}
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!selectedVariant || !selectedVariant.in_stock}
            loading={addMutation.isPending}
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Please sign in to add items to cart')
                return
              }
              if (roleId !== ROLES.Client) {
                toast.error('Only customer accounts can add items to cart')
                return
              }
              addMutation.mutate()
            }}
          >
            Add to Cart
          </Button>

          {product.specifications && product.specifications.length > 0 ? (
            <div className="rounded-2xl border border-brand-gray-100 p-5">
              <h3 className="mb-3 font-bold">Specifications</h3>
              <dl className="space-y-2 text-sm">
                {product.specifications.map((spec) => (
                  <div key={spec.guid ?? spec.spec_key} className="flex justify-between gap-4">
                    <dt className="text-brand-gray-600">{spec.spec_key}</dt>
                    <dd className="font-medium">{spec.spec_value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-black">Reviews</h2>
        <div className="space-y-4">
          {(reviews?.items ?? []).map((review) => (
            <div key={review.guid} className="rounded-2xl border border-brand-gray-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{reviewAuthorName(review.user)}</p>
                <p className="text-xs text-brand-gray-400">{formatDate(review.created_at)}</p>
              </div>
              <RatingStars value={review.rating} size="sm" className="mt-2" />
              <p className="mt-2 text-brand-gray-600">{review.comment}</p>
            </div>
          ))}
          {(reviews?.items ?? []).length === 0 ? (
            <p className="text-brand-gray-600">No reviews yet.</p>
          ) : null}
        </div>
      </section>

      {similar?.items.length ? (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-black">You Might Also Like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.items.map((item) => (
              <Link
                key={item.guid}
                to={`/product/${item.slug}`}
                className="rounded-2xl border border-brand-gray-100 p-4 transition hover:shadow-md"
              >
                {item.main_image ? (
                  <img
                    src={item.main_image}
                    alt={item.name}
                    className="mb-3 aspect-square rounded-xl object-cover"
                  />
                ) : null}
                <h3 className="font-semibold">{item.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
