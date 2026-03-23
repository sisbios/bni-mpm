import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import TasksClient from './TasksClient'

async function getMembers() {
  return db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, business: true },
    orderBy: { name: 'asc' },
  })
}

export default async function TasksPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (( session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const members = await getMembers()
  return <TasksClient members={members} />
}
