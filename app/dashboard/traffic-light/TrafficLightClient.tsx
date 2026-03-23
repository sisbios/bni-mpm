'use client'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { computeTrafficScore, TRAFFIC_COLORS, type PalmsRow } from '@/lib/traffic-light'
import { TrendingUp, ChevronDown, ChevronUp, X, Check, Search } from 'lucide-react'

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
  scoreEntriesThisWeek: PalmsEntry[]
  allPalms: PalmsEntry[]
  currentWeek: string
  weeks: { week: string; label: string; monday: Date }[]
  canEdit: boolean
}

const CARD_STYLE = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

const TL_LABELS = { green: 'Green', yellow: 'Yellow', red: 'Red', black: 'Black' }
const TL_BG = {
  green:  'rgba(16,185,129,0.15)',
  yellow: 'rgba(245,158,11,0.15)',
  red:    'rgba(204,0,0,0.15)',
  black:  'rgba(107,114,128,0.15)',
}

type ScoreEditState = {
  referrals: number
  ceus: number
  tyfcbAmount: number
}

function emptyScoreEdit(): ScoreEditState {
  return { referrals: 0, ceus: 0, tyfcbAmount: 0 }
}

function fromEntry(e: PalmsEntry): ScoreEditState {
  return { referrals: e.referrals, ceus: e.ceus, tyfcbAmount: e.tyfcbAmount }
}

