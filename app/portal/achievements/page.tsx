import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PortalAchievementsClient from './PortalAchievementsClient'

export default async function PortalAchievementsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return <PortalAchievementsClient userId={session.user.id} />
}
