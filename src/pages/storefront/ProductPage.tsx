import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { clampQuantity, maxAddableQuantity, stockLabel } from '@/lib/stock'
import { consumeProductSelections, savePendingAuthAction } from '@/lib/pendingAuth'
import { getErrorMessage } from '@/lib/utils'
import {
  applyAttributeSelection,
  getAllAttributeValues,
  getAttributeNames,
  getDefaultSelections,
  getSelectableVariants,
  isAttributeValueCompatible,
  resolveVariant,
  usesAttributeSelection,
  variantDisplayLabel,
  VARIANT_GUID_SELECTION_KEY,
  variantImage,
  type AttributeSelections,
} from '@/lib/variants'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
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

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated && roleId === ROLES.Client,
  })

  const product = data?.item
  const variants = product?.variants ?? []

  useEffect(() => {
    if (!variants.length || !slug) return
    const restored = consumeProductSelections(slug)
    if (restored && Object.keys(restored).length > 0) {
      setSelections(restored)
      return
    }
    setSelections(getDefaultSelections(variants))
  }, [product?.guid, slug, variants])

  const selectedVariant = useMemo(
    () => resolveVariant(variants, selections),
    [variants, selections],
  )

  const attributeNames = useMemo(() => getAttributeNames(variants), [variants])
  const showDirectVariantPicker =
    !usesAttributeSelection(variants) && getSelectableVariants(variants).length > 1

  const cartQtyForVariant = useMemo(() => {
    if (!selectedVariant) return 0
    return (
      cart?.items.find((item) => item.product_variants_id === selectedVariant.guid)?.quantity ?? 0
    )
  }, [cart, selectedVariant])

  const stockAvailable = selectedVariant?.stock_quantity ?? 0
  const maxAddQty = maxAddableQuantity(stockAvailable, cartQtyForVariant)

  useEffect(() => {
    if (maxAddQty <= 0) {
      setQuantity(1)
      return
    }
    setQuantity((q) => clampQuantity(q, maxAddQty))
  }, [selectedVariant?.guid, maxAddQty])

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
    mutationFn: () => {
      if (maxAddQty <= 0) {
        throw new Error(
          cartQtyForVariant > 0
            ? `Only ${stockAvailable} in stock and you already have ${cartQtyForVariant} in your cart`
            : 'This variant is out of stock',
        )
      }
      if (quantity > maxAddQty) {
        throw new Error(`You can only add ${maxAddQty} more (${stockAvailable} in stock)`)
      }
      return cartApi.addToCart(selectedVariant!.guid, quantity)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (isLoading || !product) {
    return <Spinner className="min-h-[50vh]" />
  }

  const isClient = isAuthenticated && roleId === ROLES.Client
  const canShop = !isAuthenticated || isClient
  const maxQuantity = isClient ? maxAddQty : stockAvailable

  const canAddToCart =
    canShop &&
    !!selectedVariant &&
    stockAvailable > 0 &&
    quantity > 0 &&
    (isClient ? maxAddQty > 0 : true)
  const stockText = selectedVariant ? stockLabel(stockAvailable, cartQtyForVariant) : undefined
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
                {getAllAttributeValues(variants, name).map((value) => {
                  const isSelected = selections[name] === value
                  const isCompatible = isAttributeValueCompatible(
                    variants,
                    selections,
                    name,
                    value,
                  )

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setSelections((current) =>
                          applyAttributeSelection(variants, current, name, value),
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-brand-black bg-brand-black text-brand-white'
                          : isCompatible
                            ? 'border-brand-gray-200 hover:border-brand-black'
                            : 'border-brand-gray-200 text-brand-gray-400 hover:border-brand-black hover:text-brand-black'
                      }`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {showDirectVariantPicker ? (
            <div>
              <p className="mb-2 text-sm font-semibold">
                Variant:{' '}
                <span className="font-normal">
                  {selectedVariant ? variantDisplayLabel(
                    selectedVariant,
                    getSelectableVariants(variants).findIndex((v) => v.guid === selectedVariant.guid),
                  ) : '—'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {getSelectableVariants(variants).map((variant, index) => (
                  <button
                    key={variant.guid}
                    type="button"
                    onClick={() =>
                      setSelections({ [VARIANT_GUID_SELECTION_KEY]: variant.guid })
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selections[VARIANT_GUID_SELECTION_KEY] === variant.guid ||
                      (!selections[VARIANT_GUID_SELECTION_KEY] && index === 0)
                        ? 'border-brand-black bg-brand-black text-brand-white'
                        : 'border-brand-gray-200 hover:border-brand-black'
                    }`}
                  >
                    {variantDisplayLabel(variant, index)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {canShop ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-brand-gray-200">
                <button
                  type="button"
                  className="p-3 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canAddToCart || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="p-3 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canAddToCart || quantity >= maxQuantity}
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {stockText ? (
                <span
                  className={`text-sm ${maxAddQty <= 0 && isClient ? 'text-brand-accent' : 'text-brand-gray-600'}`}
                >
                  {stockText}
                  {isClient && cartQtyForVariant > 0 && maxAddQty > 0
                    ? ` · ${maxAddQty} more can be added`
                    : null}
                </span>
              ) : null}
              {selectedVariant && !selectedVariant.in_stock ? (
                <Badge tone="danger">Out of stock</Badge>
              ) : null}
            </div>
          ) : stockText ? (
            <p className={`text-sm ${stockAvailable <= 0 ? 'text-brand-accent' : 'text-brand-gray-600'}`}>
              {stockText}
              {selectedVariant && !selectedVariant.in_stock ? (
                <Badge tone="danger" className="ml-2">
                  Out of stock
                </Badge>
              ) : null}
            </p>
          ) : null}

          {canShop ? (
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={!canAddToCart}
              loading={addMutation.isPending}
              onClick={() => {
                if (!selectedVariant || quantity < 1 || stockAvailable <= 0) return

                if (!isAuthenticated) {
                  savePendingAuthAction({
                    returnTo: `/product/${slug}`,
                    cart: {
                      product_variants_id: selectedVariant.guid,
                      quantity,
                      productSlug: slug!,
                      selections: { ...selections },
                    },
                  })
                  navigate('/login', { state: { returnTo: `/product/${slug}` } })
                  return
                }

                if (quantity > maxAddQty) {
                  toast.error(`You can only add ${maxAddQty} more (${stockAvailable} in stock)`)
                  return
                }
                addMutation.mutate()
              }}
            >
              {isClient && maxAddQty <= 0 && cartQtyForVariant > 0
                ? 'Max quantity in cart'
                : 'Add to Cart'}
            </Button>
          ) : null}

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
