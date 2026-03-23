import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function isRegionAdmin(accessLevel: string) {
  return accessLevel === 'regionAdmin' || accessLevel === 'platform'
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const regionId = session.user.regionId

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    orderBy: { name: 'asc' },
    include: { region: { select: { name: true, slug: true } } },
  })

  return NextResponse.json(chapters)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const regionId = session.user.regionId
  if (!regionId) return NextResponse.json({ error: 'No region assigned to this admin' }, { status: 400 })

  const body = await request.json()
  const { name, slug, city, meetingDay, meetingTime, logoUrl } = body

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const slugClean = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-')

  const existing = await db.chapter.findUnique({ where: { slug: slugClean } })
  if (existing) return NextResponse.json({ error: `Slug "${slugClean}" is already taken` }, { status: 409 })

  const chapter = await db.chapter.create({
    data: {
      regionId,
      name: String(name).trim(),
      slug: slugClean,
      city: city ? String(city).trim() : null,
      meetingDay: meetingDay || null,
      meetingTime: meetingTime || null,
      logoUrl: logoUrl || null,
    },
  })

  return NextResponse.json(chapter, { status: 201 })
}
