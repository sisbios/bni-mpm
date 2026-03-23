import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Who can edit chapter settings
function canEditChapterSettings(accessLevel: string, role: string) {
  if (accessLevel === 'superadmin') return true
  return ['president', 'vicePresident', 'treasurer'].includes(role)
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await db.chapterSetting.findMany()
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return NextResponse.json(map)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  const role = session.user.role ?? ''

  if (!canEditChapterSettings(accessLevel, role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const results: Record<string, string> = {}

  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'string') continue
    const existing = await db.chapterSetting.findFirst({ where: { key } })
    if (existing) {
      await db.chapterSetting.update({ where: { id: existing.id }, data: { value } })
    } else {
      await db.chapterSetting.create({ data: { key, value } })
    }
    results[key] = value
  }

  return NextResponse.json(results)
}
