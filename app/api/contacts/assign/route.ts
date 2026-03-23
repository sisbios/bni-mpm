import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session || ( session.user.accessLevel ?? 'member') === 'member') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { week } = body
  if (!week) return NextResponse.json({ error: 'week is required' }, { status: 400 })

  // Get all active members
  const members = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  // Get all contacts in the pool
  const allContacts = await db.contactSphere.findMany({
    include: { user: { select: { id: true, name: true } } },
  })

  if (allContacts.length === 0) {
    return NextResponse.json({ error: 'No contacts in pool' }, { status: 400 })
  }

  // Get already-assigned contact sphere tasks this week (to avoid duplicates)
  const existingTasks = await db.weeklyTask.findMany({
    where: { week, contactSphereId: { not: null } },
    select: { userId: true, contactSphereId: true },
  })

  const alreadyAssigned = new Set(existingTasks.map((t) => `${t.userId}:${t.contactSphereId}`))

  // Track how many times each contact has been assigned total (for fair rotation)
  const assignmentCounts = await db.weeklyTask.groupBy({
    by: ['contactSphereId'],
    where: { contactSphereId: { not: null } },
    _count: { contactSphereId: true },
  })
  const countMap = new Map(assignmentCounts.map((r) => [r.contactSphereId!, r._count.contactSphereId]))

  let totalCreated = 0
  const results: { member: string; assigned: number }[] = []

  for (const member of members) {
    // Eligible contacts: not owned by this member, not already assigned this week to this member
    const eligible = allContacts.filter((c) => {
      if (c.userId === member.id) return false
      if (alreadyAssigned.has(`${member.id}:${c.id}`)) return false
      return true
    })

    // Sort by least-assigned first (fair rotation)
    eligible.sort((a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0))

    const toAssign = eligible.slice(0, 5)

    if (toAssign.length === 0) {
      results.push({ member: member.name, assigned: 0 })
      continue
    }

    await db.weeklyTask.createMany({
      data: toAssign.map((c) => ({
        userId: member.id,
        week,
        taskType: 'call',
        contactName: c.contactName,
        phone: c.phone ?? null,
        status: 'pending',
        notes: c.notes ?? null,
        allocatedBy: session.user.id,
        contactSphereId: c.id,
        contributorId: c.userId,
        contributorName: c.user.name,
      })),
    })

    // Mark newly assigned as used (prevent double-assigning in same batch)
    toAssign.forEach((c) => alreadyAssigned.add(`${member.id}:${c.id}`))

    totalCreated += toAssign.length
    results.push({ member: member.name, assigned: toAssign.length })
  }

  return NextResponse.json({ totalCreated, results })
}
