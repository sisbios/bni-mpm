'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Globe, Loader2 } from 'lucide-react'

type RegionEvent = {
  id: string
  date: string
  title: string
  subtitle: string | null
  eventType: string
  isActive: boolean
  bookingRequired: boolean
  chapterId: string | null
  regionId: string | null
  chapterName: string
  registrationCount: number
}

const EVENT_TYPES = [
  { value: 'regional',      label: 'Regional Event',  color: '#CC0000' },
  { value: 'training',      label: 'Training',        color: '#10B981' },
  { value: 'social',        label: 'Social',          color: '#F59E0B' },
  { value: 'trip',          label: 'Trip',            color: '#EC4899' },
  { value: 'international', label: 'International',   color: '#C9A84C' },
  { value: 'chapter',       label: 'Chapter Meeting', color: '#3B82F6' },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getColor(type: string) {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? '#9CA3AF'
}

const CARD: React.CSSProperties = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
}

export default function RegionCalendarClient({ chapters }: { chapters: { id: string; name: string }[] }) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents]         = useState<RegionEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterChapter, setFilterChapter] = useState('')
  const [detail, setDetail]         = useState<RegionEvent | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editingEvent, setEditingEvent] = useState<RegionEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const q = filterChapter ? `&chapterId=${filterChapter}` : ''
    const res = await fetch(`/api/region/events?month=${month + 1}&year=${year}${q}`)
    if (res.ok) setEvents(await res.json())
    setLoading(false)
  }, [month, year, filterChapter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  function dayEvents(day: number) {
    return events.filter((e) => {
      const d = new Date(e.date)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
  }

  async function handleDelete(ev: RegionEvent) {
    if (!confirm(`Delete "${ev.title}"?`)) return
    const res = await fetch(`/api/region/events/${ev.id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== ev.id))
      setDetail(null)
      toast.success('Event deleted')
    } else {
      toast.error('Failed to delete event')
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '26px', background: 'linear-gradient(180deg, #CC0000, #990000)', borderRadius: '2px' }} />
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', letterSpacing: '2px', color: '#ffffff', margin: 0 }}>
            REGION <span style={{ color: '#CC0000' }}>CALENDAR</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Chapter filter */}
          <select
            value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#9CA3AF', padding: '8px 12px', fontSize: '12px', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
          >
            <option value="">All Chapters</option>
            {chapters.map((c) => <option key={c.id} value={c.id} style={{ background: '#0A0F1E' }}>{c.name}</option>)}
          </select>
          <button
            onClick={() => { setEditingEvent(null); setSelectedDate(null); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #990000)', color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(204,0,0,0.35)' }}
          >
            <Plus size={14} /> New Regional Event
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.25)', marginBottom: '16px' }}>
        <Globe size={13} style={{ color: '#CC0000', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: '#FF6B6B' }}>
          Regional events (<span style={{ fontWeight: '700' }}>red</span>) appear automatically on all chapter calendars. Chapter events are read-only here.
        </span>
      </div>

      {/* Calendar grid */}
      <div style={CARD}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}><ChevronLeft size={18} /></button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', letterSpacing: '3px', color: '#ffffff' }}>{MONTHS[month].toUpperCase()}</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>{year}</div>
          </div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}><ChevronRight size={18} /></button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        {/* Grid cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {loading
            ? Array.from({ length: 35 }).map((_, i) => (
                <div key={i} style={{ minHeight: '72px', borderRight: i % 7 !== 6 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }} />
              ))
            : cells.map((day, i) => {
                const evs = day ? dayEvents(day) : []
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!day) return
                      setSelectedDate(new Date(year, month, day))
                      setEditingEvent(null)
                      setShowModal(true)
                    }}
                    style={{ minHeight: '72px', padding: '6px', borderRight: i % 7 !== 6 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: day ? 'pointer' : 'default', background: day ? 'transparent' : 'rgba(0,0,0,0.15)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { if (day) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={(e) => { if (day) e.currentTarget.style.background = 'transparent' }}
                  >
                    {day && (
                      <>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: isToday ? '700' : '400', color: isToday ? '#fff' : '#9CA3AF', background: isToday ? '#CC0000' : 'transparent', marginBottom: '4px' }}>{day}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {evs.slice(0, 5).map((ev) => (
                            <button
                              key={ev.id}
                              title={ev.regionId ? `${ev.title} (Regional)` : `${ev.title} · ${ev.chapterName}`}
                              onClick={(e) => { e.stopPropagation(); setDetail(ev) }}
                              style={{
                                width: ev.regionId ? '10px' : '8px',
                                height: ev.regionId ? '10px' : '8px',
                                borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                                background: ev.regionId ? '#CC0000' : getColor(ev.eventType),
                                boxShadow: ev.regionId ? '0 0 5px rgba(204,0,0,0.7)' : `0 0 4px ${getColor(ev.eventType)}80`,
                              } as React.CSSProperties}
                            />
                          ))}
                          {evs.length > 5 && <span style={{ fontSize: '9px', color: '#6B7280', lineHeight: '8px' }}>+{evs.length - 5}</span>}
                        </div>
                      </>
                    )}
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CC0000', boxShadow: '0 0 5px rgba(204,0,0,0.7)' }} />
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Regional (all chapters)</span>
        </div>
        {EVENT_TYPES.filter((t) => t.value !== 'regional').map((t) => (
          <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }} />
            <span style={{ fontSize: '11px', color: '#6B7280' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Event detail popup */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}
          onClick={() => setDetail(null)}>
          <div style={{ background: 'rgba(10,15,28,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', width: '100%', maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${getColor(detail.eventType)}20`, color: getColor(detail.eventType), textTransform: 'capitalize' }}>
                    {EVENT_TYPES.find((t) => t.value === detail.eventType)?.label ?? detail.eventType}
                  </span>
                  {detail.regionId && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(204,0,0,0.12)', color: '#FF6B6B', fontWeight: '700' }}>
                      <Globe size={9} /> ALL CHAPTERS
                    </span>
                  )}
                  {!detail.regionId && (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(201,168,76,0.12)', color: '#C9A84C', fontWeight: '600' }}>
                      {detail.chapterName}
                    </span>
                  )}
                  {detail.bookingRequired && (
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: '600' }}>BOOKING REQ.</span>
                  )}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px' }}>{detail.title}</h3>
                {detail.subtitle && <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{detail.subtitle}</p>}
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '2px', flexShrink: 0 }}><X size={16} /></button>
            </div>

            <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>
              📅 {new Date(detail.date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {detail.bookingRequired && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.25)', marginBottom: '14px', fontSize: '13px', color: '#FF6B6B' }}>
                {detail.registrationCount} member{detail.registrationCount !== 1 ? 's' : ''} registered
              </div>
            )}

            {/* Actions — only for regional events */}
            {detail.regionId ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setEditingEvent(detail); setDetail(null); setShowModal(true) }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#9CA3AF', fontSize: '12px', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9CA3AF' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(detail)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', borderRadius: '8px', border: '1px solid rgba(204,0,0,0.3)', background: 'rgba(204,0,0,0.1)', color: '#CC0000', fontSize: '12px', cursor: 'pointer' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#4B5563', textAlign: 'center', margin: 0 }}>Chapter event — edit from the chapter dashboard</p>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <RegionEventModal
          initialDate={selectedDate}
          editingEvent={editingEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null); setSelectedDate(null) }}
          onSuccess={(ev) => {
            if (editingEvent) {
              setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, ...ev } : e))
              toast.success('Event updated')
            } else {
              // Reload to get chapterName/registrationCount from API
              fetchEvents()
              toast.success('Regional event created — visible on all chapter calendars')
            }
            setShowModal(false); setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────────

