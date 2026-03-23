'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Users, UserCheck, Phone, Mail, Zap, X } from 'lucide-react'

type Contact = {
  id: string
  contactName: string
  phone: string | null
  email: string | null
  business: string | null
  relationship: string | null
  category: string | null
  address: string | null
  notes: string | null
  userId: string
  contributorName: string
  contributorBusiness: string | null
}

type Member = { id: string; name: string }

const RELATIONSHIP_COLORS: Record<string, string> = {
  friend: '#10B981',
  family: '#C9A84C',
  neighbor: '#F59E0B',
  colleague: '#3B82F6',
  client: '#8B5CF6',
  vendor: '#EC4899',
  other: '#6B7280',
}

function getCurrentISOWeek() {
  const now = new Date()
  const dayOfYear = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1)
  const weekNum = Math.ceil(dayOfYear / 7)
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export default function ContactsPoolClient({
  initialContacts,
  members,
  contribMap,
}: {
  initialContacts: Contact[]
  members: Member[]
  contribMap: Record<string, number>
}) {
  const [contacts] = useState(initialContacts)
  const [search, setSearch] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterRelationship, setFilterRelationship] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [week, setWeek] = useState(getCurrentISOWeek())
  const [assignResults, setAssignResults] = useState<{ member: string; assigned: number }[] | null>(null)

  const filtered = contacts.filter((c) => {
    const matchSearch =
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search) ||
      (c.business ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.contributorName.toLowerCase().includes(search.toLowerCase())
    const matchMember = filterMember ? c.userId === filterMember : true
    const matchRel = filterRelationship ? c.relationship === filterRelationship : true
    return matchSearch && matchMember && matchRel
  })

  async function handleAssign() {
    if (!confirm(`Push 5 contacts from the pool to ALL ${members.length} active members for week ${week}?\n\nThis will create calling tasks for each member.`)) return
    setAssigning(true)
    const res = await fetch('/api/contacts/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week }),
    })
    setAssigning(false)
    if (res.ok) {
      const data = await res.json()
      setAssignResults(data.results)
      toast.success(`Done! ${data.totalCreated} tasks created across ${members.length} members.`)
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to assign contacts')
    }
  }

  // Group contacts by contributor
  const byMember: Record<string, Contact[]> = {}
  for (const c of contacts) {
    if (!byMember[c.userId]) byMember[c.userId] = []
    byMember[c.userId].push(c)
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1' }}>CONTACT SPHERE POOL</h1>
            <p style={{ fontSize: '15px', color: '#9CA3AF', marginTop: '2px' }}>
              {contacts.length} contacts contributed by {Object.keys(byMember).length} members
            </p>
          </div>
        </div>
        {/* Assign button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            placeholder="2026-W13"
            style={{
              padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(13,19,36,0.55)', color: '#ffffff', fontSize: '15px',
              outline: 'none', width: '130px',
            }}
          />
          <button
            onClick={handleAssign}
            disabled={assigning}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              borderRadius: '8px', border: 'none',
              background: assigning ? 'rgba(204,0,0,0.3)' : 'linear-gradient(135deg, #CC0000, #880000)',
              color: '#fff', fontSize: '15px', fontWeight: '700', cursor: assigning ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(204,0,0,0.3)',
            }}
          >
            <Zap size={16} />
            {assigning ? 'Assigning...' : 'Push 5 to All Members'}
          </button>
        </div>
      </div>

      {/* Assignment results */}
      {assignResults && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '10px', padding: '16px 20px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#10B981' }}>Assignment Complete</span>
            <button onClick={() => setAssignResults(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {assignResults.map((r) => (
              <div key={r.member} style={{
                padding: '6px 12px', borderRadius: '6px', fontSize: '13px',
                background: r.assigned > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                color: r.assigned > 0 ? '#10B981' : '#6B7280',
                border: `1px solid ${r.assigned > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.2)'}`,
              }}>
                {r.member}: <strong>{r.assigned} tasks</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member contribution overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {members.map((m) => {
          const count = contribMap[m.id] ?? 0
          const pct = Math.min((count / 40) * 100, 100)
          const color = count >= 40 ? '#10B981' : count >= 20 ? '#C9A84C' : '#CC0000'
          return (
            <div
              key={m.id}
              onClick={() => setFilterMember(filterMember === m.id ? '' : m.id)}
              style={{
                background: filterMember === m.id ? 'rgba(201,168,76,0.08)' : 'rgba(13,19,36,0.55)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                borderRadius: '10px',
                border: filterMember === m.id ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.07)',
                padding: '12px 14px', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{m.name}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color, flexShrink: 0, marginLeft: '8px' }}>{count}/40</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search contacts, contributor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,19,36,0.55)',
            backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            color: '#ffffff', fontSize: '15px', outline: 'none',
          }}
        />
        <select
          value={filterRelationship}
          onChange={(e) => setFilterRelationship(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(13,19,36,0.55)', color: '#ffffff', fontSize: '15px', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">All relationships</option>
          {['friend', 'family', 'neighbor', 'colleague', 'client', 'vendor', 'other'].map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Contacts list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#8B95A3', background: 'rgba(13,19,36,0.55)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Users size={40} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
          <p>No contacts found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {filtered.map((contact) => {
            const relColor = RELATIONSHIP_COLORS[contact.relationship ?? 'other'] ?? '#6B7280'
            return (
              <div key={contact.id} style={{
                background: 'rgba(13,19,36,0.55)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)',
                padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
                borderLeft: `3px solid ${relColor}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>{contact.contactName}</div>
                    {contact.business && (
                      <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>{contact.business}</div>
                    )}
                  </div>
                  {contact.relationship && (
                    <span style={{
                      fontSize: '13px', padding: '3px 8px', borderRadius: '4px',
                      backgroundColor: `${relColor}15`, color: relColor, textTransform: 'capitalize', flexShrink: 0,
                    }}>
                      {contact.relationship}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                  {contact.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF' }}>
                      <Phone size={12} style={{ color: '#6B7280' }} />
                      <a href={`tel:${contact.phone}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>{contact.phone}</a>
                    </div>
                  )}
                  {contact.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF' }}>
                      <Mail size={12} style={{ color: '#6B7280' }} />
                      {contact.email}
                    </div>
                  )}
                </div>
                {/* Contributor tag */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px',
                  borderRadius: '6px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
                }}>
                  <UserCheck size={13} style={{ color: '#C9A84C', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#C9A84C' }}>
                    Contributed by <strong>{contact.contributorName}</strong>
                    {contact.contributorBusiness ? ` · ${contact.contributorBusiness}` : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
