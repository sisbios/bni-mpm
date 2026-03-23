/**
 * Excludes system/admin users from all member-facing queries.
 * - role='admin'    → chapter back-office accounts
 * - role='platform' → cross-region super admin (admin@bnimalappuram.com)
 * These must never appear in member counts, lists, PALMS, traffic light,
 * attendance percentages, or any chapter activity calculations.
 */
export const NON_ADMIN_FILTER = {
  role: { notIn: ['admin', 'platform'] },
} as const