const REGION_EVENT_TYPES = [
  { value: 'regional',      label: 'Regional Event' },
  { value: 'training',      label: 'Training' },
  { value: 'social',        label: 'Social' },
  { value: 'trip',          label: 'Trip' },
  { value: 'international', label: 'International' },
]

function RegionEventModal({ initialDate, editingEvent, onClose, onSuccess }: {
  initialDate: Date | null
  editingEvent: RegionEvent | null
  onClose: () => void
  onSuccess: (ev: RegionEvent) => void
}) {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date:            editingEvent ? fmt(new Date(editingEvent.date)) : initialDate ? fmt(initialDate) : fmt(new Date()),
    title:           editingEvent?.title ?? '',
    subtitle:        editingEvent?.subtitle ?? '',
    eventType:       editingEvent?.eventType ?? 'regional',
    bookingRequired: editingEvent?.bookingRequired ?? false,
  })

  function set(k: string, v: string | boolean) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const url    = editingEvent ? `/api/region/events/${editingEvent.id}` : '/api/region/events'
    const method = editingEvent ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) onSuccess(await res.json())
    else { const err = await res.json().catch(() => ({})); toast.error(err.error ?? 'Failed to save event') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,10,20,0.6)', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}
      onClick={onClose}>
      <div style={{ background: 'rgba(10,15,28,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderRadius: '14px', border: '1px solid rgba(204,0,0,0.25)', padding: '28px', width: '100%', maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Globe size={16} style={{ color: '#CC0000' }} />
          <h2 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px', letterSpacing: '2px', color: '#ffffff', margin: 0 }}>
            {editingEvent ? 'EDIT REGIONAL EVENT' : 'NEW REGIONAL EVENT'}
          </h2>
        </div>

        {!editingEvent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.25)', marginBottom: '18px', fontSize: '12px', color: '#FF6B6B' }}>
            <Globe size={11} /> This event will appear on all chapter calendars automatically
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={lbl}>Date *</label>
            <input style={{ ...inp, colorScheme: 'dark' }} type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <label style={lbl}>Title *</label>
            <input style={inp} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. BNI Regional Training Day" />
          </div>
          <div>
            <label style={lbl}>Subtitle / Venue</label>
            <input style={inp} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. Grand Hyatt, Kochi" />
          </div>
          <div>
            <label style={lbl}>Event Type</label>
            <select style={{ ...inp, cursor: 'pointer', colorScheme: 'dark', background: '#0d1324' }} value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
              {REGION_EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,10,20,0.4)' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>Booking Required</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Members must register to attend</div>
            </div>
            <button type="button" onClick={() => set('bookingRequired', !form.bookingRequired)} style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: form.bookingRequired ? '#CC0000' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '3px', left: form.bookingRequired ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: loading ? 'rgba(153,0,0,0.5)' : 'linear-gradient(135deg, #CC0000, #990000)', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
