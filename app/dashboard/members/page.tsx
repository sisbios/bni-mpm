import { NON_ADMIN_FILTER } from '@/lib/member-filter'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import MembersClient from './MembersClient'
import { computeTrafficScore, TRAFFIC_COLORS, type PalmsRow } from '@/lib/traffic-light'

async function getMembers() {
  return db.user.findMany({
    where: { isActive: true, ...NON_ADMIN_FILTER },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      business: true,
      category: true,
      isActive: true,
      createdAt: true,
      membershipValidTill: true,
      _count: {
        select: { achievements: true, tasks: true, contactSphere: true },
      },
    },
  })
}

export default async function MembersPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const [members, roles, allPalms] = await Promise.all([
    getMembers(),
    db.chapterRole.findMany({ orderBy: { label: 'asc' }, select: { id: true, slug: true, label: true, color: true } }),
    db.palmsEntry.findMany({ orderBy: { weekDate: 'desc' }, take: 2000 }),
  ])

  // Pre-compute traffic scores server-side
  const trafficScores: Record<string, { color: string; total: number }> = {}
  for (const member of members) {
    const entries: PalmsRow[] = allPalms
      .filter((e) => e.userId === member.id)
      .sort((a, b) => new Date(b.weekDate).getTime() - new Date(a.weekDate).getTime())
      .slice(0, 26)
      .map((e) => ({
        attended: e.attended, substitute: e.substitute, late: e.late, medical: (e as any).medical ?? false,
        referrals: e.referrals, visitors: e.visitors, oneToOnes: e.oneToOnes,
        ceus: e.ceus, tyfcbAmount: e.tyfcbAmount, testimonials: (e as any).testimonials ?? 0,
      }))
    const sc = computeTrafficScore(entries)
    trafficScores[member.id] = { color: sc.color, total: sc.total }
  }

  const membersWithValidity = members.map((m) => ({
    ...m,
    membershipValidTill: m.membershipValidTill?.toISOString() ?? null,
  }))

  return <MembersClient initialMembers={membersWithValidity} roles={roles} trafficScores={trafficScores} />
}
