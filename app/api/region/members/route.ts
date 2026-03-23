import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapterId')
  const q = searchParams.get('q')

  // Resolve chapter IDs in this region
  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true },
  })
  const regionChapterIds = chapters.map((c) => c.id)

  const where: Record<string, unknown> = {
    chapterId: chapterId && regionChapterIds.includes(chapterId)
      ? chapterId
      : { in: regionChapterIds },
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { business: { contains: q, mode: 'insensitive' } },
    ]
  }

  const members = await db.user.findMany({
    where,
    orderBy: [{ chapterId: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, accessLevel: true, business: true,
      chapterId: true, isActive: true, joinedAt: true,
    },
  })

  return NextResponse.json(members)
}
