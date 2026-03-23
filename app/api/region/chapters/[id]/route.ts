import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'

function isRegionAdmin(accessLevel: string) {
  return accessLevel === 'regionAdmin' || accessLevel === 'platform'
}

async function getChapterAndAssert(id: string, regionId: string | null) {
  const chapter = await db.chapter.findUnique({ where: { id } })
  if (!chapter) return null
  // regionAdmin can only manage their own region's chapters
  if (regionId && chapter.regionId !== regionId) return null
  return chapter
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const chapter = await getChapterAndAssert(id, session.user.regionId)
  if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  return NextResponse.json(chapter)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await getChapterAndAssert(id, session.user.regionId)
  if (!existing) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  const body = await request.json()
  const { name, slug, city, meetingDay, meetingTime, logoUrl, isActive } = body

  const slugClean = slug ? String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-') : existing.slug
  if (slugClean !== existing.slug) {
    const taken = await db.chapter.findFirst({ where: { slug: slugClean, id: { not: id } } })
    if (taken) return NextResponse.json({ error: `Slug "${slugClean}" is already taken` }, { status: 409 })
  }

  const chapter = await db.chapter.update({
    where: { id },
    data: {
      name: name ? String(name).trim() : existing.name,
      slug: slugClean,
      city: city !== undefined ? (city || null) : existing.city,
      meetingDay: meetingDay !== undefined ? (meetingDay || null) : existing.meetingDay,
      meetingTime: meetingTime !== undefined ? (meetingTime || null) : existing.meetingTime,
      logoUrl: logoUrl !== undefined ? (logoUrl || null) : existing.logoUrl,
      isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
    },
  })

  return NextResponse.json(chapter)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await getChapterAndAssert(id, session.user.regionId)
  if (!existing) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

  // Safety: check if chapter has members
  const memberCount = await db.user.count({ where: { chapterId: id, ...NON_ADMIN_FILTER } })
  if (memberCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete chapter with ${memberCount} active member${memberCount !== 1 ? 's' : ''}. Deactivate it instead.` },
      { status: 409 }
    )
  }

  await db.chapter.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
