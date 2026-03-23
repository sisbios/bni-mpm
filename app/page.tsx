import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/login')
  const level = session.user.accessLevel ?? 'member'
  if (level === 'member') redirect('/portal')
  if (level === 'regionAdmin' || level === 'platform') redirect('/region')
  redirect('/dashboard')
}
