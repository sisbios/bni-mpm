import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PortalMembersClient from './PortalMembersClient'

export default async function PortalMembersPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [members, roles] = await Promise.all([
    db.user.findMany({
      where: { isActive: true, role: { not: 'admin' } },
      select: { id: true, name: true, business: true, phone: true, avatar: true, role: true, category: true },
      orderBy: { name: 'asc' },
    }),
    db.chapterRole.findMany({
      select: { slug: true, label: true, color: true },
    }),
  ])

  const roleMap = Object.fromEntries(roles.map((r) => [r.slug, r]))

  return <PortalMembersClient members={members} roleMap={roleMap} currentUserId={session.user.id} />
}
