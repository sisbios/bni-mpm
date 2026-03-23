/**
 * Excludes system/admin users from all member-facing queries.
 * Admin users (role='admin', accessLevel='superadmin') are back-office
 * accounts and must never appear in member counts, PALMS, traffic light,
 * or any chapter activity calculations.
 */
export const NON_ADMIN_FILTER = {
  role: { not: 'admin' },
} as const
