import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RolesClient from './RolesClient'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const level = session.user.accessLevel ?? 'member'
  if (level === 'member') redirect('/dashboard')

  const canManage =
    level === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')

  return <RolesClient canManage={canManage} callerRole={session.user.role ?? 'member'} />
}
