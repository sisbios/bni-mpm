'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trophy, Plus, Target, CheckCircle2, Clock, TrendingUp, Star, X, Flag, CalendarDays, Pencil, Trash2 } from 'lucide-react'

type Goal = {
  id: string
  type: 'achievement' | 'milestone'
  title: string
  description: string | null
  category: string
  status: 'upcoming' | 'in_progress' | 'achieved'
  targetDate: string | null
  achievedAt: string | null
  createdAt: string
}

const CATEGORIES = [
  { value: 'sales', label: 'Sales & Revenue', color: '#10B981', icon: '💰' },
  { value: 'growth', label: 'Business Growth', color: '#3B82F6', icon: '📈' },
  { value: 'team', label: 'Team & HR', color: '#8B5CF6', icon: '👥' },
  { value: 'product', label: 'Product / Service', color: '#F59E0B', icon: '🚀' },
  { value: 'award', label: 'Award / Recognition', color: '#C9A84C', icon: '🏆' },
  { value: 'other', label: 'Other', color: '#6B7280', icon: '⭐' },
]

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: Clock },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: TrendingUp },
  achieved: { label: 'Achieved', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2 },
}

const GLASS: React.CSSProperties = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
}

function getCatConfig(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

export default function PortalAchievementsClient({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [tab, setTab] = useState<'all' | 'achievement' | 'milestone'>('all')

  useEffect(() => {
    fetch('/api/business-goals')
      .then((r) => r.json())
      .then(setGoals)
      .finally(() => setLoading(false))
  }, [userId])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    const res = await fetch(`/api/business-goals/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGoals((prev) => prev.filter((g) => g.id !== id))
      toast.success('Deleted')
    }
  }

  async function markAchieved(goal: Goal) {
    const res = await fetch(`/api/business-goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'achieved', achievedAt: new Date().toISOString() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)))
      toast.success('Marked as achieved! 🎉')
    }
  }

  const filtered = goals.filter((g) => tab === 'all' || g.type === tab)
  const achieved = goals.filter((g) => g.status === 'achieved').length
  const inProgress = goals.filter((g) => g.status === 'in_progress').length
  const upcoming = goals.filter((g) => g.status === 'upcoming').length

  return (
    <>
      <style>{`
        .goal-tab { padding: 7px 14px; border-radius: 7px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .goal-card { transition: transform 0.15s, box-shadow 0.15s; }
        .goal-card:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,0,0,0.4) !important; }
      `}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', letterSpacing: '2px', color: '#fff', lineHeight: 1, margin: 0 }}>
                MY ACHIEVEMENTS
              </h1>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px', margin: '2px 0 0' }}>Business goals & milestones</p>
            </div>
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'Achieved', value: achieved, color: '#10B981', icon: CheckCircle2 },
            { label: 'In Progress', value: inProgress, color: '#F59E0B', icon: TrendingUp },
            { label: 'Upcoming', value: upcoming, color: '#6B7280', icon: Target },
          ].map((s) => (
            <div key={s.label} style={{ ...GLASS, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '9px', padding: '4px' }}>
          {([['all', 'All', Star], ['achievement', 'Achievements', Trophy], ['milestone', 'Milestones', Flag]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              className="goal-tab"
              onClick={() => setTab(key)}
              style={{ flex: 1, background: tab === key ? 'rgba(201,168,76,0.12)' : 'transparent', color: tab === key ? '#C9A84C' : '#6B7280', borderBottom: tab === key ? '2px solid #C9A84C' : '2px solid transparent' }}
            >
              <Icon size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              {label}
            </button>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#8B95A3' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...GLASS, padding: '56px', textAlign: 'center', color: '#8B95A3' }}>
            <Trophy size={36} style={{ margin: '0 auto 12px', color: '#4B5563', display: 'block' }} />
            <p style={{ margin: 0 }}>No {tab === 'all' ? 'achievements' : tab + 's'} yet — add your first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((goal) => {
              const cat = getCatConfig(goal.category)
              const st = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.upcoming
              const StatusIcon = st.icon
              return (
                <div key={goal.id} className="goal-card" style={{ ...GLASS, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Category icon */}
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${cat.color}18`, border: `1.5px solid ${cat.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>
                      {cat.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', lineHeight: 1.3 }}>{goal.title}</div>
                          {goal.description && (
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '3px', lineHeight: 1.4 }}>{goal.description}</div>
                          )}
                        </div>
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                          {goal.status !== 'achieved' && (
                            <button
                              onClick={() => markAchieved(goal)}
                              title="Mark as achieved"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)', color: '#10B981', cursor: 'pointer' }}
                            >
                              <CheckCircle2 size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditing(goal); setShowModal(true) }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#6B7280', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id, goal.title)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#6B7280', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#CC0000'; e.currentTarget.style.borderColor = 'rgba(204,0,0,0.3)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Tags row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {/* Status badge */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>
                          <StatusIcon size={9} />
                          {st.label}
                        </span>
                        {/* Type badge */}
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)', textTransform: 'capitalize' }}>
                          {goal.type === 'achievement' ? '🏆 Achievement' : '🎯 Milestone'}
                        </span>
                        {/* Category */}
                        <span style={{ fontSize: '10px', color: cat.color }}>{cat.label}</span>
                        {/* Date */}
                        {(goal.targetDate || goal.achievedAt) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#6B7280' }}>
                            <CalendarDays size={9} />
                            {goal.achievedAt
                              ? new Date(goal.achievedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
                              : goal.targetDate
                                ? `By ${new Date(goal.targetDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                : null}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <GoalModal
          goal={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSuccess={(saved) => {
            if (editing) {
              setGoals((prev) => prev.map((g) => (g.id === saved.id ? saved : g)))
              toast.success('Updated')
            } else {
              setGoals((prev) => [saved, ...prev])
              toast.success('Added!')
            }
            setShowModal(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function GoalModal({ goal, onClose, onSuccess }: { goal: Goal | null; onClose: () => void; onSuccess: (g: Goal) => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: goal?.type ?? 'achievement',
    title: goal?.title ?? '',
    description: goal?.description ?? '',
    category: goal?.category ?? 'other',
    status: goal?.status ?? 'upcoming',
    targetDate: goal?.targetDate ? goal.targetDate.split('T')[0] : '',
    achievedAt: goal?.achievedAt ? goal.achievedAt.split('T')[0] : '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    setLoading(true)
    const url = goal ? `/api/business-goals/${goal.id}` : '/api/business-goals'
    const res = await fetch(url, {
      method: goal ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        targetDate: form.targetDate || null,
        achievedAt: form.achievedAt || null,
      }),
    })
    setLoading(false)
    if (res.ok) onSuccess(await res.json())
    else toast.error('Failed to save')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,10,20,0.7)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '10px', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }} onClick={onClose}>
      <div style={{ background: 'rgba(10,15,28,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.09)', padding: '22px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', letterSpacing: '2px', color: '#fff', margin: 0 }}>
            {goal ? 'EDIT' : 'NEW'} ACHIEVEMENT
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex' }}><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Type selector */}
          <div>
            <label style={lbl}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[{ v: 'achievement', label: '🏆 Achievement', sub: 'Something accomplished' }, { v: 'milestone', label: '🎯 Milestone', sub: 'An upcoming goal' }].map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t.v as 'achievement' | 'milestone' }))}
                  style={{ padding: '9px 10px', borderRadius: '8px', border: `1px solid ${form.type === t.v ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.07)'}`, background: form.type === t.v ? 'rgba(201,168,76,0.1)' : 'transparent', color: form.type === t.v ? '#C9A84C' : '#6B7280', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>{t.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{t.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={lbl}>Title *</label>
            <input style={inp} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder="e.g. Reached ₹10L monthly revenue" />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Details</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="More context or outcome..." rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>

          {/* Category + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={lbl}>Category</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Goal['status'] }))}>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="achieved">Achieved</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {form.type === 'milestone' && (
              <div>
                <label style={lbl}>Target Date</label>
                <input style={inp} type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} />
              </div>
            )}
            {form.status === 'achieved' && (
              <div>
                <label style={lbl}>Achieved On</label>
                <input style={inp} type="date" value={form.achievedAt} onChange={(e) => setForm((p) => ({ ...p, achievedAt: e.target.value }))} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : goal ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
