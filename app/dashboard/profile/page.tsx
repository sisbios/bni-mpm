import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PortalContactsClient from '@/app/portal/contacts/PortalContactsClient'

export default async function DashboardProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div>
      <PortalContactsClient userId={session.user.id} />
    </div>
  )
}
