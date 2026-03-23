import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, business: true, category: true, avatar: true, role: true },
  })
  if (!user) redirect('/login')

  const accessLevel = session.user.accessLevel ?? 'officer'
  const role = session.user.role ?? ''
  const canEditChapter = accessLevel === 'superadmin' || accessLevel === 'platform' || ['president', 'vicePresident', 'treasurer'].includes(role)
  const canManageRoles = accessLevel === 'superadmin' || accessLevel === 'platform' || ['president', 'vicePresident'].includes(role)

  let chapterSettings: Record<string, string> = {}
  if (canEditChapter) {
    const settings = await db.chapterSetting.findMany()
    chapterSettings = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  }

  const allRoles = await db.chapterRole.findMany({
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
  })

  const allMembers = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, business: true, avatar: true, role: true },
    orderBy: { name: 'asc' },
  })

  // Attach member counts to each role
  const countBySlug: Record<string, number> = {}
  for (const m of allMembers) countBySlug[m.role] = (countBySlug[m.role] ?? 0) + 1

  const rolesWithCount = allRoles.map((r) => ({
    ...r,
    group: (r as any).group ?? 'member',
    sortOrder: (r as any).sortOrder ?? 99,
    memberCount: countBySlug[r.slug] ?? 0,
  }))

  return (
    <SettingsClient
      user={user}
      accessLevel={accessLevel}
      canEditChapter={canEditChapter}
      canManageRoles={canManageRoles}
      chapterSettings={chapterSettings}
      roles={rolesWithCount}
      allMembers={allMembers}
    />
  )
}
