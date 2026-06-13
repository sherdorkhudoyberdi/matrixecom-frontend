import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import * as adminUsersApi from '@/api/adminUsers'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { ROLES, roleLabel } from '@/lib/roles'
import type { User } from '@/types/api'
import { getErrorMessage } from '@/lib/utils'

const ROLE_OPTIONS = Object.entries(ROLES).map(([label, id]) => ({ label, id }))

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () =>
      adminUsersApi.adminListUsers({ page, limit: 20, search: search || undefined }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ guid, role_id }: { guid: string; role_id: string }) =>
      adminUsersApi.adminUpdateUserRole(guid, role_id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Role updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 20))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Users</h1>

      <Input
        label="Search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Login, name, phone..."
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-gray-100 bg-brand-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-brand-gray-50">
                <tr>
                  <th className="px-4 py-3">Login</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((user: User) => (
                  <tr key={user.guid} className="border-b border-brand-gray-50">
                    <td className="px-4 py-3">{user.login}</td>
                    <td className="px-4 py-3">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3">{user.phone ?? '—'}</td>
                    <td className="px-4 py-3">{roleLabel(user.role_id)}</td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={user.role_id}
                        onChange={(e) =>
                          updateMutation.mutate({ guid: user.guid, role_id: e.target.value })
                        }
                        className="h-9 rounded-full border px-3 text-xs"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
