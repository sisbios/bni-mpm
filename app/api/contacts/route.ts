import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  // Members can only see their own contacts
  const targetUserId = ( session.user.accessLevel ?? 'member') === 'member' ? session.user.id : (userId || session.user.id)

  const contacts = await db.contactSphere.findMany({
    where: { userId: targetUserId, chapterId },
    orderBy: { contactName: 'asc' },
  })

  return NextResponse.json(contacts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const body = await request.json()
  const { contactName, phone, email, business, relationship, category, address, notes, userId } = body

  if (!contactName) {
    return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
  }

  // Members create for themselves; admins can specify userId
  const assignedUserId = ( session.user.accessLevel ?? 'member') === 'member' ? session.user.id : (userId || session.user.id)

  const contact = await db.contactSphere.create({
    data: {
      userId: assignedUserId,
      contactName,
      phone: phone || null,
      email: email || null,
      business: business || null,
      relationship: relationship || null,
      category: category || null,
      address: address || null,
      notes: notes || null,
      chapterId,
    },
  })

  return NextResponse.json(contact, { status: 201 })
}
