export const ROLES = {
  Client: '34d766a6-321f-45cc-957b-514eb8889050',
  ContentManager: 'afad8b73-1b67-483a-af1a-5fe0f5992d60',
  WarehouseAdmin: '47a36d11-07b0-42ca-8c23-c097f16e7e26',
  SuperAdmin: '7a006572-f063-41b9-b4c6-1a2ff3cc8816',
} as const

export type RoleId = (typeof ROLES)[keyof typeof ROLES]

const ADMIN_ROLES: RoleId[] = [
  ROLES.ContentManager,
  ROLES.WarehouseAdmin,
  ROLES.SuperAdmin,
]

export function isAdmin(roleId?: string | null): boolean {
  return !!roleId && ADMIN_ROLES.includes(roleId as RoleId)
}

export function canManageCatalog(roleId?: string | null): boolean {
  return roleId === ROLES.ContentManager || roleId === ROLES.SuperAdmin
}

export function canManageOrders(roleId?: string | null): boolean {
  return roleId === ROLES.WarehouseAdmin || roleId === ROLES.SuperAdmin
}

export function canManageStock(roleId?: string | null): boolean {
  return roleId === ROLES.WarehouseAdmin || roleId === ROLES.SuperAdmin
}

export function canManageUsers(roleId?: string | null): boolean {
  return roleId === ROLES.SuperAdmin
}

export function canViewReports(roleId?: string | null): boolean {
  return roleId === ROLES.ContentManager || roleId === ROLES.SuperAdmin
}

export function canViewProfitLoss(roleId?: string | null): boolean {
  return roleId === ROLES.SuperAdmin
}

export function roleLabel(roleId?: string | null): string {
  switch (roleId) {
    case ROLES.Client:
      return 'Client'
    case ROLES.ContentManager:
      return 'Content Manager'
    case ROLES.WarehouseAdmin:
      return 'Warehouse Admin'
    case ROLES.SuperAdmin:
      return 'Super Admin'
    default:
      return 'Unknown'
  }
}
