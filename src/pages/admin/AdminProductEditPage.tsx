import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as adminCatalogApi from '@/api/adminCatalog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatPrice } from '@/lib/format'
import { getErrorMessage } from '@/lib/utils'
import {
  normalizeSku,
  skuHint,
  validateCompareAtPrice,
  validateOptionalPrice,
  validateRequiredPrice,
  validateSku,
} from '@/lib/validation'
import type { AttributeValue, CatalogAttribute, Category, ProductVariant } from '@/types/api'

/** attributes_id → attribute_values_id */
type AttributeSelections = Record<string, string>

type DraftVariant = {
  key: string
  sku: string
  price: string
  compare_at_price: string
  cost_price: string
  stock_quantity: string
  attributeSelections: AttributeSelections
}

type DraftSpec = {
  key: string
  spec_key: string
  spec_value: string
}

function flattenCategories(categories: Category[]): { guid: string; name: string }[] {
  return categories.flatMap((cat) => {
    const self = [{ guid: cat.guid, name: cat.name }]
    const kids = (cat.children ?? []).length ? flattenCategories(cat.children!) : []
    return [...self, ...kids]
  })
}

function newKey() {
  return crypto.randomUUID()
}

const emptyVariantForm = {
  sku: '',
  price: '',
  compare_at_price: '',
  cost_price: '',
  stock_quantity: '',
}

type VariantFormState = typeof emptyVariantForm

function parseOptionalPrice(value: string): number | undefined {
  if (!value.trim()) return undefined
  return Number(value)
}

function validateVariantForm(
  form: VariantFormState,
  existingSkus: string[],
  excludeSku?: string,
) {
  const errors: Partial<Record<keyof VariantFormState, string>> = {}
  const otherSkus = excludeSku
    ? existingSkus.filter((sku) => normalizeSku(sku) !== normalizeSku(excludeSku))
    : existingSkus
  const skuError = validateSku(form.sku, otherSkus)
  if (skuError) errors.sku = skuError

  const priceError = validateRequiredPrice(form.price)
  if (priceError) errors.price = priceError

  const compareError = validateCompareAtPrice(form.compare_at_price, form.price)
  if (compareError) errors.compare_at_price = compareError

  const costError = validateOptionalPrice(form.cost_price, 'Cost price')
  if (costError) errors.cost_price = costError

  const stockError = validateOptionalPrice(form.stock_quantity, 'Stock')
  if (stockError) errors.stock_quantity = stockError

  return errors
}

function hasErrors(errors: Partial<Record<keyof VariantFormState, string>>) {
  return Object.values(errors).some(Boolean)
}

function groupAttributeValues(values: AttributeValue[]) {
  const grouped: Record<string, AttributeValue[]> = {}
  for (const value of values) {
    if (!grouped[value.attributes_id]) grouped[value.attributes_id] = []
    grouped[value.attributes_id]!.push(value)
  }
  for (const key of Object.keys(grouped)) {
    grouped[key]!.sort((a, b) => a.value.localeCompare(b.value))
  }
  return grouped
}

function buildAttributeValueLookup(
  attributes: CatalogAttribute[],
  values: AttributeValue[],
) {
  const attrById = new Map(attributes.map((attr) => [attr.guid, attr.name]))
  return new Map(
    values.map((value) => [
      value.guid,
      { attrName: attrById.get(value.attributes_id) ?? '', value: value.value },
    ]),
  )
}

function formatAttributeSelections(
  selections: AttributeSelections,
  attributes: CatalogAttribute[],
  valueLookup: Map<string, { attrName: string; value: string }>,
) {
  const parts = attributes
    .map((attr) => {
      const valueId = selections[attr.guid]
      if (!valueId) return null
      const entry = valueLookup.get(valueId)
      return entry ? `${entry.attrName}: ${entry.value}` : null
    })
    .filter(Boolean)

  return parts.length ? parts.join(', ') : '—'
}

function selectionsFromVariantLinks(
  links: Array<{ attribute_values_id: string }>,
  values: AttributeValue[],
) {
  const valueById = new Map(values.map((value) => [value.guid, value]))
  const selections: AttributeSelections = {}
  for (const link of links) {
    const value = valueById.get(link.attribute_values_id)
    if (value) selections[value.attributes_id] = value.guid
  }
  return selections
}

