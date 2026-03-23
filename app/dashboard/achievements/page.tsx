import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import AchievementsClient from './AchievementsClient'

export default async function AchievementsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const canManage =
    (session.user.accessLevel ?? 'member') === 'superadmin' || (session.user.accessLevel ?? 'member') === 'platform' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')

  const members = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, business: true, avatar: true },
    orderBy: { name: 'asc' },
  })

  return <AchievementsClient canManage={canManage} members={members} />
}
