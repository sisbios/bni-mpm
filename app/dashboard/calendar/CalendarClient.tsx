'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Mic2, GraduationCap, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Event = {
  id: string
  date: string
  title: string
  subtitle: string | null
  tags: string
  colors: string
  eventType: string
  isActive: boolean
}

const EVENT_TYPES = [
  { value: 'chapter', label: 'Chapter Meeting', color: '#3B82F6' },
  { value: 'regional', label: 'Regional Event', color: '#8B5CF6' },
  { value: 'training', label: 'Training', color: '#10B981' },
  { value: 'social', label: 'Social', color: '#F59E0B' },
  { value: 'trip', label: 'Trip', color: '#EC4899' },
  { value: 'international', label: 'International', color: '#C9A84C' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getEventColor(type: string) {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? '#9CA3AF'
}

type SlotSummary = { id: string; slotType: string; slotNumber: number; assignedUserName: string | null; status: string }

export default function CalendarClient() {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()) // 0-indexed
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showEventDetail, setShowEventDetail] = useState<Event | null>(null)
  const [detailSlots, setDetailSlots] = useState<SlotSummary[]>([])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/events?month=${currentMonth + 1}&year=${currentYear}`)
    if (res.ok) {
      setEvents(await res.json())
    }
    setLoading(false)
  }, [currentMonth, currentYear])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1) }
    else setCurrentMonth((m) => m - 1)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1) }
    else setCurrentMonth((m) => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  function getEventsForDay(day: number) {
    return events.filter((e) => {
      const d = new Date(e.date)
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm('Delete this event?')) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      setShowEventDetail(null)
      toast.success('Event deleted')
    }
  }

  async function openEventDetail(ev: Event) {
    setShowEventDetail(ev)
    if (ev.eventType === 'chapter') {
      const res = await fetch(`/api/meeting-slots?eventId=${ev.id}`)
      if (res.ok) setDetailSlots(await res.json())
    } else {
      setDetailSlots([])
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #CC0000, #C9A84C)', borderRadius: '2px' }} />
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff' }}>
            CALENDAR
          </h1>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setSelectedDate(null); setShowModal(true) }}
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

      {/* Month nav */}
      <div
        style={{
          background: 'rgba(13,19,36,0.55)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden', marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '24px', letterSpacing: '3px', color: '#ffffff' }}>
              {MONTHS[currentMonth].toUpperCase()}
            </div>
            <div style={{ fontSize: '17px', color: '#9CA3AF' }}>{currentYear}</div>
          </div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '17px', fontWeight: '600', color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {cells.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : []
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()
            return (
              <div
                key={i}
                onClick={() => {
                  if (!day) return
                  setSelectedDate(new Date(currentYear, currentMonth, day))
                  setEditingEvent(null)
                  setShowModal(true)
                }}
                style={{
                  minHeight: '80px',
                  padding: '8px',
                  borderRight: i % 7 !== 6 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  cursor: day ? 'pointer' : 'default',
                  backgroundColor: day ? 'transparent' : 'rgba(0,0,0,0.2)',
                  transition: 'background-color 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (day) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.02)'
                }}
                onMouseLeave={(e) => {
                  if (day) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                {day && (
                  <>
                    <div
                      style={{
                        width: '26px', height: '26px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '17px', fontWeight: isToday ? '700' : '400',
                        color: isToday ? '#ffffff' : '#9CA3AF',
                        backgroundColor: isToday ? '#CC0000' : 'transparent',
                        marginBottom: '4px',
                      }}
                    >
                      {day}
                    </div>
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEventDetail(ev)
                        }}
                        style={{
                          fontSize: '17px',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          backgroundColor: `${getEventColor(ev.eventType)}20`,
                          borderLeft: `2px solid ${getEventColor(ev.eventType)}`,
                          color: getEventColor(ev.eventType),
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: '17px', color: '#6B7280' }}>+{dayEvents.length - 2} more</div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        {EVENT_TYPES.map((t) => (
          <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: t.color }} />
            <span style={{ fontSize: '17px', color: '#6B7280' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <EventModal
          initialDate={selectedDate}
          editingEvent={editingEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null); setSelectedDate(null) }}
          onSuccess={(event) => {
            if (editingEvent) {
              setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)))
              toast.success('Event updated')
            } else {
              setEvents((prev) => [...prev, event])
              toast.success('Event created')
            }
            setShowModal(false)
            setEditingEvent(null)
          }}
        />
      )}

      {/* Event detail popover */}
      {showEventDetail && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
          }}
          onClick={() => setShowEventDetail(null)}
        >
          <div
            style={{
              background: 'rgba(10,15,28,0.90)',
              backdropFilter: 'blur(28px) saturate(160%)',
              WebkitBackdropFilter: 'blur(28px) saturate(160%)',
              borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
              padding: '28px', width: '100%', maxWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div
                  style={{
                    display: 'inline-block', fontSize: '17px', padding: '3px 10px',
                    borderRadius: '4px', backgroundColor: `${getEventColor(showEventDetail.eventType)}20`,
                    color: getEventColor(showEventDetail.eventType), marginBottom: '8px', textTransform: 'capitalize',
                  }}
                >
                  {EVENT_TYPES.find((t) => t.value === showEventDetail.eventType)?.label ?? showEventDetail.eventType}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                  {showEventDetail.title}
                </h3>
                {showEventDetail.subtitle && (
                  <p style={{ fontSize: '17px', color: '#9CA3AF' }}>{showEventDetail.subtitle}</p>
                )}
              </div>
              <button onClick={() => setShowEventDetail(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '16px', fontWeight: '300' }}>
              📅 {new Date(showEventDetail.date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Meeting slots summary for chapter events */}
            {showEventDetail.eventType === 'chapter' && detailSlots.length > 0 && (
              <div style={{ marginBottom: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Presentation Slots</span>
                  {detailSlots.some((s) => !s.assignedUserName) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#CC0000' }}>
                      <AlertCircle size={11} /> Unassigned
                    </span>
                  )}
                </div>
                {detailSlots.map((slot) => {
                  const isEdu = slot.slotType === 'edu_slot'
                  const color = isEdu ? '#10B981' : '#C9A84C'
                  const Icon = isEdu ? GraduationCap : Mic2
                  return (
                    <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Icon size={13} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color, fontWeight: '500', minWidth: '120px' }}>
                        {isEdu ? 'EDU Slot' : `Feature Pres. ${slot.slotNumber}`}
                      </span>
                      <span style={{ fontSize: '12px', color: slot.assignedUserName ? '#D1D5DB' : '#4B5563', flex: 1, fontWeight: '300' }}>
                        {slot.assignedUserName ?? '— Unassigned —'}
                      </span>
                    </div>
                  )
                })}
                <div style={{ padding: '6px 12px' }}>
                  <Link
                    href="/dashboard/presentations"
                    onClick={() => setShowEventDetail(null)}
                    style={{ fontSize: '12px', color: '#C9A84C', textDecoration: 'none', fontWeight: '500' }}
                  >
                    Manage slots →
                  </Link>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setEditingEvent(showEventDetail); setShowEventDetail(null); setShowModal(true) }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => handleDeleteEvent(showEventDetail.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', borderRadius: '8px', border: '1px solid rgba(204,0,0,0.3)',
                  backgroundColor: 'rgba(204,0,0,0.1)', color: '#CC0000', fontSize: '14px', cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EventModal({
  initialDate,
  editingEvent,
  onClose,
  onSuccess,
}: {
  initialDate: Date | null
  editingEvent: Event | null
  onClose: () => void
  onSuccess: (event: Event) => void
}) {
  const formatDateInput = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: editingEvent
      ? formatDateInput(new Date(editingEvent.date))
      : initialDate
        ? formatDateInput(initialDate)
        : formatDateInput(new Date()),
    title: editingEvent?.title ?? '',
    subtitle: editingEvent?.subtitle ?? '',
    eventType: editingEvent?.eventType ?? 'chapter',
  })

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
    const method = editingEvent ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: '[]', colors: '[]' }),
    })
    setLoading(false)
    if (res.ok) {
      onSuccess(await res.json())
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to save event')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(6,10,20,0.6)',
    color: '#ffffff', fontSize: '17px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'var(--font-montserrat), sans-serif',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(10,15,28,0.90)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
          padding: '32px', width: '100%', maxWidth: '460px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', letterSpacing: '2px', color: '#ffffff', marginBottom: '24px' }}>
          {editingEvent ? 'EDIT EVENT' : 'ADD EVENT'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Date *
            </label>
            <input style={inputStyle} type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Title *
            </label>
            <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="Chapter Weekly Meeting" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Subtitle
            </label>
            <input style={inputStyle} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Optional subtitle or location" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Event Type
            </label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '17px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #CC0000, #990000)',
                color: '#ffffff', fontSize: '17px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving...' : editingEvent ? 'Update' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
