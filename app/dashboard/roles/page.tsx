import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import RolesClient from './RolesClient'

export default async function RolesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const level = session.user.accessLevel ?? 'member'
  if (level === 'member') redirect('/dashboard')

  const canManage =
    level === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')

  const allRoles = await db.chapterRole.findMany({
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
  })

  const allMembers = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, business: true, avatar: true, role: true },
    orderBy: { name: 'asc' },
  })

  const countBySlug: Record<string, number> = {}
  for (const m of allMembers) countBySlug[m.role] = (countBySlug[m.role] ?? 0) + 1

  const roles = allRoles.map((r) => ({
    ...r,
    group: (r as any).group ?? 'member',
    sortOrder: (r as any).sortOrder ?? 99,
    memberCount: countBySlug[r.slug] ?? 0,
  }))

  return (
    <RolesClient
      initialRoles={roles}
      allMembers={allMembers}
      canManage={canManage}
    />
  )
}
