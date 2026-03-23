import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const week = searchParams.get('week')
  const weeks = searchParams.get('weeks') // comma-separated weeks
  const last26 = searchParams.get('last26') === 'true'

  const accessLevel = session.user.accessLevel ?? 'member'

  // Members can only see their own PALMS data
  const targetUserId =
    accessLevel === 'member' ? session.user.id : userId || undefined

  const whereClause: Record<string, unknown> = {}
  if (targetUserId) whereClause.userId = targetUserId

  if (week) {
    whereClause.week = week
  } else if (weeks) {
    whereClause.week = { in: weeks.split(',') }
  } else if (last26) {
    // Return last 26 weeks ordered by weekDate desc
  }

  const entries = await db.palmsEntry.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, business: true } },
    },
    orderBy: { weekDate: 'desc' },
    take: last26 ? 26 : undefined,
  })

  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  // Only officers/admins can create PALMS entries
  if (accessLevel === 'member') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, week, weekDate, attended, substitute, late, medical, referrals, visitors, testimonials, oneToOnes, ceus, tyfcbAmount, notes } = body

  if (!userId || !week || !weekDate) {
    return NextResponse.json({ error: 'userId, week and weekDate are required' }, { status: 400 })
  }

  // Build selective update — only include fields that were actually sent
  const updateData: Record<string, unknown> = {}
  if (attended    !== undefined) updateData.attended    = attended
  if (substitute  !== undefined) updateData.substitute  = substitute
  if (late        !== undefined) updateData.late        = late
  if (medical     !== undefined) updateData.medical     = medical
  if (referrals   !== undefined) updateData.referrals   = referrals
  if (visitors    !== undefined) updateData.visitors    = visitors
  if (testimonials !== undefined) updateData.testimonials = testimonials
  if (oneToOnes   !== undefined) updateData.oneToOnes   = oneToOnes
  if (ceus        !== undefined) updateData.ceus        = ceus
  if (tyfcbAmount !== undefined) updateData.tyfcbAmount = tyfcbAmount
  if (notes       !== undefined) updateData.notes       = notes

  // Upsert: if entry for this userId+week exists, update only provided fields; otherwise create with defaults
  const entry = await db.palmsEntry.upsert({
    where: { userId_week: { userId, week } },
    create: {
      userId,
      week,
      weekDate: new Date(weekDate),
      attended: attended ?? false,
      substitute: substitute ?? false,
      late: late ?? false,
      medical: medical ?? false,
      referrals: referrals ?? 0,
      visitors: visitors ?? 0,
      testimonials: testimonials ?? 0,
      oneToOnes: oneToOnes ?? 0,
      ceus: ceus ?? 0,
      tyfcbAmount: tyfcbAmount ?? 0,
      notes: notes ?? null,
      createdBy: session.user.id,
    },
    update: updateData,
    include: {
      user: { select: { id: true, name: true, business: true } },
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
