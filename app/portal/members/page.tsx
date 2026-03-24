import { NON_ADMIN_FILTER } from '@/lib/member-filter'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PortalMembersClient from './PortalMembersClient'

export default async function PortalMembersPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const chapterId = session.user.chapterId

  const [members, roles, chapter] = await Promise.all([
    db.user.findMany({
      where: { isActive: true, chapterId: chapterId ?? undefined, ...NON_ADMIN_FILTER },
      select: { id: true, name: true, business: true, phone: true, avatar: true, role: true, category: true },
      orderBy: { name: 'asc' },
    }),
    db.chapterRole.findMany({
      where: { chapterId: chapterId ?? undefined },
      select: { slug: true, label: true, color: true },
    }),
    chapterId ? db.chapter.findUnique({ where: { id: chapterId }, select: { name: true } }) : null,
  ])

  const roleMap = Object.fromEntries(roles.map((r) => [r.slug, r]))
  const chapterName = chapter ? `BNI ${chapter.name} Chapter` : 'BNI Chapter'

  return <PortalMembersClient members={members} roleMap={roleMap} currentUserId={session.user.id} chapterName={chapterName} />
}