function attributeValueIds(selections: AttributeSelections) {
  return Object.values(selections).filter(Boolean)
}

function variantToFormState(variant: {
  sku?: string
  price: number
  compare_at_price?: number
  cost_price?: number
  stock_quantity?: number
}): VariantFormState {
  return {
    sku: variant.sku ?? '',
    price: String(variant.price),
    compare_at_price:
      variant.compare_at_price != null ? String(variant.compare_at_price) : '',
    cost_price: variant.cost_price != null ? String(variant.cost_price) : '',
    stock_quantity: variant.stock_quantity != null ? String(variant.stock_quantity) : '',
  }
}

function resetVariantFormState(
  setForm: (value: VariantFormState) => void,
  setAttributes: (value: AttributeSelections) => void,
  setErrors: (value: Partial<Record<keyof VariantFormState, string>>) => void,
) {
  setForm(emptyVariantForm)
  setAttributes({})
  setErrors({})
}

export function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    description: '',
    categories_id: '',
    brands_id: '',
    is_active: true,
  })

  const [variantForm, setVariantForm] = useState(emptyVariantForm)
  const [variantAttributeSelections, setVariantAttributeSelections] = useState<AttributeSelections>(
    {},
  )
  const [variantErrors, setVariantErrors] = useState<Partial<Record<keyof VariantFormState, string>>>(
    {},
  )

  const [imageUrl, setImageUrl] = useState('')
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  const [draftVariants, setDraftVariants] = useState<DraftVariant[]>([])
  const [draftImages, setDraftImages] = useState<string[]>([])
  const [draftSpecs, setDraftSpecs] = useState<DraftSpec[]>([])
  const [editingDraft, setEditingDraft] = useState<DraftVariant | null>(null)
  const [editingVariantGuid, setEditingVariantGuid] = useState<string | null>(null)

  const isEditingVariant = editingDraft !== null || editingVariantGuid !== null

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

  const productImages = isNew ? draftImages : (data?.item?.images ?? [])

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

  const { data: attributesData } = useQuery({
    queryKey: ['admin-attributes'],
    queryFn: () => adminCatalogApi.adminListAttributes({ page: 1, limit: 100 }),
  })

  const { data: attributeValuesData } = useQuery({
    queryKey: ['admin-attribute-values'],
    queryFn: () => adminCatalogApi.adminListAttributeValues({ page: 1, limit: 500 }),
  })

  const catalogAttributes = attributesData?.items ?? []
  const catalogAttributeValues = attributeValuesData?.items ?? []
  const valuesByAttribute = useMemo(
    () => groupAttributeValues(catalogAttributeValues),
    [catalogAttributeValues],
  )
  const attributeValueLookup = useMemo(
    () => buildAttributeValueLookup(catalogAttributes, catalogAttributeValues),
    [catalogAttributes, catalogAttributeValues],
  )

  const variantIds = useMemo(
    () => (variants?.items ?? []).map((variant) => variant.guid),
    [variants?.items],
  )

  const { data: variantAttributeMap } = useQuery({
    queryKey: ['admin-variant-attrs', id, variantIds],
    queryFn: () => adminCatalogApi.loadVariantAttributeMap(variantIds),
    enabled: !isNew && variantIds.length > 0,
  })

  const categoryOptions = flattenCategories(categoriesData?.items ?? [])
  const brandOptions = brandsData?.items ?? []

  useEffect(() => {
    if (data?.item) {
      const p = data.item
      setForm({
        name: p.name ?? '',
        description: p.description ?? '',
        categories_id: p.categories_id ?? '',
        brands_id: p.brands_id ?? '',
        is_active: p.is_active ?? true,
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Product name is required')
      if (!form.categories_id) throw new Error('Category is required')

      if (isNew) {
        if (draftVariants.length === 0) {
          throw new Error('Add at least one variant before saving')
        }
        const seenSkus: string[] = []
        for (const variant of draftVariants) {
          const skuError = validateSku(variant.sku, seenSkus)
          if (skuError) throw new Error(skuError)
          seenSkus.push(normalizeSku(variant.sku))

          const priceError = validateRequiredPrice(variant.price)
          if (priceError) throw new Error(priceError)

          const compareError = validateCompareAtPrice(variant.compare_at_price, variant.price)
          if (compareError) throw new Error(compareError)

          const costError = validateOptionalPrice(variant.cost_price, 'Cost price')
          if (costError) throw new Error(costError)
        }

        return adminCatalogApi.createProductWithDetails({
          product: {
            ...form,
            brands_id: form.brands_id || undefined,
            images: draftImages.length ? draftImages : undefined,
          },
          variants: draftVariants.map((variant) => ({
            sku: normalizeSku(variant.sku),
            price: Number(variant.price),
            stock_quantity: Number(variant.stock_quantity) || 0,
            compare_at_price: parseOptionalPrice(variant.compare_at_price),
            cost_price: parseOptionalPrice(variant.cost_price),
            attribute_value_ids: attributeValueIds(variant.attributeSelections),
          })),
          specs: draftSpecs.map((spec) => ({
            spec_key: spec.spec_key.trim(),
            spec_value: spec.spec_value.trim(),
          })),
        })
      }

      return adminCatalogApi.adminUpdateProduct({ ...form, guid: id! })
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success(isNew ? 'Product created' : 'Product updated')
      if (isNew && 'guid' in res && res.guid) {
        navigate(`/admin/products/${res.guid}`)
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateVariantMutation = useMutation({
    mutationFn: async () => {
      if (!editingVariantGuid) throw new Error('No variant selected for update')

      const errors = validateVariantForm(
        variantForm,
        (variants?.items ?? []).map((v) => v.sku ?? '').filter(Boolean),
        variantForm.sku,
      )
      if (hasErrors(errors)) {
        setVariantErrors(errors)
        throw new Error(Object.values(errors).find(Boolean) ?? 'Invalid variant')
      }

      await adminCatalogApi.adminUpdateVariant({
        guid: editingVariantGuid,
        sku: normalizeSku(variantForm.sku),
        price: Number(variantForm.price),
        compare_at_price: parseOptionalPrice(variantForm.compare_at_price),
        cost_price: parseOptionalPrice(variantForm.cost_price),
        stock_quantity: Number(variantForm.stock_quantity) || 0,
      })

      await adminCatalogApi.replaceVariantAttributes(
        editingVariantGuid,
        variantAttributeMap?.[editingVariantGuid] ?? [],
        attributeValueIds(variantAttributeSelections),
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-variants', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-variant-attrs', id] })
      setEditingVariantGuid(null)
      resetVariantFormState(setVariantForm, setVariantAttributeSelections, setVariantErrors)
      toast.success('Variant updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantGuid: string) => {
      await adminCatalogApi.deleteVariantWithAttributes(
        variantGuid,
        variantAttributeMap?.[variantGuid] ?? [],
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-variants', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-variant-attrs', id] })
      if (editingVariantGuid) {
        setEditingVariantGuid(null)
        resetVariantFormState(setVariantForm, setVariantAttributeSelections, setVariantErrors)
      }
      toast.success('Variant deleted')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const createVariantMutation = useMutation({
    mutationFn: async () => {
      const errors = validateVariantForm(
        variantForm,
        (variants?.items ?? []).map((v) => v.sku ?? '').filter(Boolean),
      )
      if (hasErrors(errors)) {
        setVariantErrors(errors)
        throw new Error(Object.values(errors).find(Boolean) ?? 'Invalid variant')
      }

      const created = await adminCatalogApi.adminCreateVariant({
        products_id: id!,
        sku: normalizeSku(variantForm.sku),
        price: Number(variantForm.price),
        compare_at_price: parseOptionalPrice(variantForm.compare_at_price),
        cost_price: parseOptionalPrice(variantForm.cost_price),
        stock_quantity: Number(variantForm.stock_quantity) || 0,
        is_active: true,
      })

      const variantId = created.item?.guid ?? (created as { guid?: string }).guid
      const valueIds = attributeValueIds(variantAttributeSelections)
      if (variantId && valueIds.length) {
        await adminCatalogApi.linkVariantAttributes(variantId, valueIds)
      }

      return created
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-variants', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-variant-attrs', id] })
      setVariantForm(emptyVariantForm)
      setVariantAttributeSelections({})
      setVariantErrors({})
      toast.success('Variant added')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const createImageMutation = useMutation({
    mutationFn: () =>
      adminCatalogApi.adminUpdateProduct({
        guid: id!,
        images: [...(data?.item?.images ?? []), imageUrl.trim()],
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

  const addDraftVariant = () => {
    const errors = validateVariantForm(
      variantForm,
      draftVariants.map((variant) => variant.sku),
      editingDraft?.sku,
    )
    setVariantErrors(errors)
    if (hasErrors(errors)) return

    const nextVariant: DraftVariant = {
      key: editingDraft?.key ?? newKey(),
      sku: normalizeSku(variantForm.sku),
      price: variantForm.price,
      compare_at_price: variantForm.compare_at_price,
      cost_price: variantForm.cost_price,
      stock_quantity: variantForm.stock_quantity,
      attributeSelections: { ...variantAttributeSelections },
    }

    setDraftVariants((items) => [...items, nextVariant])
    setEditingDraft(null)
    resetVariantFormState(setVariantForm, setVariantAttributeSelections, setVariantErrors)
  }

  const startEditDraftVariant = (row: DraftVariant) => {
    if (editingDraft && editingDraft.key !== row.key) {
      setDraftVariants((items) => [...items, editingDraft])
    }
    if (editingVariantGuid) setEditingVariantGuid(null)

    setVariantForm({
      sku: row.sku,
      price: row.price,
      compare_at_price: row.compare_at_price,
      cost_price: row.cost_price,
      stock_quantity: row.stock_quantity,
    })
    setVariantAttributeSelections({ ...row.attributeSelections })
    setVariantErrors({})
    setEditingDraft(row)
    setDraftVariants((items) => items.filter((variant) => variant.key !== row.key))
  }

  const startEditSavedVariant = (variant: ProductVariant) => {
    if (editingDraft) {
      setDraftVariants((items) => [...items, editingDraft])
      setEditingDraft(null)
    }

    setVariantForm(variantToFormState(variant))
    setVariantAttributeSelections(
      selectionsFromVariantLinks(
        variantAttributeMap?.[variant.guid] ?? [],
        catalogAttributeValues,
      ),
    )
    setVariantErrors({})
    setEditingVariantGuid(variant.guid)
  }

  const cancelVariantEdit = () => {
    if (editingDraft) {
      setDraftVariants((items) => [...items, editingDraft])
      setEditingDraft(null)
    }
    setEditingVariantGuid(null)
    resetVariantFormState(setVariantForm, setVariantAttributeSelections, setVariantErrors)
  }

  const handleDeleteDraftVariant = (row: DraftVariant) => {
    if (editingDraft?.key === row.key) cancelVariantEdit()
    setDraftVariants((items) => items.filter((variant) => variant.key !== row.key))
  }

  const handleDeleteSavedVariant = (variantGuid: string) => {
    if ((variants?.items ?? []).length <= 1) {
      toast.error('Product must have at least one variant')
      return
    }
    if (!confirm('Delete this variant?')) return
    deleteVariantMutation.mutate(variantGuid)
  }

  const handleVariantSubmit = () => {
    if (isNew) {
      addDraftVariant()
      return
    }
    if (editingVariantGuid) {
      updateVariantMutation.mutate()
      return
    }
    createVariantMutation.mutate()
  }

  const isVariantSubmitting =
    createVariantMutation.isPending || updateVariantMutation.isPending

  const updateVariantAttribute = (attributesId: string, attributeValueId: string) => {
    setVariantAttributeSelections((current) => ({
      ...current,
      [attributesId]: attributeValueId,
    }))
  }

  const updateVariantField = (field: keyof VariantFormState, value: string) => {
    setVariantForm((current) => ({ ...current, [field]: value }))
    if (variantErrors[field]) {
      setVariantErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const addDraftImage = () => {
    const url = imageUrl.trim()
    if (!url) {
      toast.error('Image URL is required')
      return
    }
    setDraftImages((items) => [...items, url])
    setImageUrl('')
  }

  const addDraftSpec = () => {
    if (!specKey.trim() || !specValue.trim()) {
      toast.error('Specification key and value are required')
      return
    }
    setDraftSpecs((items) => [
      ...items,
      { key: newKey(), spec_key: specKey.trim(), spec_value: specValue.trim() },
    ])
    setSpecKey('')
    setSpecValue('')
  }

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
        className="space-y-8"
      >
        <section className="grid gap-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-6 lg:grid-cols-2">
          <h2 className="text-xl font-bold lg:col-span-2">Product details</h2>
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Select
            label="Category"
            value={form.categories_id}
            onChange={(e) => setForm((f) => ({ ...f, categories_id: e.target.value }))}
            required
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
        </section>

        <section className="rounded-2xl border border-brand-gray-100 bg-brand-white p-6">
          <h2 className="mb-4 text-xl font-bold">Variants</h2>
          {isNew ? (
            <p className="mb-4 text-sm text-brand-gray-600">
              Add at least one variant. All variants are saved when you create the product.
            </p>
          ) : null}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Attributes</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Compare-at</th>
                  <th className="py-2">Cost</th>
                  <th className="py-2">Stock</th>
                  <th className="w-28 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isNew ? (
                  draftVariants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-brand-gray-500">
                        No variants yet
                      </td>
                    </tr>
                  ) : (
                    draftVariants.map((row) => (
                      <tr key={row.key} className="border-b border-brand-gray-50">
                        <td className="py-2">{row.sku}</td>
                        <td className="py-2">
                          {formatAttributeSelections(
                            row.attributeSelections,
                            catalogAttributes,
                            attributeValueLookup,
                          )}
                        </td>
                        <td className="py-2">{formatPrice(Number(row.price))}</td>
                        <td className="py-2">
                          {row.compare_at_price ? formatPrice(Number(row.compare_at_price)) : '—'}
                        </td>
                        <td className="py-2">
                          {row.cost_price ? formatPrice(Number(row.cost_price)) : '—'}
                        </td>
                        <td className="py-2">{row.stock_quantity || 0}</td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-sm font-medium hover:underline"
                              onClick={() => startEditDraftVariant(row)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-sm text-brand-accent hover:underline"
                              onClick={() => handleDeleteDraftVariant(row)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : (variants?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-brand-gray-500">
                      No variants yet
                    </td>
                  </tr>
                ) : (
                  (variants?.items ?? []).map((v) => (
                    <tr key={v.guid} className="border-b border-brand-gray-50">
                      <td className="py-2">{v.sku}</td>
                      <td className="py-2">
                        {formatAttributeSelections(
                          selectionsFromVariantLinks(
                            variantAttributeMap?.[v.guid] ?? [],
                            catalogAttributeValues,
                          ),
                          catalogAttributes,
                          attributeValueLookup,
                        )}
                      </td>
                      <td className="py-2">{formatPrice(v.price)}</td>
                      <td className="py-2">
                        {v.compare_at_price != null ? formatPrice(v.compare_at_price) : '—'}
                      </td>
                      <td className="py-2">
                        {v.cost_price != null ? formatPrice(v.cost_price) : '—'}
                      </td>
                      <td className="py-2">{v.stock_quantity}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-sm font-medium hover:underline"
                            onClick={() => startEditSavedVariant(v)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm text-brand-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={deleteVariantMutation.isPending}
                            onClick={() => handleDeleteSavedVariant(v.guid)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {catalogAttributes.length === 0 ? (
            <p className="mb-4 text-sm text-brand-gray-500">
              No catalog attributes yet. Create attributes (e.g. Color, Size) via the API to enable
              variant options on the storefront.
            </p>
          ) : null}
          {isEditingVariant ? (
            <p className="mb-4 text-sm text-brand-gray-600">
              Editing variant — update the fields below and click Save Variant, or Cancel to discard
              changes.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Input
              label="SKU"
              value={variantForm.sku}
              onChange={(e) => updateVariantField('sku', e.target.value.toUpperCase())}
              error={variantErrors.sku}
              placeholder="NIKE-TEE-BLK-M"
            />
            <Input
              label="Price"
              type="number"
              min={0}
              step="0.01"
              value={variantForm.price}
              onChange={(e) => updateVariantField('price', e.target.value)}
              error={variantErrors.price}
            />
            <Input
              label="Compare-at price"
              type="number"
              min={0}
              step="0.01"
              value={variantForm.compare_at_price}
              onChange={(e) => updateVariantField('compare_at_price', e.target.value)}
              error={variantErrors.compare_at_price}
            />
            <Input
              label="Cost price"
              type="number"
              min={0}
              step="0.01"
              value={variantForm.cost_price}
              onChange={(e) => updateVariantField('cost_price', e.target.value)}
              error={variantErrors.cost_price}
            />
            <Input
              label="Stock"
              type="number"
              min={0}
              value={variantForm.stock_quantity}
              onChange={(e) => updateVariantField('stock_quantity', e.target.value)}
              error={variantErrors.stock_quantity}
            />
            {catalogAttributes.map((attr) => (
              <Select
                key={attr.guid}
                label={attr.name}
                value={variantAttributeSelections[attr.guid] ?? ''}
                onChange={(e) => updateVariantAttribute(attr.guid, e.target.value)}
              >
                <option value="">— None —</option>
                {(valuesByAttribute[attr.guid] ?? []).map((value) => (
                  <option key={value.guid} value={value.guid}>
                    {value.value}
                  </option>
                ))}
              </Select>
            ))}
            <div className="flex items-end gap-2 xl:col-span-2">
              {isEditingVariant ? (
                <Button type="button" variant="ghost" className="w-full" onClick={cancelVariantEdit}>
                  Cancel
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleVariantSubmit}
                loading={isVariantSubmitting}
              >
                {isEditingVariant ? 'Save Variant' : 'Add Variant'}
              </Button>
            </div>
          </div>
          {!variantErrors.sku ? (
            <p className="mt-2 text-xs text-brand-gray-500">{skuHint}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-brand-gray-100 bg-brand-white p-6">
          <h2 className="mb-4 text-xl font-bold">Images</h2>
          <ul className="mb-4 space-y-2 text-sm">
            {productImages.length === 0 ? (
              <li className="text-brand-gray-500">No images yet</li>
            ) : (
              productImages.map((url) => (
                <li key={url} className="flex items-center gap-3">
                  <img src={url} alt="" className="h-12 w-12 rounded object-cover" />
                  <span className="flex-1 truncate">{url}</span>
                  {isNew ? (
                    <button
                      type="button"
                      className="text-sm text-brand-accent hover:underline"
                      onClick={() =>
                        setDraftImages((items) => items.filter((item) => item !== url))
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))
            )}
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
                variant="outline"
                onClick={() => (isNew ? addDraftImage() : createImageMutation.mutate())}
                loading={!isNew && createImageMutation.isPending}
              >
                Add
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-gray-100 bg-brand-white p-6">
          <h2 className="mb-4 text-xl font-bold">Specifications</h2>
          <ul className="mb-4 space-y-1 text-sm">
            {isNew ? (
              draftSpecs.length === 0 ? (
                <li className="text-brand-gray-500">No specifications yet</li>
              ) : (
                draftSpecs.map((spec) => (
                  <li key={spec.key} className="flex items-center gap-2">
                    <span>
                      <strong>{spec.spec_key}:</strong> {spec.spec_value}
                    </span>
                    <button
                      type="button"
                      className="text-sm text-brand-accent hover:underline"
                      onClick={() =>
                        setDraftSpecs((items) => items.filter((item) => item.key !== spec.key))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))
              )
            ) : (specs?.items ?? []).length === 0 ? (
              <li className="text-brand-gray-500">No specifications yet</li>
            ) : (
              (specs?.items ?? []).map((s) => (
                <li key={s.guid ?? `${s.spec_key}-${s.spec_value}`}>
                  <strong>{s.spec_key}:</strong> {s.spec_value}
                </li>
              ))
            )}
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
                variant="outline"
                onClick={() => (isNew ? addDraftSpec() : createSpecMutation.mutate())}
                loading={!isNew && createSpecMutation.isPending}
              >
                Add Spec
              </Button>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saveMutation.isPending}>
            {isNew ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
