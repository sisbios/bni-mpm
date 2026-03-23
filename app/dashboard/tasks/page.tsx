import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'
import TasksClient from './TasksClient'

async function getMembers(chapterId: string | null | undefined) {
  return db.user.findMany({
    where: { isActive: true, chapterId: chapterId ?? undefined, ...NON_ADMIN_FILTER },
    select: { id: true, name: true, business: true },
    orderBy: { name: 'asc' },
  })
}

export default async function TasksPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (( session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const members = await getMembers(session.user.chapterId)
  return <TasksClient members={members} />
}
