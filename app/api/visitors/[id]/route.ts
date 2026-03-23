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

async function syncVisitorCount(referrerId: string, week: string, weekDate: Date) {
  const count = await (db as any).visitor.count({ where: { referrerId, week } })
  await db.palmsEntry.upsert({
    where: { userId_week: { userId: referrerId, week } },
    create: { userId: referrerId, week, weekDate, visitors: count },
    update: { visitors: count },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  const canEdit =
    accessLevel === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { name, phone, email, business, category, referrerId, visitDate, eoiSubmitted, eoiDate, notes } = body

  // Fetch current record to know old week for sync
  const current = await (db as any).visitor.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone || null
  if (email !== undefined) updateData.email = email || null
  if (business !== undefined) updateData.business = business || null
  if (category !== undefined) updateData.category = category || null
  if (referrerId !== undefined) updateData.referrerId = referrerId
  if (notes !== undefined) updateData.notes = notes || null
  if (eoiSubmitted !== undefined) {
    updateData.eoiSubmitted = eoiSubmitted
    updateData.eoiDate = eoiSubmitted ? (eoiDate ? new Date(eoiDate) : new Date()) : null
  }
  if (visitDate !== undefined) {
    const date = new Date(visitDate)
    const week = getISOWeek(date)
    updateData.visitDate = date
    updateData.week = week
    updateData.weekDate = getMondayOfWeek(week)
  }

  const visitor = await (db as any).visitor.update({
    where: { id },
    data: updateData,
    include: {
      referrer: { select: { id: true, name: true, business: true, role: true } },
    },
  })

  // Sync old week if referrer or week changed
  const newReferrerId = (referrerId ?? current.referrerId) as string
  const newWeek = (updateData.week ?? current.week) as string
  const newWeekDate = (updateData.weekDate ?? current.weekDate) as Date
  await syncVisitorCount(newReferrerId, newWeek, newWeekDate)
  // If referrer or week changed, also sync old values
  if (current.referrerId !== newReferrerId || current.week !== newWeek) {
    await syncVisitorCount(current.referrerId as string, current.week as string, current.weekDate as Date)
  }

  return NextResponse.json(visitor)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  const canEdit =
    accessLevel === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const visitor = await (db as any).visitor.findUnique({ where: { id } })
  if (!visitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await (db as any).visitor.delete({ where: { id } })
  await syncVisitorCount(visitor.referrerId as string, visitor.week as string, visitor.weekDate as Date)

  return NextResponse.json({ success: true })
}
