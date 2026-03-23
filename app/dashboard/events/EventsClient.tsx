'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, CalendarCheck, X, CalendarDays, List } from 'lucide-react'

type Event = {
  id: string
  date: string
  title: string
  subtitle: string | null
  eventType: string
  isActive: boolean
  _count?: { rsvps: number }
}

const EVENT_TYPES = [
  { value: 'chapter',       label: 'Chapter Meeting', color: '#3B82F6' },
  { value: 'training',      label: 'Training',        color: '#10B981' },
  { value: 'social',        label: 'Social',          color: '#F59E0B' },
  { value: 'trip',          label: 'Trip',            color: '#EC4899' },
  { value: 'international', label: 'International',   color: '#C9A84C' },
  // 'regional' excluded — regional events are created from the Region dashboard only
]

function getEventColor(type: string) {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? '#9CA3AF'
}

function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const rows: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7).concat(Array(7).fill(null)).slice(0, 7))
  return rows
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function EventsClient() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    const res = await fetch('/api/events')
    if (res.ok) setEvents(await res.json())
    setLoading(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success('Event deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  const upcoming = events.filter((e) => new Date(e.date) >= new Date())
  const past = events.filter((e) => new Date(e.date) < new Date())

  // Build calendar data: group events by year-month, sorted chronologically
  const calendarMonths: { year: number; month: number; events: Event[] }[] = []
  if (events.length > 0) {
    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const firstDate = new Date(sorted[0].date)
    const lastDate = new Date(sorted[sorted.length - 1].date)
    let cur = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
    const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)
    while (cur <= end) {
      const y = cur.getFullYear()
      const m = cur.getMonth()
      const monthEvents = sorted.filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === y && d.getMonth() === m
      })
      calendarMonths.push({ year: y, month: m, events: monthEvents })
      cur = new Date(y, m + 1, 1)
    }
  }

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #CC0000, #C9A84C)', borderRadius: '2px' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1' }}>EVENTS</h1>
            <p style={{ fontSize: '17px', color: '#9CA3AF', marginTop: '2px' }}>{upcoming.length} upcoming</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setView('list')}
              title="List view"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 14px',
                border: 'none',
                background: view === 'list' ? 'linear-gradient(135deg, #CC0000, #990000)' : 'transparent',
                color: view === 'list' ? '#ffffff' : '#9CA3AF',
                fontSize: '17px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              title="Calendar view"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 14px',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.07)',
                background: view === 'calendar' ? 'linear-gradient(135deg, #CC0000, #990000)' : 'transparent',
                color: view === 'calendar' ? '#ffffff' : '#9CA3AF',
                fontSize: '17px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>
          <button
            onClick={() => { setEditingEvent(null); setShowModal(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
              borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #CC0000, #990000)',
              color: '#ffffff', fontSize: '17px', fontWeight: '600', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(204,0,0,0.3)',
            }}
          >
            <Plus size={15} /> Add Event
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#8B95A3' }}>Loading events...</div>
      ) : view === 'list' ? (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '17px', color: '#6B7280', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Upcoming Events
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcoming.map((event) => (
                  <EventRow key={event.id} event={event} onEdit={(e) => { setEditingEvent(e); setShowModal(true) }} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div style={{ fontSize: '17px', color: '#6B7280', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Past Events
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {past.map((event) => (
                  <EventRow key={event.id} event={event} onEdit={(e) => { setEditingEvent(e); setShowModal(true) }} onDelete={handleDelete} past />
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px', color: '#8B95A3' }}>
              <CalendarCheck size={40} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
              <p>No events yet. Add your first event!</p>
            </div>
          )}
        </>
      ) : (
        /* Calendar View */
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#8B95A3' }}>
              <CalendarCheck size={40} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
              <p>No events yet. Add your first event!</p>
            </div>
          ) : (
            calendarMonths.map(({ year, month, events: monthEvents }) => {
              const rows = buildMonthGrid(year, month)
              // Build a map of day -> events for quick lookup
              const dayMap: Record<number, Event[]> = {}
              for (const ev of monthEvents) {
                const d = new Date(ev.date).getDate()
                if (!dayMap[d]) dayMap[d] = []
                dayMap[d].push(ev)
              }
              const isCurrentMonth = year === todayYear && month === todayMonth

              return (
                <div key={`${year}-${month}`} style={{ marginBottom: '32px' }}>
                  {/* Month header */}
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '12px',
                      fontFamily: 'var(--font-bebas), sans-serif',
                      letterSpacing: '2px',
                    }}
                  >
                    {MONTH_NAMES[month]} {year}
                  </div>

                  {/* Calendar grid */}
                  <div
                    style={{
                      background: 'rgba(13,19,36,0.55)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      padding: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Day-of-week headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                      {DAY_HEADERS.map((d) => (
                        <div
                          key={d}
                          style={{
                            fontSize: '17px',
                            color: '#6B7280',
                            textAlign: 'center',
                            padding: '4px',
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                    {/* Day rows */}
                    {rows.map((row, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                        {row.map((day, ci) => {
                          const isToday = isCurrentMonth && day === todayDay
                          const dayEvents = day ? (dayMap[day] ?? []) : []
                          return (
                            <div
                              key={ci}
                              style={{
                                minHeight: '36px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                padding: '4px',
                                borderRadius: '6px',
                                fontSize: '17px',
                                color: day ? (isToday ? '#C9A84C' : '#D1D5DB') : '#6B7280',
                                background: isToday ? 'rgba(201,168,76,0.15)' : 'transparent',
                                border: isToday ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
                              }}
                            >
                              {day !== null && (
                                <>
                                  <span style={{ lineHeight: '1.4', fontWeight: isToday ? '700' : '400' }}>{day}</span>
                                  {dayEvents.length > 0 && (
                                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2px' }}>
                                      {dayEvents.map((ev) => (
                                        <div
                                          key={ev.id}
                                          title={ev.title}
                                          style={{
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            backgroundColor: getEventColor(ev.eventType),
                                            margin: '1px',
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Month event cards */}
                  {monthEvents.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {monthEvents.map((event) => {
                        const color = getEventColor(event.eventType)
                        const date = new Date(event.date)
                        const isPast = date < today
                        return (
                          <div
                            key={event.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              background: 'rgba(13,19,36,0.55)',
                              backdropFilter: 'blur(16px)',
                              WebkitBackdropFilter: 'blur(16px)',
                              borderRadius: '10px',
                              border: `1px solid ${color}25`,
                              borderLeft: `4px solid ${color}`,
                              padding: '14px 16px',
                              boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                              opacity: isPast ? 0.6 : 1,
                              transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = isPast ? '0.6' : '1')}
                          >
                            {/* Date display */}
                            <div
                              style={{
                                textAlign: 'center',
                                flexShrink: 0,
                                minWidth: '40px',
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: 'var(--font-bebas), sans-serif',
                                  fontSize: '26px',
                                  color,
                                  lineHeight: '1',
                                }}
                              >
                                {date.getDate()}
                              </div>
                              <div style={{ fontSize: '17px', color: '#6B7280', textTransform: 'uppercase' }}>
                                {date.toLocaleString('en', { month: 'short' })}
                              </div>
                            </div>

                            {/* Event info */}
                            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '17px',
                                  fontWeight: '600',
                                  color: '#ffffff',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {event.title}
                              </div>
                              {event.subtitle && (
                                <div
                                  style={{
                                    fontSize: '17px',
                                    color: '#9CA3AF',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {event.subtitle}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '10px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '17px',
                                    padding: '2px 8px',
                                    borderRadius: '3px',
                                    backgroundColor: `${color}15`,
                                    color,
                                  }}
                                >
                                  {EVENT_TYPES.find((t) => t.value === event.eventType)?.label ?? event.eventType}
                                </span>
                                {event._count && (
                                  <span style={{ fontSize: '17px', color: '#6B7280' }}>
                                    {event._count.rsvps} RSVPs
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              <button
                                onClick={() => { setEditingEvent(event); setShowModal(true) }}
                                style={{
                                  width: '32px', height: '32px', borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9CA3AF' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id, event.title)}
                                style={{
                                  width: '32px', height: '32px', borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000' }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9CA3AF' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {showModal && (
        <EventFormModal
          editingEvent={editingEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null) }}
          onSuccess={(event) => {
            if (editingEvent) {
              setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)))
              toast.success('Event updated')
            } else {
              setEvents((prev) => [event, ...prev])
              toast.success('Event created')
            }
            setShowModal(false)
            setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}

function EventRow({
  event,
  onEdit,
  onDelete,
  past,
}: {
  event: Event
  onEdit: (e: Event) => void
  onDelete: (id: string, title: string) => void
  past?: boolean
}) {
  const date = new Date(event.date)
  const color = getEventColor(event.eventType)

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 20px',
        background: 'rgba(13,19,36,0.55)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderRadius: '12px',
        border: `1px solid ${past ? 'rgba(255,255,255,0.06)' : color + '30'}`,
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        opacity: past ? 0.55 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = past ? '0.55' : '1')}
    >
      <div
        style={{
          width: '50px', textAlign: 'center', flexShrink: 0,
          borderRight: `2px solid ${color}`,
          paddingRight: '16px',
        }}
      >
        <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', color, lineHeight: '1' }}>
          {date.getDate()}
        </div>
        <div style={{ fontSize: '17px', color: '#6B7280', textTransform: 'uppercase' }}>
          {date.toLocaleString('en', { month: 'short' })}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </div>
        {event.subtitle && (
          <div style={{ fontSize: '17px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.subtitle}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '17px', padding: '2px 8px', borderRadius: '3px',
              backgroundColor: `${color}15`, color,
            }}
          >
            {EVENT_TYPES.find((t) => t.value === event.eventType)?.label ?? event.eventType}
          </span>
          {event._count && (
            <span style={{ fontSize: '17px', color: '#6B7280' }}>
              {event._count.rsvps} RSVPs
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onEdit(event)}
          style={{
            width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4B5563'; e.currentTarget.style.color = '#9CA3AF' }}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(event.id, event.title)}
          style={{
            width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4B5563'; e.currentTarget.style.color = '#9CA3AF' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function EventFormModal({ editingEvent, onClose, onSuccess }: {
  editingEvent: Event | null
  onClose: () => void
  onSuccess: (event: Event) => void
}) {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date:      editingEvent ? fmt(new Date(editingEvent.date)) : fmt(new Date()),
    title:     editingEvent?.title ?? '',
    subtitle:  editingEvent?.subtitle ?? '',
    eventType: editingEvent?.eventType ?? 'chapter',
  })

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(editingEvent ? `/api/events/${editingEvent.id}` : '/api/events', {
      method: editingEvent ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: '[]', colors: '[]' }),
    })
    setLoading(false)
    if (res.ok) onSuccess(await res.json())
    else { const err = await res.json(); toast.error(err.error || 'Failed to save') }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,10,20,0.6)',
    color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '10px', color: '#6B7280', marginBottom: '4px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }} onClick={onClose}>
      <div style={{ background: 'rgba(10,15,28,0.97)', backdropFilter: 'blur(28px) saturate(160%)', WebkitBackdropFilter: 'blur(28px) saturate(160%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', width: '100%', maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', letterSpacing: '2px', color: '#ffffff', margin: 0 }}>
            {editingEvent ? 'EDIT EVENT' : 'NEW EVENT'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', padding: '2px' }}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Date + Type row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={lbl}>Date *</label>
              <input style={{ ...inp, colorScheme: 'dark' }} type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select style={{ ...inp, cursor: 'pointer', colorScheme: 'dark', background: '#0d1324' }} value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
                {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Title *</label>
            <input style={inp} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Chapter Weekly Meeting" />
          </div>
          <div>
            <label style={lbl}>Subtitle / Venue</label>
            <input style={inp} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Optional" />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#6B7280', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '9px', borderRadius: '7px', border: 'none', background: loading ? 'rgba(153,0,0,0.6)' : 'linear-gradient(135deg, #CC0000, #990000)', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving…' : editingEvent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
