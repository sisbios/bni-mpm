import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.contactSphere.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (( session.user.accessLevel ?? 'member') === 'member' && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { contactName, phone, email, business, relationship, category, address, notes } = body

  const updateData: Record<string, unknown> = {}
  if (contactName !== undefined) updateData.contactName = contactName
  if (phone !== undefined) updateData.phone = phone
  if (email !== undefined) updateData.email = email
  if (business !== undefined) updateData.business = business
  if (relationship !== undefined) updateData.relationship = relationship
  if (category !== undefined) updateData.category = category
  if (address !== undefined) updateData.address = address
  if (notes !== undefined) updateData.notes = notes

  const contact = await db.contactSphere.update({ where: { id }, data: updateData })
  return NextResponse.json(contact)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.contactSphere.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (( session.user.accessLevel ?? 'member') === 'member' && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.contactSphere.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
