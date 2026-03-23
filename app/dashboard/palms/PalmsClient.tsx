'use client'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { computeTrafficScore, TRAFFIC_COLORS, type PalmsRow } from '@/lib/traffic-light'
import { BarChart2, ChevronDown, X, Check, Users, Loader2 } from 'lucide-react'

type Member = {
  id: string
  name: string
  business: string | null
  role: string
  membershipValidTill: Date | string | null
}

type PalmsEntry = {
  id: string
  userId: string
  week: string
  weekDate: string | Date
  attended: boolean
  substitute: boolean
  late: boolean
  medical: boolean
  referrals: number
  visitors: number
  testimonials: number
  oneToOnes: number
  ceus: number
  tyfcbAmount: number
  notes: string | null
}

type Props = {
  members: Member[]
  palmsThisWeek: PalmsEntry[]
  allPalms: PalmsEntry[]
  currentWeek: string
  weeks: { week: string; label: string; monday: Date }[]
  pins: unknown[]
}

const CARD_STYLE = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

// Attendance type → fields
type AttendType = 'present' | 'absent' | 'late' | 'medical' | 'substitute'

function attendTypeFromEntry(e: PalmsEntry): AttendType {
  if (e.medical)    return 'medical'
  if (e.substitute) return 'substitute'
  if (e.attended && e.late) return 'late'
  if (e.attended)   return 'present'
  return 'absent'
}

function fieldsFromAttendType(t: AttendType) {
  return {
    attended:   t === 'present' || t === 'late',
    substitute: t === 'substitute',
    late:       t === 'late',
    medical:    t === 'medical',
  }
}

type RowEditState = {
  attendType: AttendType
  testimonials: number
  notes: string
}

function emptyEdit(): RowEditState {
  return { attendType: 'present', testimonials: 0, notes: '' }
}

function fromEntry(e: PalmsEntry): RowEditState {
  return {
    attendType: attendTypeFromEntry(e),
    testimonials: e.testimonials ?? 0,
    notes: e.notes ?? '',
  }
}

const ATTEND_OPTIONS: { value: AttendType; label: string }[] = [
  { value: 'present',    label: '✓ Present' },
  { value: 'absent',     label: '✗ Absent' },
  { value: 'late',       label: '⏱ Late' },
  { value: 'medical',    label: '🏥 Medical' },
  { value: 'substitute', label: '↔ Substitute' },
]

const ATTEND_STYLE: Record<AttendType, { bg: string; color: string; label: string }> = {
  present:    { bg: 'rgba(16,185,129,0.12)',   color: '#10B981', label: 'Present' },
  absent:     { bg: 'rgba(204,0,0,0.10)',       color: '#CC0000', label: 'Absent' },
  late:       { bg: 'rgba(107,114,128,0.15)',   color: '#9CA3AF', label: 'Late' },
  medical:    { bg: 'rgba(59,130,246,0.12)',    color: '#3B82F6', label: 'Medical' },
  substitute: { bg: 'rgba(245,158,11,0.12)',    color: '#F59E0B', label: 'Sub' },
}

