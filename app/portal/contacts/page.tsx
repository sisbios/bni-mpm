import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PortalContactsClient from './PortalContactsClient'

export default async function PortalContactsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return <PortalContactsClient userId={session.user.id} />
}
