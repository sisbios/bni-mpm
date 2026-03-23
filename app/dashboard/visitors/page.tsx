import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import VisitorsClient from './VisitorsClient'

export default async function VisitorsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const accessLevel = session.user.accessLevel ?? 'member'
  if (accessLevel === 'member') redirect('/portal')

  const canEdit =
    accessLevel === 'superadmin' || accessLevel === 'platform' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')

  const [visitors, members] = await Promise.all([
    (db as any).visitor.findMany({
      include: {
        referrer: { select: { id: true, name: true, business: true, role: true } },
      },
      orderBy: { visitDate: 'desc' },
    }),
    db.user.findMany({
      where: { isActive: true, role: { not: 'admin' } },
      select: { id: true, name: true, business: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Serialise dates
  const serialised = visitors.map((v: any) => ({
    ...v,
    visitDate: v.visitDate instanceof Date ? v.visitDate.toISOString() : v.visitDate,
    weekDate:  v.weekDate  instanceof Date ? v.weekDate.toISOString()  : v.weekDate,
    eoiDate:   v.eoiDate   instanceof Date ? v.eoiDate.toISOString()   : v.eoiDate,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
    updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : v.updatedAt,
  }))

  return <VisitorsClient initialVisitors={serialised} members={members} canEdit={canEdit} />
}