// Traffic popup with score breakdown
function TrafficPopup({ member, score, onClose }: {
  member: Member
  score: ReturnType<typeof computeTrafficScore>
  onClose: () => void
}) {
  const hex = TRAFFIC_COLORS[score.color]
  const [tipsOpen, setTipsOpen] = useState(false)
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={onClose}>
      <div style={{
        ...CARD_STYLE, maxWidth: '440px', width: '100%', padding: '28px',
        border: `1px solid ${hex}40`,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>{member.name}</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Traffic Light Score — Last 26 Weeks</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: TL_BG[score.color], borderRadius: '10px', marginBottom: '20px', border: `1px solid ${hex}30` }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: hex, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: '800', fontSize: '22px', color: score.color === 'yellow' ? '#000' : '#fff', boxShadow: `0 0 24px ${hex}80` }}>{score.total}</div>
          <div style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>{score.label}</div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>{score.totalWeeksTracked} weeks of data recorded</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: '700' }}>Score Breakdown</div>
          {[
            { label: 'Referrals',    pts: score.referrals,    max: 20, raw: `${score.rawReferrals} total`,                       color: '#3B82F6', tiers: '1→5 · 6→10 · 10→15 · 14→20' },
            { label: 'Visitors',     pts: score.visitors,     max: 20, raw: `${score.rawVisitors} total`,                        color: '#F59E0B', tiers: '1→5 · 5→10 · 11→15 · 17→20' },
            { label: 'TYFCB',        pts: score.tyfcb,        max: 15, raw: `₹${score.rawTyfcb.toLocaleString('en-IN')}`,        color: '#C9A84C', tiers: '₹4.97L→5 · ₹9.97L→10 · ₹19.97L→15' },
            { label: 'Training',     pts: score.training,     max: 15, raw: `${score.rawTraining} sessions`,                     color: '#EC4899', tiers: '1→5 · 2→10 · 3→15' },
            { label: 'Testimonials', pts: score.testimonials, max: 10, raw: `${score.rawTestimonials} given`,                    color: '#8B5CF6', tiers: '1→5 · 2→10' },
            { label: 'Absence',      pts: score.absence,      max: 15, raw: `${score.rawAbsent} absent (medical exempt)`,        color: '#10B981', tiers: '-5 per absence · starts 15' },
            { label: 'Late Arrival', pts: score.late,         max: 5,  raw: `${score.rawLate} late`,                             color: '#6B7280', tiers: '0 lates → 5 pts' },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600' }}>{item.label} <span style={{ color: '#4B5563', fontWeight: '400' }}>({item.tiers})</span></span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.pts}/{item.max} <span style={{ color: '#6B7280', fontWeight: '400' }}>· {item.raw}</span></span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.pts / item.max) * 100}%`, background: item.color, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
        {score.tips.length > 0 && (
          <div style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <button
              onClick={() => setTipsOpen((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                To Improve ({score.tips.length})
              </span>
              {tipsOpen ? <ChevronUp size={14} style={{ color: '#C9A84C' }} /> : <ChevronDown size={14} style={{ color: '#C9A84C' }} />}
            </button>
            {tipsOpen && (
              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.1)' }}>
                {score.tips.map((tip, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '5px', paddingLeft: '12px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#C9A84C' }}>→</span>{tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrafficLightClient({ members, scoreEntriesThisWeek, allPalms, currentWeek, weeks, canEdit }: Props) {
  const [activeTab, setActiveTab] = useState<'entry' | 'scores'>('entry')
  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [weekEntries, setWeekEntries] = useState<Map<string, PalmsEntry>>(
    () => new Map(scoreEntriesThisWeek.map((e) => [e.userId, e]))
  )
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editState, setEditState] = useState<ScoreEditState>(emptyScoreEdit())
  const [saving, setSaving] = useState(false)
  const [trafficPopup, setTrafficPopup] = useState<Member | null>(null)
  const [search, setSearch] = useState('')

  async function changeWeek(week: string) {
    setSelectedWeek(week)
    setEditingUserId(null)
    const res = await fetch(`/api/palms?week=${encodeURIComponent(week)}`)
    if (res.ok) {
      const data: PalmsEntry[] = await res.json()
      setWeekEntries(new Map(data.map((e) => [e.userId, e])))
    }
  }

  // Compute traffic light scores from allPalms
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
    setEditState(existing ? fromEntry(existing) : emptyScoreEdit())
    setEditingUserId(member.id)
  }

  async function saveScores(member: Member) {
    setSaving(true)
    const weekInfo = weeks.find((w) => w.week === selectedWeek)
    const monday = weekInfo?.monday ?? new Date()
    const res = await fetch('/api/palms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: member.id,
        week: selectedWeek,
        weekDate: monday.toISOString(),
        referrals: Number(editState.referrals),
        ceus: Number(editState.ceus),
        tyfcbAmount: Number(editState.tyfcbAmount),
      }),
    })
    if (res.ok) {
      const saved: PalmsEntry = await res.json()
      setWeekEntries((prev) => new Map(prev).set(member.id, saved))
      setEditingUserId(null)
      toast.success(`Scores saved for ${member.name}`)
    } else {
      toast.error('Failed to save scores')
    }
    setSaving(false)
  }

  const filteredMembers = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.business ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const greenCount  = [...memberScores.values()].filter((s) => s.color === 'green').length
  const yellowCount = [...memberScores.values()].filter((s) => s.color === 'yellow').length
  const redCount    = [...memberScores.values()].filter((s) => s.color === 'red').length
  const blackCount  = [...memberScores.values()].filter((s) => s.color === 'black').length

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <TrendingUp size={22} style={{ color: '#C9A84C' }} />
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '3px', color: '#fff' }}>
            Traffic Light
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
          Head table enters Referrals, Training &amp; TYFCB per member each week. Scores update automatically.
        </p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Green',  value: greenCount,  color: '#10B981' },
          { label: 'Yellow', value: yellowCount, color: '#F59E0B' },
          { label: 'Red',    value: redCount,    color: '#CC0000' },
          { label: 'Black',  value: blackCount,  color: '#6B7280' },
          { label: 'Total',  value: members.length, color: '#C9A84C' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...CARD_STYLE, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', color: stat.color, lineHeight: '1' }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'entry',  label: canEdit ? 'Score Entry'    : 'This Week' },
          { key: 'scores', label: 'Traffic Light Scores' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as 'entry' | 'scores')}
            style={{
              padding: '8px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: activeTab === tab.key ? '#C9A84C' : '#6B7280',
              fontWeight: activeTab === tab.key ? '700' : '500',
              fontSize: '13px', transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Score Entry tab */}
      {activeTab === 'entry' && (
        <div style={CARD_STYLE}>
          {/* Week selector */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600' }}>Week:</span>
            <div style={{ position: 'relative' }}>
              <select value={selectedWeek} onChange={(e) => changeWeek(e.target.value)}
                style={{ background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '7px', padding: '7px 32px 7px 12px', fontSize: '13px', fontWeight: '600', outline: 'none', cursor: 'pointer', appearance: 'none', colorScheme: 'dark' }}>
                {weeks.map((w) => (
                  <option key={w.week} value={w.week} style={{ background: '#0d1324', color: '#fff' }}>
                    {w.week} — {w.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
            </div>
            {!canEdit && (
              <span style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
                View only — head table can edit
              </span>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Member', 'Score', 'Referrals', 'Training', 'TYFCB ₹', ...(canEdit ? ['Actions'] : [])].map((h) => (
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
                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isEditing ? 'rgba(201,168,76,0.04)' : 'transparent' }}>
                      {/* Member */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>{member.name}</div>
                        {member.business && <div style={{ fontSize: '11px', color: '#6B7280' }}>{member.business}</div>}
                      </td>
                      {/* Score dot */}
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => setTrafficPopup(member)}
                          style={{ width: '30px', height: '30px', borderRadius: '50%', background: tlHex, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', color: sc.color === 'yellow' ? '#000' : '#fff', boxShadow: `0 0 8px ${tlHex}60`, cursor: 'pointer' }}
                          title={`Score: ${sc.total} — click for details`}>{sc.total}</button>
                      </td>

                      {isEditing ? (
                        <>
                          <td style={{ padding: '6px 10px' }}>
                            <input type="number" min={0} value={editState.referrals}
                              onChange={(e) => setEditState((s) => ({ ...s, referrals: Number(e.target.value) }))}
                              style={{ background: 'rgba(6,10,20,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '5px', padding: '5px 6px', fontSize: '12px', width: '65px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input type="number" min={0} value={editState.ceus}
                              onChange={(e) => setEditState((s) => ({ ...s, ceus: Number(e.target.value) }))}
                              style={{ background: 'rgba(6,10,20,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '5px', padding: '5px 6px', fontSize: '12px', width: '65px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <input type="number" min={0} value={editState.tyfcbAmount}
                              onChange={(e) => setEditState((s) => ({ ...s, tyfcbAmount: Number(e.target.value) }))}
                              style={{ background: 'rgba(6,10,20,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '5px', padding: '5px 6px', fontSize: '12px', width: '100px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => saveScores(member)} disabled={saving}
                                style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} /> Save
                              </button>
                              <button onClick={() => setEditingUserId(null)}
                                style={{ padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px' }}>
                                <X size={12} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Referrals */}
                          <td style={{ padding: '10px 14px', color: entry?.referrals ? '#3B82F6' : '#4B5563', fontWeight: entry?.referrals ? '600' : '400' }}>
                            {entry?.referrals ?? '—'}
                          </td>
                          {/* Training */}
                          <td style={{ padding: '10px 14px', color: entry?.ceus ? '#EC4899' : '#4B5563', fontWeight: entry?.ceus ? '600' : '400' }}>
                            {entry?.ceus ?? '—'}
                          </td>
                          {/* TYFCB */}
                          <td style={{ padding: '10px 14px', color: entry?.tyfcbAmount ? '#C9A84C' : '#4B5563', fontWeight: entry?.tyfcbAmount ? '600' : '400' }}>
                            {entry?.tyfcbAmount ? `₹${Number(entry.tyfcbAmount).toLocaleString('en-IN')}` : '—'}
                          </td>
                          {canEdit && (
                            <td style={{ padding: '10px 14px' }}>
                              <button onClick={() => startEdit(member)}
                                style={{ padding: '5px 12px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.12s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                              >
                                {entry ? 'Edit' : 'Enter'}
                              </button>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Traffic Light Scores tab */}
      {activeTab === 'scores' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input placeholder="Search member..." value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '9px 14px 9px 32px', fontSize: '13px', outline: 'none', width: '260px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {filteredMembers.map((member) => {
              const sc = memberScores.get(member.id)!
              const hex = TRAFFIC_COLORS[sc.color]
              return (
                <div key={member.id} style={{ ...CARD_STYLE, padding: '16px 20px', cursor: 'pointer' }} onClick={() => setTrafficPopup(member)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: hex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', color: sc.color === 'yellow' ? '#000' : '#fff', boxShadow: `0 0 16px ${hex}60`, flexShrink: 0 }}>{sc.total}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.business ?? member.role}</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', fontWeight: '700', background: TL_BG[sc.color], color: hex }}>{TL_LABELS[sc.color]}</span>
                  </div>

                  {/* Mini bar chart */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    {[
                      { v: sc.referrals,    c: '#3B82F6', l: 'R',  max: 20 },
                      { v: sc.visitors,     c: '#F59E0B', l: 'V',  max: 20 },
                      { v: sc.tyfcb,        c: '#C9A84C', l: '₹',  max: 15 },
                      { v: sc.training,     c: '#EC4899', l: 'T',  max: 15 },
                      { v: sc.testimonials, c: '#8B5CF6', l: 'Te', max: 10 },
                      { v: sc.absence,      c: '#10B981', l: 'At', max: 15 },
                      { v: sc.late,         c: '#6B7280', l: 'L',  max: 5  },
                    ].map((bar) => (
                      <div key={bar.l} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: '30px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ width: '100%', height: `${(bar.v / bar.max) * 100}%`, background: bar.c, borderRadius: '3px 3px 0 0', minHeight: bar.v > 0 ? '3px' : '0' }} />
                        </div>
                        <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px', fontWeight: '700' }}>{bar.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', textAlign: 'right' }}>{sc.totalWeeksTracked} weeks · click for details</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Traffic popup */}
      {trafficPopup && (
        <TrafficPopup
          member={trafficPopup}
          score={memberScores.get(trafficPopup.id)!}
          onClose={() => setTrafficPopup(null)}
        />
      )}
    </div>
  )
}
