import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PortalProfileClient from './PortalProfileClient'

export default async function PortalProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, business: true, category: true, avatar: true, professionalPhoto: true, role: true, membershipValidTill: true, joinedAt: true },
  })
  if (!user) redirect('/login')

  const roleDetails = await db.chapterRole.findFirst({ where: { slug: user.role } }).catch(() => null)

  return (
    <PortalProfileClient
      user={{
        ...user,
        professionalPhoto: (user as any).professionalPhoto ?? null,
        membershipValidTill: user.membershipValidTill?.toISOString() ?? null,
        joinedAt: user.joinedAt?.toISOString() ?? null,
      }}
      roleLabel={(roleDetails as any)?.label ?? null}
      roleColor={(roleDetails as any)?.color ?? '#9CA3AF'}
    />
  )
}
