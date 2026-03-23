import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (( session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  return <CalendarClient />
}
