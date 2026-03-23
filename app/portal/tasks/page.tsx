import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PortalTasksClient from './PortalTasksClient'

export default async function PortalTasksPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return <PortalTasksClient userId={session.user.id} userName={session.user.name ?? ''} />
}
