import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { NavigateFunction } from 'react-router-dom'
import * as cartApi from '@/api/cart'
import { ROLES } from '@/lib/roles'
import { getErrorMessage } from '@/lib/utils'
import type { AttributeSelections } from '@/lib/variants'

const PENDING_AUTH_KEY = 'matrixecom_pending_auth'

export interface PendingCartIntent {
  product_variants_id: string
  quantity: number
  productSlug: string
  selections: AttributeSelections
}

export interface PendingAuthAction {
  returnTo: string
  cart?: PendingCartIntent
}

export function savePendingAuthAction(action: PendingAuthAction) {
  sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(action))
}

export function consumePendingAuthAction(): PendingAuthAction | null {
  const raw = sessionStorage.getItem(PENDING_AUTH_KEY)
  if (!raw) return null
  sessionStorage.removeItem(PENDING_AUTH_KEY)
  try {
    return JSON.parse(raw) as PendingAuthAction
  } catch {
    return null
  }
}

function selectionsKey(slug: string) {
  return `matrixecom_selections_${slug}`
}

export function stageProductSelections(slug: string, selections: AttributeSelections) {
  sessionStorage.setItem(selectionsKey(slug), JSON.stringify(selections))
}

export function consumeProductSelections(slug: string): AttributeSelections | null {
  const raw = sessionStorage.getItem(selectionsKey(slug))
  if (!raw) return null
  sessionStorage.removeItem(selectionsKey(slug))
  try {
    return JSON.parse(raw) as AttributeSelections
  } catch {
    return null
  }
}

export async function finishAuthRedirect(
  roleId: string,
  navigate: NavigateFunction,
  queryClient: QueryClient,
  fallbackReturnTo?: string,
) {
  const pending = consumePendingAuthAction()

  if (pending?.cart?.selections && pending.cart.productSlug) {
    stageProductSelections(pending.cart.productSlug, pending.cart.selections)
  }

  if (pending?.cart && roleId === ROLES.Client) {
    try {
      await cartApi.addToCart(pending.cart.product_variants_id, pending.cart.quantity)
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  } else if (pending?.cart && roleId !== ROLES.Client) {
    toast.error('Only customer accounts can add items to cart')
  }

  const destination = pending?.returnTo ?? fallbackReturnTo ?? '/'
  navigate(destination, { replace: true })
}
