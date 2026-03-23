import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import TrafficLightClient from './TrafficLightClient'

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function getMondayOfWeek(weekStr: string): Date {
  const [year, wk] = weekStr.split('-W').map(Number)
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const monday = new Date(startOfWeek1)
  monday.setDate(startOfWeek1.getDate() + (wk - 1) * 7)
  return monday
}

function getLast26Weeks(): { week: string; label: string; monday: Date }[] {
  const weeks = []
  const now = new Date()
  for (let i = 0; i < 26; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const week = getISOWeek(d)
    const monday = getMondayOfWeek(week)
    const label = monday.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
    weeks.push({ week, label, monday })
  }
  const seen = new Set<string>()
  return weeks.filter((w) => {
    if (seen.has(w.week)) return false
    seen.add(w.week)
    return true
  })
}

export default async function TrafficLightPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const accessLevel = session.user.accessLevel ?? 'member'
  if (accessLevel === 'member') redirect('/portal')

  // Only head table can enter scores
  const canEdit =
    accessLevel === 'superadmin' || accessLevel === 'platform' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')

  const currentWeek = getISOWeek(new Date())

  const [members, scoreEntriesThisWeek, allPalms] = await Promise.all([
    db.user.findMany({
      where: { isActive: true, role: { not: 'admin' } },
      select: { id: true, name: true, business: true, role: true, membershipValidTill: true },
      orderBy: { name: 'asc' },
    }),
    db.palmsEntry.findMany({
      where: { week: currentWeek },
      orderBy: { userId: 'asc' },
    }),
    db.palmsEntry.findMany({
      orderBy: { weekDate: 'desc' },
      take: 2000,
    }),
  ])

  const weeks = getLast26Weeks()

  return (
    <TrafficLightClient
      members={members}
      scoreEntriesThisWeek={scoreEntriesThisWeek}
      allPalms={allPalms}
      currentWeek={currentWeek}
      weeks={weeks}
      canEdit={canEdit}
    />
  )
}
