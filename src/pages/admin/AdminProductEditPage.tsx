import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as adminCatalogApi from '@/api/adminCatalog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatPrice } from '@/lib/format'
import { getErrorMessage } from '@/lib/utils'
import type { Category } from '@/types/api'

function flattenCategories(categories: Category[]): { guid: string; name: string }[] {
  return categories.flatMap((cat) => {
    const self = [{ guid: cat.guid, name: cat.name }]
    const kids = (cat.children ?? []).length ? flattenCategories(cat.children!) : []
    return [...self, ...kids]
  })
}

export function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    categories_id: '',
    brands_id: '',
    is_active: true,
  })

  const [variantForm, setVariantForm] = useState({
    sku: '',
    price: '',
    stock_quantity: '',
  })

  const [imageUrl, setImageUrl] = useState('')
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminCatalogApi.adminGetProduct(id!),
    enabled: !isNew && !!id,
  })

  const { data: variants } = useQuery({
    queryKey: ['admin-variants', id],
    queryFn: () => adminCatalogApi.adminListVariants(id!),
    enabled: !isNew && !!id,
  })

  const productImages = data?.item?.images ?? []

  const { data: specs } = useQuery({
    queryKey: ['admin-specs', id],
    queryFn: () => adminCatalogApi.adminListSpecs(id!),
    enabled: !isNew && !!id,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-options'],
    queryFn: () => adminCatalogApi.adminListCategories({ tree: true }),
  })

  const { data: brandsData } = useQuery({
    queryKey: ['admin-brands-options'],
    queryFn: () => adminCatalogApi.adminListBrands({ page: 1, limit: 200 }),
  })

  const categoryOptions = flattenCategories(categoriesData?.items ?? [])
  const brandOptions = brandsData?.items ?? []

  useEffect(() => {
    if (data?.item) {
      const p = data.item
      setForm({
        name: p.name ?? '',
        slug: p.slug ?? '',
        description: p.description ?? '',
        categories_id: p.categories_id ?? '',
        brands_id: p.brands_id ?? '',
        is_active: p.is_active ?? true,
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () =>
      isNew
        ? adminCatalogApi.adminCreateProduct(form)
        : adminCatalogApi.adminUpdateProduct({ ...form, guid: id! }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success(isNew ? 'Product created' : 'Product updated')
      if (isNew && res.item?.guid) navigate(`/admin/products/${res.item.guid}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const createVariantMutation = useMutation({
    mutationFn: () =>
      adminCatalogApi.adminCreateVariant({
        products_id: id!,
        sku: variantForm.sku,
        price: Number(variantForm.price),
        stock_quantity: Number(variantForm.stock_quantity),
        is_active: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-variants', id] })
      setVariantForm({ sku: '', price: '', stock_quantity: '' })
      toast.success('Variant added')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const createImageMutation = useMutation({
    mutationFn: () =>
      adminCatalogApi.adminUpdateProduct({
        guid: id!,
        images: [...productImages, imageUrl.trim()],
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-product', id] })
      setImageUrl('')
      toast.success('Image added')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const createSpecMutation = useMutation({
    mutationFn: () =>
      adminCatalogApi.adminCreateSpec({
        products_id: id!,
        spec_key: specKey,
        spec_value: specValue,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-specs', id] })
      setSpecKey('')
      setSpecValue('')
      toast.success('Specification added')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (!isNew && isLoading) return <Spinner />

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/admin/products" className="text-sm font-medium text-brand-gray-600 hover:underline">
          ← Products
        </Link>
        <h1 className="text-3xl font-black">{isNew ? 'New Product' : 'Edit Product'}</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate()
        }}
        className="grid gap-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-6 lg:grid-cols-2"
      >
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <Select
          label="Category"
          value={form.categories_id}
          onChange={(e) => setForm((f) => ({ ...f, categories_id: e.target.value }))}
        >
          <option value="">Select category</option>
          {categoryOptions.map((c) => (
            <option key={c.guid} value={c.guid}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          label="Brand"
          value={form.brands_id}
          onChange={(e) => setForm((f) => ({ ...f, brands_id: e.target.value }))}
        >
          <option value="">Select brand</option>
          {brandOptions.map((b) => (
            <option key={b.guid} value={b.guid}>
              {b.name}
            </option>
          ))}
        </Select>
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className="w-full rounded-2xl border px-4 py-3 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium lg:col-span-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          Active
        </label>
        <div className="lg:col-span-2">
          <Button type="submit" loading={saveMutation.isPending}>
            {isNew ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {!isNew ? (
        <>
          <section className="rounded-2xl border border-brand-gray-100 bg-brand-white p-6">
            <h2 className="mb-4 text-xl font-bold">Variants</h2>
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">SKU</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(variants?.items ?? []).map((v) => (
                    <tr key={v.guid} className="border-b border-brand-gray-50">
                      <td className="py-2">{v.sku}</td>
                      <td className="py-2">{formatPrice(v.price)}</td>
                      <td className="py-2">{v.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Input
                label="SKU"
                value={variantForm.sku}
                onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))}
              />
              <Input
                label="Price"
                type="number"
                value={variantForm.price}
                onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
              />
              <Input
                label="Stock"
                type="number"
                value={variantForm.stock_quantity}
                onChange={(e) =>
                  setVariantForm((f) => ({ ...f, stock_quantity: e.target.value }))
                }
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => createVariantMutation.mutate()}
                  loading={createVariantMutation.isPending}
                >
                  Add Variant
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-gray-100 bg-brand-white p-6">
            <h2 className="mb-4 text-xl font-bold">Images</h2>
            <ul className="mb-4 space-y-2 text-sm">
              {productImages.map((url) => (
                <li key={url} className="flex items-center gap-3">
                  <img src={url} alt="" className="h-12 w-12 rounded object-cover" />
                  <span className="truncate">{url}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Input
                label="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => createImageMutation.mutate()}
                  loading={createImageMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-gray-100 bg-brand-white p-6">
            <h2 className="mb-4 text-xl font-bold">Specifications</h2>
            <ul className="mb-4 space-y-1 text-sm">
              {(specs?.items ?? []).map((s) => (
                <li key={s.guid}>
                  <strong>{s.spec_key}:</strong> {s.spec_value}
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Key" value={specKey} onChange={(e) => setSpecKey(e.target.value)} />
              <Input
                label="Value"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => createSpecMutation.mutate()}
                  loading={createSpecMutation.isPending}
                >
                  Add Spec
                </Button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
