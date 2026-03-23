import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import ContactsPoolClient from './ContactsPoolClient'

export default async function ContactsPoolPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (( session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const contacts = await db.contactSphere.findMany({
    include: { user: { select: { id: true, name: true, business: true } } },
    orderBy: [{ userId: 'asc' }, { contactName: 'asc' }],
  })

  const members = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Contribution counts
  const contribMap: Record<string, number> = {}
  for (const c of contacts) {
    contribMap[c.userId] = (contribMap[c.userId] ?? 0) + 1
  }

  return (
    <ContactsPoolClient
      initialContacts={contacts.map((c) => ({
        id: c.id,
        contactName: c.contactName,
        phone: c.phone,
        email: c.email,
        business: c.business,
        relationship: c.relationship,
        category: c.category,
        address: c.address,
        notes: c.notes,
        userId: c.userId,
        contributorName: c.user.name,
        contributorBusiness: c.user.business,
      }))}
      members={members}
      contribMap={contribMap}
    />
  )
}