export default function PalmsClient({ members, palmsThisWeek, allPalms, currentWeek, weeks }: Props) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [weekEntries, setWeekEntries] = useState<Map<string, PalmsEntry>>(
    () => new Map(palmsThisWeek.map((e) => [e.userId, e]))
  )
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editState, setEditState] = useState<RowEditState>(emptyEdit())
  const [saving, setSaving] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  async function changeWeek(week: string) {
    setSelectedWeek(week)
    setEditingUserId(null)
    const res = await fetch(`/api/palms?week=${encodeURIComponent(week)}`)
    if (res.ok) {
      const data: PalmsEntry[] = await res.json()
      setWeekEntries(new Map(data.map((e) => [e.userId, e])))
    }
  }

  // Compute traffic light scores from allPalms (for score column only)
  const memberScores = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeTrafficScore>>()
    for (const member of members) {
      const entries: PalmsRow[] = allPalms
        .filter((e) => e.userId === member.id)
        .sort((a, b) => new Date(b.weekDate).getTime() - new Date(a.weekDate).getTime())
        .slice(0, 26)
        .map((e) => ({
          attended: e.attended,
          substitute: e.substitute,
          late: e.late,
          medical: (e as any).medical ?? false,
          referrals: e.referrals,
          visitors: e.visitors,
          testimonials: (e as any).testimonials ?? 0,
          oneToOnes: e.oneToOnes,
          ceus: e.ceus,
          tyfcbAmount: e.tyfcbAmount,
        }))
      map.set(member.id, computeTrafficScore(entries))
    }
    return map
  }, [members, allPalms])

  function startEdit(member: Member) {
    const existing = weekEntries.get(member.id)
    setEditState(existing ? fromEntry(existing) : emptyEdit())
    setEditingUserId(member.id)
  }

  async function saveEntry(member: Member) {
    setSaving(true)
    const weekInfo = weeks.find((w) => w.week === selectedWeek)
    const monday = weekInfo?.monday ?? new Date()
    const attend = fieldsFromAttendType(editState.attendType)
    const res = await fetch('/api/palms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: member.id,
        week: selectedWeek,
        weekDate: monday.toISOString(),
        ...attend,
        testimonials: Number(editState.testimonials),
        notes: editState.notes || null,
      }),
    })
    if (res.ok) {
      const saved: PalmsEntry = await res.json()
      setWeekEntries((prev) => new Map(prev).set(member.id, saved))
      setEditingUserId(null)
      toast.success(`Attendance saved for ${member.name}`)
    } else {
      toast.error('Failed to save entry')
    }
    setSaving(false)
  }

  function cancelEdit() {
    setEditingUserId(null)
    setEditState(emptyEdit())
  }

  async function markAllPresent() {
    setBulkLoading(true)
    setEditingUserId(null)
    const weekInfo = weeks.find((w) => w.week === selectedWeek)
    const monday = weekInfo?.monday ?? new Date()
    let successCount = 0
    const updates = new Map(weekEntries)
    for (const member of members) {
      try {
        const res = await fetch('/api/palms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: member.id,
            week: selectedWeek,
            weekDate: monday.toISOString(),
            attended: true, substitute: false, late: false, medical: false,
            testimonials: weekEntries.get(member.id)?.testimonials ?? 0,
            notes: weekEntries.get(member.id)?.notes ?? null,
          }),
        })
        if (res.ok) {
          const saved: PalmsEntry = await res.json()
          updates.set(member.id, saved)
          successCount++
        }
      } catch { /* skip failed */ }
    }
    setWeekEntries(updates)
    setBulkLoading(false)
    toast.success(`${successCount} members marked present — edit individuals to correct`)
  }

  const enteredThisWeek = weekEntries.size
  const greenCount  = [...memberScores.values()].filter((s) => s.color === 'green').length
  const yellowCount = [...memberScores.values()].filter((s) => s.color === 'yellow').length
  const redCount    = [...memberScores.values()].filter((s) => s.color === 'red').length
  const blackCount  = [...memberScores.values()].filter((s) => s.color === 'black').length

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <BarChart2 size={22} style={{ color: '#C9A84C' }} />
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '3px', color: '#fff' }}>
            PALMS Weekly Entry
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
          Record weekly attendance, visitors brought, and testimonials given.
          Referrals, Training &amp; TYFCB are entered in the <strong style={{ color: '#C9A84C' }}>Traffic Light</strong> page by head table.
        </p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'This Week', value: enteredThisWeek, color: '#C9A84C' },
          { label: 'Green',     value: greenCount,       color: '#10B981' },
          { label: 'Yellow',    value: yellowCount,      color: '#F59E0B' },
          { label: 'Red',       value: redCount,         color: '#CC0000' },
          { label: 'Black',     value: blackCount,       color: '#6B7280' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...CARD_STYLE, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', color: stat.color, lineHeight: '1' }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={CARD_STYLE}>
        {/* Week selector */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600' }}>Week:</span>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedWeek}
              onChange={(e) => changeWeek(e.target.value)}
              style={{
                background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', borderRadius: '7px', padding: '7px 32px 7px 12px',
                fontSize: '13px', fontWeight: '600', outline: 'none', cursor: 'pointer',
                appearance: 'none', colorScheme: 'dark',
              }}
            >
              {weeks.map((w) => (
                <option key={w.week} value={w.week} style={{ background: '#0d1324', color: '#fff' }}>
                  {w.week} — {w.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
          </div>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>{enteredThisWeek}/{members.length} entered</span>
          <button
            onClick={markAllPresent}
            disabled={bulkLoading}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '7px', border: '1px solid rgba(16,185,129,0.3)',
              background: bulkLoading ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.1)',
              color: bulkLoading ? '#4B5563' : '#10B981', cursor: bulkLoading ? 'not-allowed' : 'pointer',
              fontSize: '12px', fontWeight: '700', transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}
          >
            {bulkLoading
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Marking...</>
              : <><Users size={13} /> Mark All Present</>
            }
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Member', 'Score', 'Attendance', 'Testimonials', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6B7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const entry = weekEntries.get(member.id)
                const sc = memberScores.get(member.id)!
                const tlHex = TRAFFIC_COLORS[sc.color]
                const isEditing = editingUserId === member.id
                const attendType = entry ? attendTypeFromEntry(entry) : null
                const ast = attendType ? ATTEND_STYLE[attendType] : null
                return (
                  <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isEditing ? 'rgba(201,168,76,0.04)' : 'transparent' }}>
                    {/* Member */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>{member.name}</div>
                      {member.business && <div style={{ fontSize: '11px', color: '#6B7280' }}>{member.business}</div>}
                    </td>
                    {/* Score dot */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%', background: tlHex,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '800', fontSize: '11px', color: sc.color === 'yellow' ? '#000' : '#fff',
                        boxShadow: `0 0 8px ${tlHex}60`,
                      }} title={`Score: ${sc.total}`}>{sc.total}</div>
                    </td>

                    {isEditing ? (
                      <>
                        {/* Attendance select */}
                        <td style={{ padding: '6px 10px' }}>
                          <select
                            value={editState.attendType}
                            onChange={(e) => setEditState((s) => ({ ...s, attendType: e.target.value as AttendType }))}
                            style={{ background: 'rgba(6,10,20,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', colorScheme: 'dark', minWidth: '110px' }}
                          >
                            {ATTEND_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                        {/* Testimonials */}
                        <td style={{ padding: '6px 10px' }}>
                          <input type="number" min={0} value={editState.testimonials}
                            onChange={(e) => setEditState((s) => ({ ...s, testimonials: Number(e.target.value) }))}
                            style={{ background: 'rgba(6,10,20,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '5px', padding: '5px 6px', fontSize: '12px', width: '60px', outline: 'none' }}
                          />
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => saveEntry(member)} disabled={saving}
                              style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={12} /> Save
                            </button>
                            <button onClick={cancelEdit}
                              style={{ padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px' }}>
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Attendance badge */}
                        <td style={{ padding: '10px 14px' }}>
                          {ast ? (
                            <span style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '5px', fontWeight: '600', background: ast.bg, color: ast.color }}>
                              {ast.label}
                            </span>
                          ) : <span style={{ color: '#4B5563', fontSize: '12px' }}>—</span>}
                        </td>
                        {/* Testimonials */}
                        <td style={{ padding: '10px 14px', color: entry ? '#8B5CF6' : '#4B5563' }}>
                          {entry ? (entry.testimonials ?? '—') : '—'}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '10px 14px' }}>
                          <button onClick={() => startEdit(member)}
                            style={{ padding: '5px 12px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.12s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                          >
                            {entry ? 'Edit' : 'Enter'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
