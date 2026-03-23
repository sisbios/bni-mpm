'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Mic2, GraduationCap, AlertCircle, Check, Star, Bell, BellOff, Bookmark } from 'lucide-react'
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
  bookingRequired?: boolean
  regionId?: string | null
}

const EVENT_TYPES = [
  { value: 'chapter',       label: 'Chapter Meeting',  color: '#3B82F6' },
  { value: 'regional',      label: 'Regional Event',   color: '#8B5CF6' },
  { value: 'training',      label: 'Training',         color: '#10B981' },
  { value: 'social',        label: 'Social',           color: '#F59E0B' },
  { value: 'trip',          label: 'Trip',             color: '#EC4899' },
  { value: 'international', label: 'International',    color: '#C9A84C' },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getEventColor(type: string) {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? '#9CA3AF'
}

type SlotSummary = { id: string; slotType: string; slotNumber: number; assignedUserName: string | null; status: string }
type RsvpStatus = 'confirmed' | 'maybe' | 'declined' | 'pending' | null

export default function CalendarClient() {
  const now = new Date()
  const [currentYear, setCurrentYear]   = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [events, setEvents]             = useState<Event[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showEventDetail, setShowEventDetail] = useState<Event | null>(null)
  const [detailSlots, setDetailSlots]   = useState<SlotSummary[]>([])
  const [rsvpStatus, setRsvpStatus]     = useState<RsvpStatus>(null)
  const [rsvpLoading, setRsvpLoading]   = useState(false)
  const [registered, setRegistered]     = useState(false)
  const [regLoading, setRegLoading]     = useState(false)
  const [reminder, setReminder]         = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/events?month=${currentMonth + 1}&year=${currentYear}`)
    if (res.ok) setEvents(await res.json())
    setLoading(false)
  }, [currentMonth, currentYear])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1) }
    else setCurrentMonth((m) => m - 1)
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1) }
    else setCurrentMonth((m) => m + 1)
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
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
    setRsvpStatus(null)
    setRegistered(false)

    // Load meeting slots for chapter events
    if (ev.eventType === 'chapter') {
      const res = await fetch(`/api/meeting-slots?eventId=${ev.id}`)
      if (res.ok) setDetailSlots(await res.json())
    } else {
      setDetailSlots([])
    }

    // Load RSVP status
    const rsvpRes = await fetch(`/api/rsvp?eventId=${ev.id}`)
    if (rsvpRes.ok) {
      const rsvp = await rsvpRes.json()
      setRsvpStatus(rsvp?.status ?? null)
    }

    // Load reminder from localStorage
    setReminder(typeof window !== 'undefined' && !!localStorage.getItem(`reminder_${ev.id}`))
  }

  async function handleRsvp(status: 'confirmed' | 'maybe' | 'declined') {
    if (!showEventDetail) return
    // Toggle off if same status clicked again
    const newStatus = rsvpStatus === status ? 'declined' : status
    setRsvpLoading(true)
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: showEventDetail.id, status: newStatus }),
    })
    if (res.ok) {
      setRsvpStatus(newStatus === 'declined' ? null : newStatus)
      toast.success(newStatus === 'declined' ? 'RSVP removed' : newStatus === 'confirmed' ? 'Marked as Going!' : 'Marked as Interested!')
    }
    setRsvpLoading(false)
  }

  async function handleRegister() {
    if (!showEventDetail) return
    setRegLoading(true)
    if (registered) {
      const res = await fetch(`/api/events/${showEventDetail.id}/register`, { method: 'DELETE' })
      if (res.ok) { setRegistered(false); toast.success('Registration cancelled') }
    } else {
      const res = await fetch(`/api/events/${showEventDetail.id}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })
      if (res.ok) { setRegistered(true); toast.success('Registered successfully!') }
    }
    setRegLoading(false)
  }

  function toggleReminder() {
    if (!showEventDetail) return
    const key = `reminder_${showEventDetail.id}`
    if (reminder) {
      localStorage.removeItem(key)
      setReminder(false)
      toast.success('Reminder removed')
    } else {
      localStorage.setItem(key, new Date(showEventDetail.date).toISOString())
      setReminder(true)
      toast.success('Reminder set!')
    }
  }

  const CARD_STYLE = {
    background: 'rgba(13,19,36,0.55)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
  } as const

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '26px', background: 'linear-gradient(180deg, #CC0000, #C9A84C)', borderRadius: '2px' }} />
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', letterSpacing: '2px', color: '#ffffff' }}>CALENDAR</h1>
        </div>
        <button onClick={() => { setEditingEvent(null); setSelectedDate(null); setShowModal(true) }} style={{
          display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
          borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #990000)',
          color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(204,0,0,0.3)',
        }}>
          <Plus size={14} /> Add Event
        </button>
      </div>

      {/* Calendar card */}
      <div style={CARD_STYLE}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}><ChevronLeft size={18} /></button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', letterSpacing: '3px', color: '#ffffff' }}>{MONTHS[currentMonth].toUpperCase()}</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>{currentYear}</div>
          </div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}><ChevronRight size={18} /></button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {cells.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : []
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()
            return (
              <div key={i} onClick={() => { if (!day) return; setSelectedDate(new Date(currentYear, currentMonth, day)); setEditingEvent(null); setShowModal(true) }}
                style={{
                  minHeight: '72px', padding: '6px',
                  borderRight: i % 7 !== 6 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  cursor: day ? 'pointer' : 'default',
                  backgroundColor: day ? 'transparent' : 'rgba(0,0,0,0.15)',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { if (day) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={(e) => { if (day) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {day && (
                  <>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: isToday ? '700' : '400',
                      color: isToday ? '#ffffff' : '#9CA3AF',
                      backgroundColor: isToday ? '#CC0000' : 'transparent',
                      marginBottom: '4px',
                    }}>{day}</div>
                    {/* Colored dot indicators */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {dayEvents.slice(0, 5).map((ev) => (
                        <button key={ev.id}
                          onClick={(e) => { e.stopPropagation(); openEventDetail(ev) }}
                          title={ev.title}
                          style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: getEventColor(ev.eventType),
                            border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                            boxShadow: `0 0 4px ${getEventColor(ev.eventType)}80`,
                          }}
                        />
                      ))}
                      {dayEvents.length > 5 && (
                        <span style={{ fontSize: '9px', color: '#6B7280', lineHeight: '8px' }}>+{dayEvents.length - 5}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '14px 0' }}>
        {EVENT_TYPES.map((t) => (
          <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.color }} />
            <span style={{ fontSize: '11px', color: '#6B7280' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <EventModal
          initialDate={selectedDate}
          editingEvent={editingEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null); setSelectedDate(null) }}
          onSuccess={(event) => {
            if (editingEvent) {
              setEvents((prev) => prev.map((e) => e.id === event.id ? event : e))
              toast.success('Event updated')
            } else {
              setEvents((prev) => [...prev, event])
              toast.success('Event created')
            }
            setShowModal(false); setEditingEvent(null)
          }}
        />
      )}

      {/* Event Detail Popup */}
      {showEventDetail && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}
          onClick={() => setShowEventDetail(null)}>
          <div style={{
            background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
            padding: '24px', width: '100%', maxWidth: '420px',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                    backgroundColor: `${getEventColor(showEventDetail.eventType)}20`,
                    color: getEventColor(showEventDetail.eventType), textTransform: 'capitalize',
                  }}>
                    {EVENT_TYPES.find((t) => t.value === showEventDetail.eventType)?.label ?? showEventDetail.eventType}
                  </span>
                  {showEventDetail.regionId && (
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontWeight: '600' }}>REGIONAL</span>
                  )}
                  {showEventDetail.bookingRequired && (
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: '600' }}>BOOKING REQ.</span>
                  )}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px' }}>{showEventDetail.title}</h3>
                {showEventDetail.subtitle && <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{showEventDetail.subtitle}</p>}
              </div>
              <button onClick={() => setShowEventDetail(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Date */}
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>
              📅 {new Date(showEventDetail.date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Meeting slots */}
            {showEventDetail.eventType === 'chapter' && detailSlots.length > 0 && (
              <div style={{ marginBottom: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Presentation Slots</span>
                  {detailSlots.some((s) => !s.assignedUserName) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#CC0000' }}><AlertCircle size={10} /> Unassigned</span>
                  )}
                </div>
                {detailSlots.map((slot) => {
                  const isEdu = slot.slotType === 'edu_slot'
                  const color = isEdu ? '#10B981' : '#C9A84C'
                  const Icon = isEdu ? GraduationCap : Mic2
                  return (
                    <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Icon size={12} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color, fontWeight: '500', minWidth: '110px' }}>{isEdu ? 'EDU Slot' : `Feature Pres. ${slot.slotNumber}`}</span>
                      <span style={{ fontSize: '11px', color: slot.assignedUserName ? '#D1D5DB' : '#4B5563', flex: 1 }}>{slot.assignedUserName ?? '— Unassigned —'}</span>
                    </div>
                  )
                })}
                <div style={{ padding: '5px 12px' }}>
                  <Link href="/dashboard/presentations" onClick={() => setShowEventDetail(null)} style={{ fontSize: '11px', color: '#C9A84C', textDecoration: 'none' }}>Manage slots →</Link>
                </div>
              </div>
            )}

            {/* RSVP buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button onClick={() => handleRsvp('confirmed')} disabled={rsvpLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '9px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  border: rsvpStatus === 'confirmed' ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: rsvpStatus === 'confirmed' ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: rsvpStatus === 'confirmed' ? '#10B981' : '#9CA3AF', transition: 'all 0.15s',
                }}>
                <Check size={13} /> Going
              </button>
              <button onClick={() => handleRsvp('maybe')} disabled={rsvpLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '9px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  border: rsvpStatus === 'maybe' ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: rsvpStatus === 'maybe' ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: rsvpStatus === 'maybe' ? '#F59E0B' : '#9CA3AF', transition: 'all 0.15s',
                }}>
                <Star size={13} /> Interested
              </button>
              <button onClick={toggleReminder}
                style={{
                  width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '9px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  border: reminder ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: reminder ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: reminder ? '#C9A84C' : '#9CA3AF', transition: 'all 0.15s', flexShrink: 0,
                }}>
                {reminder ? <Bell size={13} /> : <BellOff size={13} />}
              </button>
            </div>

            {/* Book Now */}
            {showEventDetail.bookingRequired && (
              <button onClick={handleRegister} disabled={regLoading}
                style={{
                  width: '100%', padding: '9px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '700', marginBottom: '10px',
                  border: registered ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(139,92,246,0.3)',
                  background: registered ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)',
                  color: registered ? '#A78BFA' : '#8B5CF6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                <Bookmark size={13} />
                {regLoading ? 'Processing...' : registered ? 'Registered ✓ (Cancel)' : 'Book Now'}
              </button>
            )}

            {/* Admin actions */}
            {!showEventDetail.regionId && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditingEvent(showEventDetail); setShowEventDetail(null); setShowModal(true) }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '9px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)',
                    backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '12px', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9CA3AF' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDeleteEvent(showEventDetail.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '9px', borderRadius: '8px', border: '1px solid rgba(204,0,0,0.3)',
                    backgroundColor: 'rgba(204,0,0,0.1)', color: '#CC0000', fontSize: '12px', cursor: 'pointer',
                  }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EventModal({ initialDate, editingEvent, onClose, onSuccess }: {
  initialDate: Date | null; editingEvent: Event | null; onClose: () => void; onSuccess: (event: Event) => void
}) {
  const formatDateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: editingEvent ? formatDateInput(new Date(editingEvent.date)) : initialDate ? formatDateInput(initialDate) : formatDateInput(new Date()),
    title: editingEvent?.title ?? '',
    subtitle: editingEvent?.subtitle ?? '',
    eventType: editingEvent?.eventType ?? 'chapter',
    bookingRequired: (editingEvent as any)?.bookingRequired ?? false,
  })

  function set(key: string, val: string | boolean) { setForm((p) => ({ ...p, [key]: val })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
    const method = editingEvent ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: '[]', colors: '[]' }),
    })
    setLoading(false)
    if (res.ok) onSuccess(await res.json())
    else { const err = await res.json(); toast.error(err.error || 'Failed to save event') }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(6,10,20,0.6)',
    color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}
      onClick={onClose}>
      <div style={{
        background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
        padding: '28px', width: '100%', maxWidth: '440px',
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px', letterSpacing: '2px', color: '#ffffff', marginBottom: '20px' }}>
          {editingEvent ? 'EDIT EVENT' : 'ADD EVENT'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={labelStyle}>Date *</label><input style={inputStyle} type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required /></div>
          <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="Chapter Weekly Meeting" /></div>
          <div><label style={labelStyle}>Subtitle</label><input style={inputStyle} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Optional subtitle or location" /></div>
          <div>
            <label style={labelStyle}>Event Type</label>
            <select style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark', background: '#0d1324' }} value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,10,20,0.4)' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>Booking Required</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Members must register to attend</div>
            </div>
            <button type="button" onClick={() => set('bookingRequired', !form.bookingRequired)} style={{
              width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: form.bookingRequired ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: '3px', left: form.bookingRequired ? '21px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%', background: '#ffffff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #990000)', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : editingEvent ? 'Update' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
