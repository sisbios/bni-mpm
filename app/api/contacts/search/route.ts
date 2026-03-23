import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (!q) return NextResponse.json([])

  const contacts = await db.contactSphere.findMany({
    where: {
      chapterId,
      OR: [
        { contactName: { contains: q, mode: 'insensitive' } },
        { business:     { contains: q, mode: 'insensitive' } },
        { phone:        { contains: q } },
      ],
    },
    select: {
      id: true,
      contactName: true,
      phone: true,
      email: true,
      business: true,
      category: true,
      userId: true,
    },
    take: 20,
    orderBy: { contactName: 'asc' },
  })

  return NextResponse.json(contacts)
}
