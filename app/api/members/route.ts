import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const members = await db.user.findMany({
    where: { isActive: true, chapterId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      business: true,
      category: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          achievements: true,
          tasks: true,
          contactSphere: true,
        },
      },
    },
  })

  return NextResponse.json(members)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const body = await request.json()
  const { name, email, phone, business, category, role, password } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
  }

  const rawPassword = password || (phone ? phone.replace(/\D/g, '').slice(-6) : 'Oscar2024!')
  const hashedPassword = await bcrypt.hash(rawPassword, 10)

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      business,
      category,
      role: role || 'member',
      password: hashedPassword,
      chapterId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      business: true,
      category: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
