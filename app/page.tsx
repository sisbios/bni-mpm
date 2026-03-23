import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/login')
  if (( session.user.accessLevel ?? 'member') === 'member') redirect('/portal')
  redirect('/dashboard')
}
