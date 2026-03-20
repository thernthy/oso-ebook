export type Role = 'oso' | 'partner' | 'author' | 'reader'

export const PERMISSIONS = {
  oso: [
    'manage:users', 'manage:partners', 'manage:platform',
    'view:all_revenue', 'manage:categories', 'feature:books',
    'approve:books', 'suspend:accounts',
    'manage:catalog', 'invite:authors', 'review:submissions',
    'upload:books', 'edit:own_books', 'view:own_earnings',
    'browse:catalog', 'purchase:books', 'read:library',
    'leave:reviews', 'manage:profile',
  ],
  partner: [
    'manage:catalog', 'invite:authors', 'review:submissions',
    'approve:books', 'view:partner_revenue', 'set:pricing',
    'view:author_stats',
    'browse:catalog', 'purchase:books', 'read:library',
    'leave:reviews', 'manage:profile',
  ],
  author: [
    'upload:books', 'edit:own_books', 'submit:review',
    'view:own_earnings', 'manage:chapters', 'view:reader_stats',
    'browse:catalog', 'purchase:books', 'read:library',
    'leave:reviews', 'manage:profile',
  ],
  reader: [
    'browse:catalog', 'purchase:books', 'read:library',
    'leave:reviews', 'bookmark:chapters', 'track:reading',
    'manage:profile',
  ],
} satisfies Record<Role, string[]>

/**
 * Check if a role has a specific permission.
 * Usage: can('author', 'upload:books') => true
 */
export function can(role: Role, permission: string): boolean {
  return PERMISSIONS[role].includes(permission)
}

/**
 * Map role to its dashboard route.
 */
export function dashboardRoute(role: Role): string {
  const routes: Record<Role, string> = {
    oso:     '/dashboard/oso',
    partner: '/dashboard/partner',
    author:  '/dashboard/author',
    reader:  '/dashboard/reader',
  }
  return routes[role]
}
