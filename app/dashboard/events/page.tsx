import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EventsClient from './EventsClient'

export default async function EventsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (( session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  return <EventsClient />
}
