import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import * as adminCatalogApi from '@/api/adminCatalog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { getErrorMessage } from '@/lib/utils'
import type { Category } from '@/types/api'

function flattenCategories(
  categories: Category[],
  depth = 0,
): { guid: string; name: string; label: string }[] {
  return categories.flatMap((cat) => {
    const prefix = depth > 0 ? `${'—'.repeat(depth)} ` : ''
    const self = [{ guid: cat.guid, name: cat.name, label: `${prefix}${cat.name}` }]
    const kids = (cat.children ?? []).length ? flattenCategories(cat.children!, depth + 1) : []
    return [...self, ...kids]
  })
}

export function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    categories_id: '',
    sort_order: '0',
    is_active: true,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminCatalogApi.adminListCategories({ tree: true }),
  })

  const parentOptions = flattenCategories(data?.items ?? [])

  const createMutation = useMutation({
    mutationFn: () =>
      adminCatalogApi.adminCreateCategory({
        name: form.name,
        slug: form.slug,
        categories_id: form.categories_id || undefined,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setModalOpen(false)
      setForm({ name: '', slug: '', categories_id: '', sort_order: '0', is_active: true })
      toast.success('Category created')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (guid: string) => adminCatalogApi.adminDeleteCategory(guid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success('Category deleted')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const renderTree = (items: import('@/types/api').Category[] = [], depth = 0) => {
    if (!items.length) return null
    return items.map((cat) => (
      <div key={cat.guid} style={{ paddingLeft: depth * 16 }}>
        <div className="flex items-center justify-between border-b border-brand-gray-50 py-3">
          <div>
            <p className="font-medium">{cat.name}</p>
            <p className="text-xs text-brand-gray-600">{cat.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={cat.is_active ? 'success' : 'outline'}>
              {cat.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('Delete this category?')) deleteMutation.mutate(cat.guid)
              }}
            >
              Delete
            </Button>
          </div>
        </div>
        {cat.children?.length ? renderTree(cat.children, depth + 1) : null}
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Categories</h1>
        <Button onClick={() => setModalOpen(true)}>Add Category</Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="rounded-2xl border border-brand-gray-100 bg-brand-white p-4">
          {renderTree(data?.items ?? [])}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Category">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}
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
            label="Parent category"
            value={form.categories_id}
            onChange={(e) => setForm((f) => ({ ...f, categories_id: e.target.value }))}
          >
            <option value="">None (top level)</option>
            {parentOptions.map((cat) => (
              <option key={cat.guid} value={cat.guid}>
                {cat.label}
              </option>
            ))}
          </Select>
          <Input
            label="Sort order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Active
          </label>
          <Button type="submit" loading={createMutation.isPending} className="w-full">
            Create
          </Button>
        </form>
      </Modal>
    </div>
  )
}
