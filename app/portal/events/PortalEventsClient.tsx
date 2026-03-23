'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar, Check, X, Clock } from 'lucide-react'

type Event = {
  id: string
  date: string | Date
  title: string
  subtitle: string | null
  eventType: string
  myRsvp: { id: string; status: string; notes: string | null } | null
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  chapter: '#3B82F6',
  regional: '#8B5CF6',
  training: '#10B981',
  social: '#F59E0B',
  trip: '#EC4899',
  international: '#C9A84C',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  chapter: 'Chapter Meeting',
  regional: 'Regional',
  training: 'Training',
  social: 'Social',
  trip: 'Trip',
  international: 'International',
}

const RSVP_OPTIONS = [
  { value: 'confirmed', label: 'Attending', icon: Check, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  { value: 'maybe', label: 'Maybe', icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  { value: 'declined', label: 'Can\'t Attend', icon: X, color: '#CC0000', bg: 'rgba(204,0,0,0.1)', border: 'rgba(204,0,0,0.3)' },
]

export default function PortalEventsClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleRsvp(eventId: string, status: string) {
    setLoadingId(eventId)
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, status }),
    })
    setLoadingId(null)

    if (res.ok) {
      const rsvp = await res.json()
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, myRsvp: rsvp } : e))
      )
      toast.success(`RSVP updated: ${RSVP_OPTIONS.find((o) => o.value === status)?.label}`)
    } else {
      toast.error('Failed to update RSVP')
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1' }}>
            UPCOMING EVENTS
          </h1>
          <p style={{ fontSize: '17px', color: '#9CA3AF', marginTop: '2px' }}>
            {events.length} events coming up
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '80px', color: '#8B95A3',
            background: 'rgba(13,19,36,0.55)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
          }}
        >
          <Calendar size={40} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
          <p>No upcoming events scheduled</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map((event) => {
            const date = new Date(event.date)
            const color = EVENT_TYPE_COLORS[event.eventType] ?? '#9CA3AF'
            const currentRsvp = event.myRsvp?.status

            return (
              <div
                key={event.id}
                style={{
                  background: 'rgba(13,19,36,0.55)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  borderRadius: '12px',
                  border: `1px solid ${currentRsvp ? color + '30' : 'rgba(255,255,255,0.07)'}`,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
                }}
              >
                <div style={{ display: 'flex', borderLeft: `4px solid ${color}` }}>
                  {/* Date */}
                  <div
                    style={{
                      padding: '20px 16px',
                      textAlign: 'center', minWidth: '70px',
                      borderRight: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', color, lineHeight: '1' }}>
                      {date.getDate()}
                    </div>
                    <div style={{ fontSize: '17px', color: '#6B7280', textTransform: 'uppercase' }}>
                      {date.toLocaleString('en', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: '17px', color: '#8B95A3' }}>
                      {date.getFullYear()}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          {event.title}
                        </div>
                        {event.subtitle && (
                          <div style={{ fontSize: '17px', color: '#9CA3AF', marginBottom: '8px' }}>
                            {event.subtitle}
                          </div>
                        )}
                        <span
                          style={{
                            fontSize: '17px', padding: '3px 10px', borderRadius: '4px',
                            backgroundColor: `${color}15`, color,
                          }}
                        >
                          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                        </span>
                      </div>

                      {/* RSVP status badge */}
                      {currentRsvp && (
                        <div
                          style={{
                            fontSize: '17px', padding: '4px 12px', borderRadius: '6px',
                            backgroundColor: RSVP_OPTIONS.find((o) => o.value === currentRsvp)?.bg,
                            color: RSVP_OPTIONS.find((o) => o.value === currentRsvp)?.color,
                            border: `1px solid ${RSVP_OPTIONS.find((o) => o.value === currentRsvp)?.border}`,
                            whiteSpace: 'nowrap', fontWeight: '600',
                          }}
                        >
                          {RSVP_OPTIONS.find((o) => o.value === currentRsvp)?.label}
                        </div>
                      )}
                    </div>

                    {/* RSVP buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {RSVP_OPTIONS.map((option) => {
                        const isSelected = currentRsvp === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleRsvp(event.id, option.value)}
                            disabled={loadingId === event.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '7px 14px', borderRadius: '6px', fontSize: '17px', fontWeight: '600',
                              cursor: loadingId === event.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s',
                              border: `1px solid ${isSelected ? option.border : 'rgba(255,255,255,0.07)'}`,
                              backgroundColor: isSelected ? option.bg : 'transparent',
                              color: isSelected ? option.color : '#6B7280',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = option.border
                                e.currentTarget.style.color = option.color
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                                e.currentTarget.style.color = '#6B7280'
                              }
                            }}
                          >
                            <option.icon size={13} />
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
