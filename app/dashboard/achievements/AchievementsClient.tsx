'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Trophy, Star, Award, BookOpen, Target, Gem,
  CheckCircle, Circle, Trash2, Plus, X, Edit2,
} from 'lucide-react'

type Achievement = {
  id: string
  userId: string
  category: string
  description: string | null
  points: number
  date: string
  verified: boolean
  verifiedBy: string | null
  user: { id: string; name: string; business: string | null }
}

type Member = {
  id: string
  name: string
  business: string | null
  avatar: string | null
}

type Props = {
  canManage: boolean
  members: Member[]
}

// ── Award type definitions ───────────────────────────────────────────────────
const AWARD_TYPES: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  chapter_award:  { label: 'Chapter Award',       emoji: '🏆', color: '#C9A84C', bg: 'rgba(201,168,76,0.12)'  },
  member_award:   { label: 'Member Recognition',  emoji: '⭐', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  competition:    { label: 'Competition',          emoji: '🥇', color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
  training:       { label: 'Training & CEU',       emoji: '📚', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  milestone:      { label: 'Milestone',            emoji: '🎯', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  special:        { label: 'Special Recognition',  emoji: '💎', color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
}

function getAwardType(cat: string) {
  return (
    AWARD_TYPES[cat] ?? {
      label: cat.replace(/_/g, ' '),
      emoji: '🏅',
      color: '#9CA3AF',
      bg: 'rgba(156,163,175,0.1)',
    }
  )
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  })
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Add / Edit form state ────────────────────────────────────────────────────
const BLANK_FORM = {
  title: '',
  category: 'chapter_award',
  memberId: '',
  date: new Date().toISOString().split('T')[0],
}

// ── Card component ───────────────────────────────────────────────────────────
function AwardCard({
  a,
  canManage,
  onVerify,
  onDelete,
  onEdit,
}: {
  a: Achievement
  canManage: boolean
  onVerify: (a: Achievement) => void
  onDelete: (id: string) => void
  onEdit: (a: Achievement) => void
}) {
  const aw = getAwardType(a.category)
  const dateStr = new Date(a.date).toLocaleDateString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        background: 'rgba(13,19,36,0.70)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: `1px solid ${a.verified ? aw.color + '30' : 'rgba(255,255,255,0.07)'}`,
        borderTop: `3px solid ${aw.color}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${aw.color}22`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Card body */}
      <div style={{ padding: '16px', flex: 1 }}>
        {/* Category badge row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: aw.color,
              background: aw.bg,
              border: `1px solid ${aw.color}25`,
              borderRadius: '20px',
              padding: '3px 10px',
            }}
          >
            <span style={{ fontSize: '13px' }}>{aw.emoji}</span>
            {aw.label}
          </span>
          {a.verified && (
            <CheckCircle size={16} style={{ color: '#10B981', flexShrink: 0 }} />
          )}
        </div>

        {/* Award title */}
        <div
          style={{
            fontSize: '15px', fontWeight: 700, color: '#ffffff',
            lineHeight: '1.35', marginBottom: '14px',
            fontFamily: 'var(--font-montserrat), sans-serif',
          }}
        >
          {a.description ?? aw.label}
        </div>

        {/* Member row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${aw.color}, ${aw.color}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#000',
            }}
          >
            {getInitials(a.user.name)}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', lineHeight: '1.2' }}>
              {a.user.name}
            </div>
            {a.user.business && (
              <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.2' }}>
                {a.user.business}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{dateStr}</span>

        {canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Verify toggle */}
            <button
              onClick={() => onVerify(a)}
              title={a.verified ? 'Remove verification' : 'Verify'}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontWeight: 500,
                padding: '4px 8px', borderRadius: '5px', cursor: 'pointer',
                border: `1px solid ${a.verified ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: a.verified ? '#10B981' : '#6B7280',
                background: 'none', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {a.verified ? <CheckCircle size={11} /> : <Circle size={11} />}
              {a.verified ? 'Verified' : 'Verify'}
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(a)}
              title="Edit"
              style={{
                width: '26px', height: '26px', borderRadius: '5px',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'none', color: '#6B7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C9A84C'
                e.currentTarget.style.color = '#C9A84C'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = '#6B7280'
              }}
            >
              <Edit2 size={11} />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(a.id)}
              title="Delete"
              style={{
                width: '26px', height: '26px', borderRadius: '5px',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'none', color: '#6B7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#CC0000'
                e.currentTarget.style.color = '#CC0000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = '#6B7280'
              }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
function AwardModal({
  members,
  initial,
  onSave,
  onClose,
}: {
  members: Member[]
  initial: Achievement | null
  onSave: (data: { title: string; category: string; memberId: string; date: string }) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: initial?.description ?? '',
    category: initial?.category ?? 'chapter_award',
    memberId: initial?.userId ?? '',
    date: initial ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!form.title.trim()) return toast.error('Award title required')
    if (!form.memberId) return toast.error('Select a member')
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '14px',
    fontFamily: 'var(--font-montserrat), sans-serif',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px',
    marginBottom: '6px',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%', maxWidth: '480px',
          background: 'rgba(15,22,40,0.98)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={20} style={{ color: '#C9A84C' }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              {initial ? 'Edit Award' : 'Add Award'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Award title */}
          <div>
            <label style={labelStyle}>Award / Recognition Title</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Star Chapter Award Q1 2026"
            />
          </div>

          {/* Category + Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {Object.entries(AWARD_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.emoji} {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                style={{ ...inputStyle, colorScheme: 'dark' }}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          {/* Member */}
          <div>
            <label style={labelStyle}>Recipient Member</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.memberId}
              onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
            >
              <option value="">— Select member —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.business ? ` · ${m.business}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Preview badge */}
          {form.category && (
            <div
              style={{
                padding: '10px 14px', borderRadius: '8px',
                background: getAwardType(form.category).bg,
                border: `1px solid ${getAwardType(form.category).color}25`,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ fontSize: '20px' }}>{getAwardType(form.category).emoji}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                  {form.title || 'Award Title'}
                </div>
                <div style={{ fontSize: '11px', color: getAwardType(form.category).color }}>
                  {getAwardType(form.category).label}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', gap: '10px', justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: '#9CA3AF', cursor: 'pointer',
              fontSize: '13px', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #C9A84C, #a0803a)',
              color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Award'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AchievementsClient({ canManage, members }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Achievement | null>(null)

  useEffect(() => {
    fetch('/api/achievements')
      .then((r) => r.json())
      .then(setAchievements)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(data: {
    title: string; category: string; memberId: string; date: string
  }) {
    if (editTarget) {
      // PATCH
      const res = await fetch(`/api/achievements/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: data.title,
          category: data.category,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAchievements((prev) =>
          prev.map((a) => (a.id === editTarget.id ? { ...a, ...updated } : a))
        )
        toast.success('Award updated')
        setEditTarget(null)
        setShowModal(false)
      }
    } else {
      // POST
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.memberId,
          category: data.category,
          description: data.title,
          points: 1,
          date: data.date,
        }),
      })
      if (res.ok) {
        const newA = await res.json()
        setAchievements((prev) => [newA, ...prev])
        toast.success('Award added!')
        setShowModal(false)
      }
    }
  }

  async function toggleVerify(a: Achievement) {
    const res = await fetch(`/api/achievements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !a.verified }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAchievements((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, ...updated } : x))
      )
      toast.success(updated.verified ? 'Verified' : 'Verification removed')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this award?')) return
    const res = await fetch(`/api/achievements/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAchievements((prev) => prev.filter((a) => a.id !== id))
      toast.success('Deleted')
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const thisYear = new Date().getFullYear()
  const thisYearCount = achievements.filter(
    (a) => new Date(a.date).getFullYear() === thisYear
  ).length
  const chapterAwardCount = achievements.filter((a) => a.category === 'chapter_award').length
  const competitionCount = achievements.filter((a) => a.category === 'competition').length

  const filtered = achievements.filter((a) => {
    if (filter === 'pending' && a.verified) return false
    if (filter === 'verified' && !a.verified) return false
    if (catFilter !== 'all' && a.category !== catFilter) return false
    return true
  })

  // Group by month descending
  const monthMap: Record<string, Achievement[]> = {}
  for (const a of filtered) {
    const key = getMonthKey(a.date)
    if (!monthMap[key]) monthMap[key] = []
    monthMap[key].push(a)
  }
  const sortedMonths = Object.keys(monthMap).sort((a, b) => b.localeCompare(a))

  return (
    <>
      <style>{`
        .ach-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        @media (min-width: 640px) { .ach-stats { grid-template-columns: repeat(4, 1fr); } }
        .ach-cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .ach-cards { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .ach-cards { grid-template-columns: repeat(3, 1fr); } }
        .cat-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; white-space: nowrap; font-family: inherit; }
        .filter-scroll { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        @media (max-width: 480px) { .filter-scroll { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; } }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-montserrat), sans-serif' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '4px', height: '40px', background: 'linear-gradient(180deg, #CC0000, #C9A84C)', borderRadius: '2px', flexShrink: 0 }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '30px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1', margin: 0 }}>
                AWARDS & RECOGNITION
              </h1>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
                Chapter achievements and member recognition hall
              </p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #C9A84C, #a0803a)',
                color: '#000', fontWeight: 700, cursor: 'pointer',
                fontSize: '13px', fontFamily: 'inherit',
              }}
            >
              <Plus size={15} /> Add Award
            </button>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className="ach-stats">
          {[
            { label: 'Total Awards', value: achievements.length, color: '#C9A84C', emoji: '🏅' },
            { label: `${thisYear} Awards`, value: thisYearCount, color: '#F59E0B', emoji: '📅' },
            { label: 'Chapter Awards', value: chapterAwardCount, color: '#CC0000', emoji: '🏆' },
            { label: 'Competitions', value: competitionCount, color: '#F97316', emoji: '🥇' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: 'rgba(13,19,36,0.60)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '10px',
                border: `1px solid ${s.color}22`,
                borderTop: `3px solid ${s.color}`,
                padding: '14px 14px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '2px' }}>{s.emoji}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-bebas), sans-serif', lineHeight: '1' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'verified', 'pending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
                  border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  background: filter === f ? 'linear-gradient(135deg, #CC0000, #990000)' : 'transparent',
                  color: filter === f ? '#ffffff' : '#6B7280',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'all' ? `All (${achievements.length})`
                  : f === 'verified' ? `Verified (${achievements.filter((a) => a.verified).length})`
                  : `Pending (${achievements.filter((a) => !a.verified).length})`}
              </button>
            ))}
          </div>
          {/* Category chips */}
          <div className="filter-scroll">
            <button
              className="cat-chip"
              onClick={() => setCatFilter('all')}
              style={{
                background: catFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: catFilter === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                color: catFilter === 'all' ? '#ffffff' : '#6B7280',
              }}
            >
              All Types
            </button>
            {Object.entries(AWARD_TYPES).map(([key, val]) => {
              const count = achievements.filter((a) => a.category === key).length
              if (count === 0) return null
              return (
                <button
                  key={key}
                  className="cat-chip"
                  onClick={() => setCatFilter(catFilter === key ? 'all' : key)}
                  style={{
                    background: catFilter === key ? val.bg : 'transparent',
                    borderColor: catFilter === key ? val.color + '40' : 'rgba(255,255,255,0.07)',
                    color: catFilter === key ? val.color : '#6B7280',
                  }}
                >
                  {val.emoji} {val.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Timeline ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            <Trophy size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            Loading awards…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center', padding: '60px',
              background: 'rgba(13,19,36,0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Trophy size={36} style={{ margin: '0 auto 12px', color: '#374151', display: 'block' }} />
            <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>
              No awards found{filter !== 'all' ? ` in "${filter}"` : ''}
              {catFilter !== 'all' ? ` for "${getAwardType(catFilter).label}"` : ''}
            </p>
            {canManage && (
              <button
                onClick={() => { setEditTarget(null); setShowModal(true) }}
                style={{
                  marginTop: '16px', padding: '9px 20px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #C9A84C, #a0803a)',
                  color: '#000', fontWeight: 700, cursor: 'pointer',
                  fontSize: '13px', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Plus size={14} /> Add First Award
              </button>
            )}
          </div>
        ) : (
          sortedMonths.map((monthKey) => {
            const items = monthMap[monthKey]
            return (
              <div key={monthKey} style={{ marginBottom: '28px' }}>
                {/* Month divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        fontSize: '12px', fontWeight: 700, color: '#9CA3AF',
                        textTransform: 'uppercase', letterSpacing: '1px',
                      }}
                    >
                      {formatMonthLabel(monthKey)}
                    </span>
                    <span
                      style={{
                        fontSize: '11px', color: '#CC0000',
                        background: 'rgba(204,0,0,0.1)',
                        border: '1px solid rgba(204,0,0,0.2)',
                        padding: '2px 7px', borderRadius: '10px',
                      }}
                    >
                      {items.length} award{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Cards grid */}
                <div className="ach-cards">
                  {items.map((a) => (
                    <AwardCard
                      key={a.id}
                      a={a}
                      canManage={canManage}
                      onVerify={toggleVerify}
                      onDelete={handleDelete}
                      onEdit={(target) => { setEditTarget(target); setShowModal(true) }}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <AwardModal
          members={members}
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
        />
      )}
    </>
  )
}
