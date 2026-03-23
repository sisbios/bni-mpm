import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Members can only view their own profile
  if (( session.user.accessLevel ?? 'member') === 'member' && session.user.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      business: true,
      category: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { achievements: true, tasks: true, contactSphere: true },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Members can only update their own profile (limited fields)
  if (( session.user.accessLevel ?? 'member') === 'member' && session.user.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, phone, business, category, role, isActive, password, avatar, professionalPhoto, membershipValidTill, joinedAt } = body

  // Members cannot change their own role
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (business !== undefined) updateData.business = business
  if (category !== undefined) updateData.category = category
  if (avatar !== undefined) updateData.avatar = avatar
  if (professionalPhoto !== undefined) updateData.professionalPhoto = professionalPhoto

  // Email update — check uniqueness
  if (email !== undefined && email !== '') {
    const existing = await db.user.findFirst({ where: { email, NOT: { id } } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    updateData.email = email
  }

  const canManage = (session.user.accessLevel ?? 'member') === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')
  if (canManage) {
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (membershipValidTill !== undefined)
      updateData.membershipValidTill = membershipValidTill ? new Date(membershipValidTill) : null
    if (joinedAt !== undefined)
      updateData.joinedAt = joinedAt ? new Date(joinedAt) : null
  }

  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  const user = await db.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      business: true,
      category: true,
      avatar: true,
      isActive: true,
    },
  })

  return NextResponse.json(user)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Soft delete
  await db.user.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
