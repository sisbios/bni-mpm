'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Calendar, List, Bell, BellOff, Check, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

type Event = {
  id: string
  date: string
  title: string
  subtitle: string | null
  eventType: string
  myRsvp: { id: string; status: string } | null
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  chapter: '#3B82F6', regional: '#8B5CF6', training: '#10B981',
  social: '#F59E0B', trip: '#EC4899', international: '#C9A84C',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  chapter: 'Chapter', regional: 'Regional', training: 'Training',
  social: 'Social', trip: 'Trip', international: 'International',
}

const RSVP_OPTIONS = [
  { value: 'confirmed', label: 'Attending', icon: Check, color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  { value: 'maybe', label: 'Maybe', icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  { value: 'declined', label: "Can't Attend", icon: X, color: '#CC0000', bg: 'rgba(204,0,0,0.12)', border: 'rgba(204,0,0,0.3)' },
]

const GLASS = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

function ReminderToggle({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const key = `reminder:${eventId}`
  const [set, setSet] = useState(false)
  useEffect(() => { setSet(localStorage.getItem(key) === '1') }, [key])
  function toggle() {
    if (set) {
      localStorage.removeItem(key); setSet(false)
      toast('Reminder removed')
    } else {
      localStorage.setItem(key, '1'); setSet(true)
      toast.success('Reminder saved!')
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    }
  }
  return (
    <button onClick={toggle} title={set ? 'Remove reminder' : 'Set reminder'} style={{
      display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
      borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
      background: set ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.06)',
      color: set ? '#C9A84C' : '#6B7280', transition: 'all 0.15s',
    }}>
      {set ? <Bell size={12} /> : <BellOff size={12} />}
      {set ? 'Reminder set' : 'Set reminder'}
    </button>
  )
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun
}

export default function PortalCalendarClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const now = new Date()
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())

  async function handleRsvp(eventId: string, status: string) {
    setLoadingId(eventId)
    const res = await fetch('/api/rsvp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, status }),
    })
    setLoadingId(null)
    if (res.ok) {
      const rsvp = await res.json()
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, myRsvp: rsvp } : e)))
      toast.success(`RSVP: ${RSVP_OPTIONS.find((o) => o.value === status)?.label}`)
    } else {
      toast.error('Failed to update RSVP')
    }
  }

  // Group events by date string for calendar view
  const eventsByDay = useMemo(() => {
    const map: Record<string, Event[]> = {}
    events.forEach((e) => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth) // 0=Sun
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('en', { month: 'long', year: 'numeric' })

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }

  return (
    <>
      <style>{`
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .cal-cell { min-height: 60px; padding: 4px; border-radius: 6px; }
        @media (max-width: 640px) { .cal-cell { min-height: 44px; padding: 2px; } }
        .event-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      `}</style>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#fff', lineHeight: 1 }}>
                CHAPTER CALENDAR
              </h1>
              <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
                {events.length} upcoming events
              </p>
            </div>
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { key: 'list', icon: List, label: 'List' },
              { key: 'calendar', icon: Calendar, label: 'Calendar' },
            ].map((v) => (
              <button key={v.key} onClick={() => setView(v.key as any)} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                background: view === v.key ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                color: view === v.key ? '#C9A84C' : '#6B7280', transition: 'all 0.15s',
              }}>
                <v.icon size={13} />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.length === 0 ? (
              <div style={{ ...GLASS, padding: '60px', textAlign: 'center', color: '#8B95A3' }}>
                <Calendar size={36} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
                <p>No upcoming events in the next 3 months</p>
              </div>
            ) : (
              events.map((event) => {
                const d = new Date(event.date)
                const tc = EVENT_TYPE_COLORS[event.eventType] ?? '#9CA3AF'
                const rsvpStatus = event.myRsvp?.status
                const rsvpOpt = RSVP_OPTIONS.find((o) => o.value === rsvpStatus)
                return (
                  <div key={event.id} style={{ ...GLASS, overflow: 'hidden', border: `1px solid ${rsvpStatus ? tc + '30' : 'rgba(255,255,255,0.07)'}` }}>
                    <div style={{ display: 'flex', borderLeft: `4px solid ${tc}` }}>
                      {/* Date */}
                      <div style={{ padding: '16px 14px', textAlign: 'center', minWidth: '62px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', color: tc, lineHeight: 1 }}>{d.getDate()}</div>
                        <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>{d.toLocaleString('en', { month: 'short' })}</div>
                        <div style={{ fontSize: '10px', color: '#4B5563' }}>{d.getFullYear()}</div>
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>{event.title}</div>
                            {event.subtitle && <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{event.subtitle}</div>}
                          </div>
                          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: `${tc}15`, color: tc, flexShrink: 0 }}>
                            {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* RSVP buttons */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {RSVP_OPTIONS.map((opt) => {
                              const isSel = rsvpStatus === opt.value
                              return (
                                <button key={opt.value} onClick={() => handleRsvp(event.id, opt.value)}
                                  disabled={loadingId === event.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                                    borderRadius: '6px', border: `1px solid ${isSel ? opt.border : 'rgba(255,255,255,0.07)'}`,
                                    background: isSel ? opt.bg : 'transparent', color: isSel ? opt.color : '#6B7280',
                                    fontSize: '11px', fontWeight: '600', cursor: loadingId === event.id ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s',
                                  }}>
                                  <opt.icon size={10} />
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                          <ReminderToggle eventId={event.id} eventTitle={event.title} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (
          <div style={{ ...GLASS, overflow: 'hidden' }}>
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={prevMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer' }}>
                <ChevronLeft size={16} />
              </button>
              <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px', color: '#fff', letterSpacing: '2px' }}>
                {monthLabel.toUpperCase()}
              </div>
              <button onClick={nextMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer' }}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ padding: '12px' }}>
              {/* Day headers */}
              <div className="cal-grid" style={{ marginBottom: '4px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', padding: '4px 0', letterSpacing: '0.5px' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="cal-grid">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} className="cal-cell" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayKey = `${calYear}-${calMonth}-${day}`
                  const dayEvents = eventsByDay[dayKey] ?? []
                  const isToday = now.getDate() === day && now.getMonth() === calMonth && now.getFullYear() === calYear

                  return (
                    <div key={day} className="cal-cell" style={{
                      background: isToday ? 'rgba(201,168,76,0.1)' : dayEvents.length > 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: isToday ? '1px solid rgba(201,168,76,0.35)' : dayEvents.length > 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    }}>
                      <div style={{ fontSize: '11px', color: isToday ? '#C9A84C' : '#9CA3AF', fontWeight: isToday ? '700' : '400', marginBottom: '3px' }}>
                        {day}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                        {dayEvents.slice(0, 3).map((ev) => {
                          const tc = EVENT_TYPE_COLORS[ev.eventType] ?? '#9CA3AF'
                          return (
                            <div key={ev.id} className="event-dot" style={{ background: tc, boxShadow: `0 0 4px ${tc}60` }} title={ev.title} />
                          )
                        })}
                        {dayEvents.length > 3 && <div style={{ fontSize: '8px', color: '#6B7280' }}>+{dayEvents.length - 3}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Events in selected month as a mini list below */}
            {events.filter((e) => {
              const d = new Date(e.date)
              return d.getMonth() === calMonth && d.getFullYear() === calYear
            }).length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Events this month
                </div>
                {events.filter((e) => {
                  const d = new Date(e.date)
                  return d.getMonth() === calMonth && d.getFullYear() === calYear
                }).map((ev) => {
                  const d = new Date(ev.date)
                  const tc = EVENT_TYPE_COLORS[ev.eventType] ?? '#9CA3AF'
                  return (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="event-dot" style={{ background: tc, boxShadow: `0 0 5px ${tc}60` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>{ev.title}</span>
                        <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '8px' }}>
                          {d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <ReminderToggle eventId={ev.id} eventTitle={ev.title} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'capitalize' }}>{EVENT_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
