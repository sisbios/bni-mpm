import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function isRegionAdmin(accessLevel: string) {
  return accessLevel === 'regionAdmin' || accessLevel === 'platform'
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (!isRegionAdmin(accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const region = regionId
    ? await db.region.findUnique({ where: { id: regionId } })
    : await db.region.findFirst({ where: { isActive: true } })

  if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 })

  return NextResponse.json(region)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (!isRegionAdmin(accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!regionId) return NextResponse.json({ error: 'No region assigned' }, { status: 400 })

  const body = await request.json()
  const { name, slug, logoUrl } = body

  const slugClean = slug ? String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-') : undefined
  if (slugClean) {
    const taken = await db.region.findFirst({ where: { slug: slugClean, id: { not: regionId } } })
    if (taken) return NextResponse.json({ error: `Slug "${slugClean}" is already taken` }, { status: 409 })
  }

  const region = await db.region.update({
    where: { id: regionId },
    data: {
      ...(name ? { name: String(name).trim() } : {}),
      ...(slugClean ? { slug: slugClean } : {}),
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
    },
  })

  return NextResponse.json(region)
}
