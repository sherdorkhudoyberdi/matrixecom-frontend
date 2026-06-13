import { callMethod } from '@/api/client'
import type { PaginatedResult, Review, User } from '@/types/api'

export function getProfile() {
  return callMethod<{ user: User }>('profile_get')
}

export function updateProfile(payload: Partial<Pick<User, 'first_name' | 'last_name' | 'phone'>>) {
  return callMethod<{ user: User }>('profile_update', payload)
}

export function listMyReviews(params: { page?: number; limit?: number } = {}) {
  return callMethod<PaginatedResult<Review>>('profile_reviews_list', params)
}
