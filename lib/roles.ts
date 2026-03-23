/**
 * BNI Chapter Role Hierarchy
 * Static definition — groups and slugs are canonical across all chapters.
 * accessLevel controls what platform features each role can access.
 */

export type RoleDef = {
  slug: string
  label: string
  accessLevel: 'superadmin' | 'officer' | 'member'
  color: string
  sortOrder: number
}

export type RoleGroup = {
  key: string
  label: string
  shortLabel: string
  color: string
  roles: RoleDef[]
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    key: 'HT',
    label: 'Head Table',
    shortLabel: 'HT',
    color: '#CC0000',
    roles: [
      { slug: 'president',            label: 'President',             accessLevel: 'superadmin', color: '#CC0000', sortOrder: 1 },
      { slug: 'vicePresident',        label: 'Vice President',        accessLevel: 'officer',    color: '#E55C5C', sortOrder: 2 },
      { slug: 'secretaryTreasurer',   label: 'Secretary / Treasurer', accessLevel: 'officer',    color: '#E55C5C', sortOrder: 3 },
    ],
  },
  {
    key: 'MC',
    label: 'Membership Committee',
    shortLabel: 'MC',
    color: '#3B82F6',
    roles: [
      { slug: 'growthCoordinator',       label: 'Growth Coordinator',          accessLevel: 'officer', color: '#3B82F6', sortOrder: 10 },
      { slug: 'applicationReviewCoord',  label: 'Application Review Coordinator', accessLevel: 'officer', color: '#3B82F6', sortOrder: 11 },
      { slug: 'retentionCoordinator',    label: 'Retention Coordinator',       accessLevel: 'officer', color: '#3B82F6', sortOrder: 12 },
      { slug: 'attendanceCoordinator',   label: 'Attendance Coordinator',      accessLevel: 'officer', color: '#3B82F6', sortOrder: 13 },
      { slug: 'mentorCoordinator',       label: 'Mentor Coordinator',          accessLevel: 'officer', color: '#3B82F6', sortOrder: 14 },
      { slug: 'sportsEventCoordinator',  label: 'Sports & Event Coordinator',  accessLevel: 'officer', color: '#3B82F6', sortOrder: 15 },
      { slug: 'greenclubCoordinator',    label: 'Greenclub Coordinator',       accessLevel: 'officer', color: '#3B82F6', sortOrder: 16 },
      { slug: 'socialMediaCoordinator',  label: 'Social Media Coordinator',    accessLevel: 'officer', color: '#3B82F6', sortOrder: 17 },
      { slug: 'rvqcCoordinator',         label: 'RVQC Coordinator',            accessLevel: 'officer', color: '#3B82F6', sortOrder: 18 },
    ],
  },
  {
    key: 'member',
    label: 'Members',
    shortLabel: 'Member',
    color: '#6B7280',
    roles: [
      { slug: 'member', label: 'Member', accessLevel: 'member', color: '#6B7280', sortOrder: 99 },
    ],
  },
]

export const ALL_ROLES: RoleDef[] = ROLE_GROUPS.flatMap((g) => g.roles)

export const ROLE_BY_SLUG = Object.fromEntries(ALL_ROLES.map((r) => [r.slug, r]))

export const HT_SLUGS = ROLE_GROUPS.find((g) => g.key === 'HT')!.roles.map((r) => r.slug)
export const MC_SLUGS = ROLE_GROUPS.find((g) => g.key === 'MC')!.roles.map((r) => r.slug)
