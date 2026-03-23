import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

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

/** After any visitor change, recount and sync to PalmsEntry */
async function syncVisitorCount(referrerId: string, week: string, weekDate: Date) {
  const count = await db.visitor.count({ where: { referrerId, week } })
  await db.palmsEntry.upsert({
    where: { userId_week: { userId: referrerId, week } },
    create: {
      userId: referrerId,
      week,
      weekDate,
      visitors: count,
    },
    update: { visitors: count },
  })
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { searchParams } = new URL(request.url)
  const week = searchParams.get('week')
  const referrerId = searchParams.get('referrerId')

  const visitors = await (db as any).visitor.findMany({
    where: {
      chapterId,
      ...(week ? { week } : {}),
      ...(referrerId ? { referrerId } : {}),
    },
    include: {
      referrer: { select: { id: true, name: true, business: true, role: true } },
    },
    orderBy: { visitDate: 'desc' },
  })

  return NextResponse.json(visitors)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  const canEdit =
    accessLevel === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')

  if (!canEdit) return NextResponse.json({ error: 'Forbidden — head table only' }, { status: 403 })

  const chapterId = session.user.chapterId

  const body = await request.json()
  const { name, phone, email, business, category, referrerId, visitDate, eoiSubmitted, fromContactId, notes } = body

  if (!name || !referrerId || !visitDate) {
    return NextResponse.json({ error: 'name, referrerId and visitDate are required' }, { status: 400 })
  }

  const date = new Date(visitDate)
  const week = getISOWeek(date)
  const weekDate = getMondayOfWeek(week)

  const visitor = await (db as any).visitor.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      business: business || null,
      category: category || null,
      referrerId,
      visitDate: date,
      week,
      weekDate,
      eoiSubmitted: eoiSubmitted ?? false,
      fromContactId: fromContactId || null,
      notes: notes || null,
      createdBy: session.user.id,
      chapterId,
    },
    include: {
      referrer: { select: { id: true, name: true, business: true, role: true } },
    },
  })

  await syncVisitorCount(referrerId, week, weekDate)

  return NextResponse.json(visitor, { status: 201 })
}
