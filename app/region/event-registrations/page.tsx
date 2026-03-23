'use client'
import { useState, useEffect } from 'react'
import { ClipboardList, Users, Download, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'

type EventRow = {
  id: string
  title: string
  subtitle: string | null
  date: string
  eventType: string
  chapterName: string
  registrationCount: number
}

type Registrant = {
  id: string
  name: string
  email: string | null
  phone: string | null
  business: string | null
  status: string
  registeredAt: string
  chapterId: string | null
  notes: string | null
}

const TYPE_COLORS: Record<string, string> = {
  chapter: '#3B82F6', regional: '#8B5CF6', training: '#10B981',
  social: '#F59E0B', trip: '#EC4899', international: '#C9A84C',
}

export default function EventRegistrationsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null)
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    fetch('/api/region/registrations')
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function openEvent(ev: EventRow) {
    setSelectedEvent(ev)
    setRegLoading(true)
    const res = await fetch(`/api/region/registrations?eventId=${ev.id}`)
    if (res.ok) setRegistrants(await res.json())
    setRegLoading(false)
  }

  function exportSigningSheet() {
    if (!selectedEvent || registrants.length === 0) return
    const date = new Date(selectedEvent.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const rows = registrants
      .filter((r) => r.status === 'registered')
      .map((r, i) => `
        <tr style="height:44px">
          <td style="border:1px solid #ddd;padding:8px 12px;text-align:center;color:#666">${i + 1}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;font-weight:600">${r.name}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;color:#555">${r.business || '—'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px;color:#555">${r.phone || '—'}</td>
          <td style="border:1px solid #ddd;padding:8px 12px"></td>
        </tr>
      `).join('')

    const html = `
      <!DOCTYPE html><html><head><title>Signing Sheet — ${selectedEvent.title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #CC0000; }
        .bni-badge { background: #CC0000; color: white; font-weight: 900; font-size: 22px; padding: 8px 16px; border-radius: 6px; letter-spacing: 2px; }
        .event-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
        .event-sub { color: #555; font-size: 14px; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        thead { background: #1a1a2e; color: white; }
        th { padding: 10px 12px; text-align: left; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; }
        tbody tr:nth-child(even) { background: #f8f8f8; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 12px; color: #999; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div>
          <div class="bni-badge">BNI</div>
          <div style="margin-top:12px">
            <div class="event-title">${selectedEvent.title}</div>
            ${selectedEvent.subtitle ? `<p class="event-sub">${selectedEvent.subtitle}</p>` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;color:#555">${date}</div>
          <div style="font-size:13px;color:#555;margin-top:4px">${selectedEvent.chapterName}</div>
          <div style="font-size:13px;font-weight:600;margin-top:4px">${registrants.filter(r=>r.status==='registered').length} Registrants</div>
        </div>
      </div>
      <table>
        <thead><tr>
          <th style="width:50px">#</th>
          <th>Name</th>
          <th>Business / Category</th>
          <th>Phone</th>
          <th>Signature</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <span>BNI Platform — Event Sign-In Sheet</span>
        <span>Generated: ${new Date().toLocaleDateString('en-IN')}</span>
      </div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const CARD = { background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.28)' } as const

  if (selectedEvent) {
    const active = registrants.filter((r) => r.status === 'registered')
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => { setSelectedEvent(null); setRegistrants([]) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>
            <ArrowLeft size={13} /> Back to events
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>{selectedEvent.title}</h1>
              <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0' }}>
                {new Date(selectedEvent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {active.length} registered
              </p>
            </div>
            <button onClick={exportSigningSheet} style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px',
              border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.1)',
              color: '#C9A84C', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}>
              <Download size={14} /> Export Signing Sheet
            </button>
          </div>
        </div>

        <div style={CARD}>
          {regLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
              <p style={{ margin: 0 }}>Loading registrants...</p>
            </div>
          ) : active.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
              <Users size={36} style={{ display: 'block', margin: '0 auto 10px' }} />
              <p style={{ margin: 0 }}>No registrations yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['#', 'Name', 'Business', 'Phone', 'Email', 'Registered At'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.map((r, idx) => (
                    <tr key={r.id} style={{ borderBottom: idx < active.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '10px 14px', color: '#6B7280' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: '#ffffff' }}>{r.name}</td>
                      <td style={{ padding: '10px 14px', color: '#9CA3AF' }}>{r.business || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#9CA3AF' }}>{r.phone || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#9CA3AF' }}>{r.email || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {new Date(r.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          EVENT <span style={{ color: '#8B5CF6' }}>REGISTRATIONS</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px', marginBottom: 0 }}>Events with booking enabled — click to view registrants</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
          <p style={{ margin: 0 }}>Loading...</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{ ...CARD, padding: '60px', textAlign: 'center', color: '#4B5563' }}>
          <ClipboardList size={36} style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: 0 }}>No events with booking enabled.</p>
          <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Enable "Booking Required" when creating events to track registrations.</p>
        </div>
      ) : (
        <div style={CARD}>
          {events.map((ev, idx) => {
            const color = TYPE_COLORS[ev.eventType] ?? '#9CA3AF'
            return (
              <div key={ev.id} onClick={() => openEvent(ev)} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                borderBottom: idx < events.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {ev.chapterName}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#8B5CF6', lineHeight: 1 }}>{ev.registrationCount}</div>
                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>registered</div>
                </div>
                <ChevronRight size={16} style={{ color: '#4B5563', flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
