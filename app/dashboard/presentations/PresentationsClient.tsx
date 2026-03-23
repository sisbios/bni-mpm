'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Mic2, GraduationCap, AlertCircle, CheckCircle, Clock, User, ChevronDown } from 'lucide-react'

type MeetingSlot = {
  id: string
  eventId: string
  slotType: string
  slotNumber: number
  assignedUserId: string | null
  assignedUserName: string | null
  topic: string | null
  status: string
  event: { id: string; date: string; title: string }
  assignedUser: { id: string; name: string; role: string; avatar: string | null } | null
}

type Member = { id: string; name: string; role: string }

export default function PresentationsClient({
  initialSlots,
  members,
  pendingCount,
}: {
  initialSlots: MeetingSlot[]
  members: Member[]
  pendingCount: number
}) {
  const [slots, setSlots] = useState(initialSlots)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editTopicId, setEditTopicId] = useState<string | null>(null)
  const [topicText, setTopicText] = useState('')

  // Group slots by event
  const grouped = slots.reduce<Record<string, MeetingSlot[]>>((acc, slot) => {
    const key = slot.eventId
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  // Sort event groups by date
  const eventGroups = Object.entries(grouped).sort(
    ([, a], [, b]) => new Date(a[0].event.date).getTime() - new Date(b[0].event.date).getTime()
  )

  async function assignMember(slotId: string, userId: string) {
    setSavingId(slotId)
    const res = await fetch(`/api/meeting-slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedUserId: userId || null }),
    })
    setSavingId(null)
    if (res.ok) {
      const updated = await res.json()
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...updated } : s)))
      toast.success(userId ? 'Member assigned' : 'Assignment cleared')
    } else {
      toast.error('Failed to update')
    }
  }

  async function saveTopic(slotId: string) {
    setSavingId(slotId)
    const res = await fetch(`/api/meeting-slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicText }),
    })
    setSavingId(null)
    if (res.ok) {
      const updated = await res.json()
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...updated } : s)))
      setEditTopicId(null)
      toast.success('Topic saved')
    } else {
      toast.error('Failed to save topic')
    }
  }

  async function markStatus(slotId: string, status: string) {
    setSavingId(slotId)
    const res = await fetch(`/api/meeting-slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSavingId(null)
    if (res.ok) {
      const updated = await res.json()
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...updated } : s)))
      toast.success('Status updated')
    } else {
      toast.error('Failed to update')
    }
  }

  function slotLabel(slot: MeetingSlot) {
    if (slot.slotType === 'edu_slot') return 'EDU Slot'
    return `Feature Presentation ${slot.slotNumber}`
  }

  function slotColor(slot: MeetingSlot) {
    return slot.slotType === 'edu_slot' ? '#10B981' : '#C9A84C'
  }

  function slotIcon(slot: MeetingSlot) {
    return slot.slotType === 'edu_slot' ? GraduationCap : Mic2
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(6,10,20,0.7)',
    color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontWeight: '400',
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #10B981, #C9A84C)', borderRadius: '2px' }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1' }}>
            PRESENTATIONS
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px', fontWeight: '400' }}>
            EduSlot &amp; Feature Presentation schedule for upcoming chapter meetings
          </p>
        </div>
      </div>

      {/* Pending reminder banner */}
      {pendingCount > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            borderRadius: '10px', border: '1px solid rgba(204,0,0,0.3)',
            backgroundColor: 'rgba(204,0,0,0.08)', marginBottom: '20px', marginTop: '16px',
          }}
        >
          <AlertCircle size={18} style={{ color: '#CC0000', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', color: '#FCA5A5', fontWeight: '500' }}>
            {pendingCount} presentation slot{pendingCount > 1 ? 's' : ''} still unassigned — please assign members before the meeting.
          </span>
        </div>
      )}

      {eventGroups.length === 0 ? (
        <div
          style={{
            padding: '60px 20px', textAlign: 'center',
            background: 'rgba(13,19,36,0.55)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
            marginTop: pendingCount === 0 ? '20px' : '0',
          }}
        >
          <Mic2 size={36} style={{ color: '#4B5563', margin: '0 auto 12px' }} />
          <p style={{ color: '#6B7280', fontSize: '15px', fontWeight: '400' }}>No upcoming chapter meetings found.</p>
          <p style={{ color: '#4B5563', fontSize: '13px', marginTop: '4px', fontWeight: '400' }}>Add chapter meetings in the Calendar to see their presentation slots here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {eventGroups.map(([eventId, eventSlots]) => {
            const ev = eventSlots[0].event
            const evDate = new Date(ev.date)
            const hasUnassigned = eventSlots.some((s) => !s.assignedUserId)
            return (
              <div
                key={eventId}
                style={{
                  background: 'rgba(13,19,36,0.55)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '12px',
                  border: `1px solid ${hasUnassigned ? 'rgba(204,0,0,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
                }}
              >
                {/* Meeting header */}
                <div
                  style={{
                    padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', color: '#3B82F6', lineHeight: '1' }}>
                        {evDate.getDate()}
                      </span>
                      <span style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '500' }}>
                        {evDate.toLocaleString('en', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>{ev.title}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '400' }}>
                        {evDate.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                      backgroundColor: hasUnassigned ? 'rgba(204,0,0,0.15)' : 'rgba(16,185,129,0.15)',
                      color: hasUnassigned ? '#CC0000' : '#10B981',
                      border: `1px solid ${hasUnassigned ? 'rgba(204,0,0,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    }}
                  >
                    {hasUnassigned ? 'Slots Open' : 'All Assigned'}
                  </div>
                </div>

                {/* Slots */}
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {eventSlots.map((slot) => {
                    const Icon = slotIcon(slot)
                    const color = slotColor(slot)
                    const isEditing = editTopicId === slot.id
                    const isSaving = savingId === slot.id
                    return (
                      <div
                        key={slot.id}
                        style={{
                          padding: '12px 14px', borderRadius: '10px',
                          border: `1px solid ${slot.assignedUserId ? `${color}25` : 'rgba(255,255,255,0.07)'}`,
                          background: slot.assignedUserId ? `${color}08` : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        {/* Slot header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <div
                            style={{
                              width: '28px', height: '28px', borderRadius: '6px',
                              backgroundColor: `${color}20`, border: `1px solid ${color}40`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                          >
                            <Icon size={14} style={{ color }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {slotLabel(slot)}
                          </span>
                          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {slot.status === 'completed' ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10B981', fontWeight: '400' }}>
                                <CheckCircle size={12} /> Done
                              </span>
                            ) : slot.status === 'confirmed' ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6', fontWeight: '400' }}>
                                <CheckCircle size={12} /> Confirmed
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#F59E0B', fontWeight: '400' }}>
                                <Clock size={12} /> Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Assignment row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', flex: '1', minWidth: '160px' }}>
                            <User size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                            <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
                            <select
                              value={slot.assignedUserId ?? ''}
                              onChange={(e) => assignMember(slot.id, e.target.value)}
                              disabled={isSaving}
                              style={{
                                width: '100%', padding: '8px 30px 8px 30px',
                                borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(6,10,20,0.7)', color: slot.assignedUserId ? '#ffffff' : '#9CA3AF',
                                fontSize: '13px', outline: 'none', appearance: 'none', cursor: 'pointer',
                                fontWeight: '400',
                              }}
                            >
                              <option value="" style={{ background: '#0A0F1E' }}>— Unassigned —</option>
                              {members.map((m) => (
                                <option key={m.id} value={m.id} style={{ background: '#0A0F1E', color: '#fff' }}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Status buttons — only if assigned */}
                          {slot.assignedUserId && slot.status !== 'completed' && (
                            <button
                              onClick={() => markStatus(slot.id, slot.status === 'confirmed' ? 'completed' : 'confirmed')}
                              disabled={isSaving}
                              style={{
                                padding: '7px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px',
                                background: slot.status === 'confirmed' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                                color: slot.status === 'confirmed' ? '#10B981' : '#3B82F6', fontWeight: '500',
                              }}
                            >
                              {slot.status === 'confirmed' ? '✓ Mark Done' : 'Confirm'}
                            </button>
                          )}
                        </div>

                        {/* Topic field */}
                        {isEditing ? (
                          <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                            <input
                              autoFocus
                              value={topicText}
                              onChange={(e) => setTopicText(e.target.value)}
                              placeholder="Presentation topic or title..."
                              style={{ ...inputStyle, flex: 1 }}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveTopic(slot.id) }}
                            />
                            <button
                              onClick={() => saveTopic(slot.id)}
                              disabled={isSaving}
                              style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: '#C9A84C', color: '#000', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                            >Save</button>
                            <button
                              onClick={() => setEditTopicId(null)}
                              style={{ padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}
                            >✕</button>
                          </div>
                        ) : (
                          <div
                            onClick={() => { setEditTopicId(slot.id); setTopicText(slot.topic ?? '') }}
                            style={{
                              marginTop: '8px', padding: '6px 10px', borderRadius: '6px',
                              border: '1px dashed rgba(255,255,255,0.08)', cursor: 'pointer',
                              fontSize: '13px', color: slot.topic ? '#D1D5DB' : '#4B5563', fontWeight: '400',
                            }}
                          >
                            {slot.topic ? `📝 ${slot.topic}` : '+ Add topic / title'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
