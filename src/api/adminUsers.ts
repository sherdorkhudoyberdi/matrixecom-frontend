import { callMethod } from '@/api/client'
import type { PaginatedResult, User } from '@/types/api'

export function adminListUsers(params: { page?: number; limit?: number; search?: string } = {}) {
  return callMethod<PaginatedResult<User>>('admin_users_list', params)
}

export function adminUpdateUserRole(guid: string, role_id: string) {
  return callMethod<{ user: User }>('admin_users_update_role', { guid, role_id })
}
