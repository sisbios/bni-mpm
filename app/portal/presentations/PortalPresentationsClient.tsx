'use client'
import { useMemo } from 'react'
import { Mic2, GraduationCap, User, CheckCircle, Clock, Calendar } from 'lucide-react'

type Slot = {
  id: string
  eventId: string
  slotType: string
  slotNumber: number
  assignedUserId: string | null
  assignedUserName: string | null
  topic: string | null
  status: string
  event: { id: string; date: string; title: string }
  assignedUser: { id: string; name: string; business: string | null; role: string } | null
}

const GLASS = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function PortalPresentationsClient({
  slots,
  currentUserId,
}: {
  slots: Slot[]
  currentUserId: string
}) {
  // Group by event
  const grouped = useMemo(() => {
    const map: Record<string, Slot[]> = {}
    slots.forEach((s) => {
      if (!map[s.eventId]) map[s.eventId] = []
      map[s.eventId].push(s)
    })
    return Object.entries(map).sort(([, a], [, b]) =>
      new Date(a[0].event.date).getTime() - new Date(b[0].event.date).getTime()
    )
  }, [slots])

  const mySlots = slots.filter((s) => s.assignedUserId === currentUserId)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#fff', lineHeight: 1 }}>
            PRESENTATIONS
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
            Chapter meeting presentation schedule — next 12 weeks
          </p>
        </div>
      </div>

      {/* My slots banner */}
      {mySlots.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mic2 size={16} style={{ color: '#C9A84C', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#C9A84C' }}>You have {mySlots.length} upcoming presentation{mySlots.length > 1 ? 's' : ''}!</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
              {mySlots.map((s) => {
                const d = new Date(s.event.date)
                return `${s.slotType === 'edu_slot' ? 'EDU Slot' : 'Feature Presentation'} — ${d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}`
              }).join(' • ')}
            </div>
          </div>
        </div>
      )}

      {grouped.length === 0 ? (
        <div style={{ ...GLASS, padding: '60px', textAlign: 'center', color: '#8B95A3' }}>
          <Calendar size={36} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
          <p>No upcoming presentations scheduled</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {grouped.map(([eventId, eventSlots]) => {
            const event = eventSlots[0].event
            const d = new Date(event.date)
            const eduSlots = eventSlots.filter((s) => s.slotType === 'edu_slot')
            const featSlots = eventSlots.filter((s) => s.slotType === 'feature_presentation')

            return (
              <div key={eventId} style={GLASS}>
                {/* Event header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'center', minWidth: '44px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', color: '#3B82F6', lineHeight: 1 }}>{d.getDate()}</div>
                    <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase' }}>{d.toLocaleString('en', { month: 'short' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{event.title}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                      {d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Slots */}
                <div>
                  {/* EDU slot */}
                  {eduSlots.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} currentUserId={currentUserId} color="#10B981" label="EDU Slot" Icon={GraduationCap} />
                  ))}
                  {/* Feature presentations */}
                  {featSlots.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} currentUserId={currentUserId} color="#C9A84C" label={`Feature Presentation ${slot.slotNumber}`} Icon={Mic2} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SlotRow({ slot, currentUserId, color, label, Icon }: {
  slot: Slot
  currentUserId: string
  color: string
  label: string
  Icon: React.ElementType
}) {
  const isMe = slot.assignedUserId === currentUserId
  const isUnassigned = !slot.assignedUserId

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: `3px solid ${isMe ? color : isUnassigned ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}` }}>
      {/* Slot type icon */}
      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} style={{ color }} />
      </div>

      {/* Slot info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
          {label}
          {isMe && <span style={{ marginLeft: '6px', fontSize: '10px', background: 'rgba(201,168,76,0.2)', color: '#C9A84C', padding: '1px 6px', borderRadius: '4px' }}>YOU</span>}
        </div>

        {slot.assignedUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#9CA3AF', flexShrink: 0 }}>
              {initials(slot.assignedUser.name)}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: isMe ? '#C9A84C' : '#fff' }}>
                {slot.assignedUser.name}
              </div>
              {slot.assignedUser.business && (
                <div style={{ fontSize: '11px', color: '#6B7280' }}>{slot.assignedUser.business}</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={13} style={{ color: '#4B5563' }} />
            <span style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>Not yet assigned</span>
          </div>
        )}

        {slot.topic && (
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
            📌 {slot.topic}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', flexShrink: 0,
        background: slot.status === 'confirmed' ? 'rgba(16,185,129,0.15)' : slot.status === 'completed' ? 'rgba(107,114,128,0.15)' : 'rgba(245,158,11,0.15)',
        color: slot.status === 'confirmed' ? '#10B981' : slot.status === 'completed' ? '#9CA3AF' : '#F59E0B',
        border: `1px solid ${slot.status === 'confirmed' ? 'rgba(16,185,129,0.3)' : slot.status === 'completed' ? 'rgba(107,114,128,0.3)' : 'rgba(245,158,11,0.3)'}`,
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        {slot.status === 'confirmed' ? <CheckCircle size={9} /> : <Clock size={9} />}
        {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
      </div>
    </div>
  )
}
