import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import Papa from 'papaparse'

interface CSVRow {
  name?: string
  email?: string
  phone?: string
  business?: string
  category?: string
  role?: string
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const text = await file.text()
  const parsed = Papa.parse<CSVRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: 'CSV parse error', details: parsed.errors }, { status: 400 })
  }

  const rows = parsed.data.filter((row) => row.name && row.email)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid rows found. CSV must have name and email columns.' }, { status: 400 })
  }

  // Hash passwords in parallel
  const membersToCreate = await Promise.all(
    rows.map(async (row) => {
      const rawPhone = row.phone?.replace(/\D/g, '') ?? ''
      const rawPassword = rawPhone.slice(-6) || 'Oscar2024!'
      const hashedPassword = await bcrypt.hash(rawPassword, 10)
      return {
        name: row.name!.trim(),
        email: row.email!.trim().toLowerCase(),
        phone: row.phone?.trim() || null,
        business: row.business?.trim() || null,
        category: row.category?.trim() || null,
        role: row.role?.trim() || 'member',
        password: hashedPassword,
        chapterId,
      }
    })
  )

  const result = await db.user.createMany({
    data: membersToCreate,
    skipDuplicates: true,
  })

  return NextResponse.json({
    success: true,
    created: result.count,
    skipped: rows.length - result.count,
    total: rows.length,
  })
}
