import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, avatar: true, business: true, category: true, role: true, phone: true, professionalPhoto: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(user)
}
