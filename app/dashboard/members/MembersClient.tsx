'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Plus, Upload, Users, Trash2, Eye, Phone, AlertTriangle } from 'lucide-react'
import { TRAFFIC_COLORS } from '@/lib/traffic-light'

type Member = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  business: string | null
  category: string | null
  isActive: boolean
  createdAt: string | Date
  membershipValidTill: string | null
  _count: { achievements: number; tasks: number; contactSphere: number }
}

type TrafficScore = { color: string; total: number }

export default function MembersClient({
  initialMembers,
  roles,
  trafficScores = {},
}: {
  initialMembers: Member[]
  roles: { id: string; slug: string; label: string; color: string }[]
  trafficScores?: Record<string, TrafficScore>
}) {
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [renewalFilter, setRenewalFilter] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const router = useRouter()

  const today = new Date()

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.business ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.category ?? '').toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (renewalFilter) {
      if (!m.membershipValidTill) return false
      const expiry = new Date(m.membershipValidTill)
      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysLeft <= 60
    }
    return true
  })

  const renewalCount = members.filter((m) => {
    if (!m.membershipValidTill) return false
    const daysLeft = Math.ceil((new Date(m.membershipValidTill).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 60
  }).length

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the chapter?`)) return
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success(`${name} removed`)
    } else {
      toast.error('Failed to remove member')
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: updated.role } : m))
      toast.success('Role updated')
    } else toast.error('Failed to update role')
  }

  function getRoleStyle(slug: string) {
    const r = roles.find((r) => r.slug === slug)
    const color = r?.color ?? '#9CA3AF'
    return { color, bg: `${color}15`, border: `${color}30` }
  }

  function getRoleLabel(slug: string) {
    return roles.find((r) => r.slug === slug)?.label ?? slug
  }

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')
    if (!fileInput?.files?.[0]) return toast.error('Please select a CSV file')

    const formData = new FormData()
    formData.append('file', fileInput.files[0])

    setImporting(true)
    const res = await fetch('/api/members/import', { method: 'POST', body: formData })
    setImporting(false)

    if (res.ok) {
      const data = await res.json()
      toast.success(`Imported ${data.created} members (${data.skipped} skipped)`)
      setShowImportModal(false)
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Import failed')
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '4px',
              height: '28px',
              background: 'linear-gradient(180deg, #CC0000, #C9A84C)',
              borderRadius: '2px',
            }}
          />
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-bebas), sans-serif',
                fontSize: '28px',
                letterSpacing: '2px',
                color: '#ffffff',
                lineHeight: '1',
              }}
            >
              MEMBERS
            </h1>
            <p style={{ fontSize: '17px', color: '#9CA3AF', marginTop: '2px' }}>
              {members.length} active members
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: 'transparent',
              color: '#9CA3AF',
              fontSize: '17px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#C9A84C'
              e.currentTarget.style.color = '#C9A84C'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = '#9CA3AF'
            }}
          >
            <Upload size={15} />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #CC0000, #990000)',
              color: '#ffffff',
              fontSize: '17px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(204,0,0,0.3)',
            }}
          >
            <Plus size={15} />
            Add Member
          </button>
        </div>
      </div>

      {/* Renewal alert banner */}
      {renewalCount > 0 && (
        <div style={{
          marginBottom: '16px', padding: '10px 16px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '600' }}>
              {renewalCount} membership{renewalCount > 1 ? 's' : ''} expiring within 60 days
            </span>
          </div>
          <button
            onClick={() => setRenewalFilter((v) => !v)}
            style={{
              padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.4)',
              background: renewalFilter ? 'rgba(245,158,11,0.2)' : 'transparent',
              color: '#F59E0B', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            {renewalFilter ? 'Show All' : 'Filter'}
          </button>
        </div>
      )}

      {/* Search */}
      <div
        style={{
          position: 'relative',
          marginBottom: '20px',
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7280',
          }}
        />
        <input
          type="text"
          placeholder="Search by name, email, business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 40px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.07)',
            backgroundColor: 'rgba(6,10,20,0.6)',
            color: '#ffffff',
            fontSize: '17px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
        />
      </div>

      {/* Mobile Card View — shown only on small screens */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8B95A3' }}>
            <Users size={36} style={{ margin: '0 auto 10px', color: '#4B5563' }} />
            <p style={{ fontSize: '14px', fontWeight: '400' }}>
              {search ? 'No members match your search' : 'No members yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((member) => {
              const roleStyle = getRoleStyle(member.role)
              const cnt = member._count.contactSphere
              const pct = Math.min((cnt / 40) * 100, 100)
              const col = cnt >= 40 ? '#10B981' : cnt >= 20 ? '#C9A84C' : '#CC0000'
              const sc = trafficScores[member.id] ?? { color: 'black', total: 0 }
              const tlHex = TRAFFIC_COLORS[sc.color as keyof typeof TRAFFIC_COLORS] ?? '#6B7280'
              const memberExpiry = member.membershipValidTill ? new Date(member.membershipValidTill) : null
              const daysToExpiry = memberExpiry ? Math.ceil((memberExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
              return (
                <div
                  key={member.id}
                  style={{
                    background: 'rgba(13,19,36,0.7)',
                    borderRadius: '12px',
                    border: `1px solid ${daysToExpiry !== null && daysToExpiry <= 30 ? 'rgba(204,0,0,0.25)' : daysToExpiry !== null && daysToExpiry <= 60 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                  }}
                >
                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 8px' }}>
                    {/* Avatar with traffic light ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'rgba(201,168,76,0.12)', border: `2px solid ${tlHex}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '700', fontSize: '16px', color: '#C9A84C',
                        }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: '-2px', right: '-2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: tlHex, border: '1.5px solid #0A0F1E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '7px', fontWeight: '800', color: sc.color === 'yellow' ? '#000' : '#fff',
                      }}>
                        {sc.total}
                      </div>
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.3' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '300', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.3' }}>
                        {member.business ?? member.email}
                      </div>
                    </div>

                    {/* Role select (compact) */}
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      style={{
                        padding: '3px 6px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
                        backgroundColor: roleStyle.bg, color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`, outline: 'none', flexShrink: 0,
                        maxWidth: '90px', fontWeight: '500',
                      }}
                    >
                      {roles.map((r) => (
                        <option key={r.slug} value={r.slug} style={{ background: '#0A0F1E', color: '#ffffff' }}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stats strip */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      padding: '6px 12px',
                    }}
                  >
                    <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '0 8px 0 0' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: '1.1' }}>{member._count.achievements}</div>
                      <div style={{ fontSize: '10px', fontWeight: '300', color: '#6B7280', letterSpacing: '0.03em' }}>Awards</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '0 8px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: '1.1' }}>{member._count.tasks}</div>
                      <div style={{ fontSize: '10px', fontWeight: '300', color: '#6B7280', letterSpacing: '0.03em' }}>Tasks</div>
                    </div>
                    <div style={{ flex: 1, padding: '0 0 0 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '300', color: '#6B7280' }}>Sphere</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: col }}>{cnt}/40</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', gap: '0', padding: '0' }}>
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        padding: '9px', borderRight: '1px solid rgba(255,255,255,0.05)',
                        color: '#9CA3AF', fontSize: '12px', fontWeight: '400', textDecoration: 'none',
                        borderRadius: '0 0 0 12px',
                      }}
                    >
                      <Eye size={13} /> View
                    </Link>
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '9px', borderRight: '1px solid rgba(255,255,255,0.05)',
                          color: '#10B981', fontSize: '12px', fontWeight: '400', textDecoration: 'none',
                          background: 'rgba(16,185,129,0.05)',
                        }}
                      >
                        <Phone size={13} /> Call
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      style={{
                        flex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        padding: '9px 14px', color: '#6B7280', fontSize: '12px', fontWeight: '400',
                        background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0 0 12px 0',
                      }}
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

      {/* Desktop Table View — hidden on mobile */}
      <div className="hidden md:block">
        <div
          style={{
            background: 'rgba(13,19,36,0.55)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '80px',
                textAlign: 'center',
                color: '#8B95A3',
              }}
            >
              <Users size={40} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
              <p style={{ fontSize: '17px' }}>
                {search ? 'No members match your search' : 'No members yet'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '35%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Member', 'Score', 'Call', 'Role', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#6B7280',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => {
                  const roleStyle = getRoleStyle(member.role)
                  const sc = trafficScores[member.id] ?? { color: 'black', total: 0 }
                  const tlHex = TRAFFIC_COLORS[sc.color as keyof typeof TRAFFIC_COLORS] ?? '#6B7280'
                  const memberExpiry = member.membershipValidTill ? new Date(member.membershipValidTill) : null
                  const daysLeft = memberExpiry ? Math.ceil((memberExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
                  return (
                    <tr
                      key={member.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(255,255,255,0.02)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent')
                      }
                    >
                      {/* Member column — name, email, business/category, expiry badge */}
                      <td style={{ padding: '10px 12px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                              background: 'rgba(201,168,76,0.10)', border: `2px solid ${tlHex}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '700', fontSize: '15px', color: '#C9A84C',
                            }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <Link
                              href={`/dashboard/members/${member.id}`}
                              style={{
                                fontSize: '14px', fontWeight: '600', color: '#ffffff',
                                textDecoration: 'none', display: 'block',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A84C')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
                            >
                              {member.name}
                            </Link>
                            <div style={{
                              fontSize: '12px', color: '#6B7280',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {member.business ? member.business : member.email}
                              {member.category ? ` · ${member.category}` : ''}
                            </div>
                            {daysLeft !== null && daysLeft <= 60 && (
                              <div style={{
                                marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '3px',
                                fontSize: '11px', padding: '1px 5px', borderRadius: '4px',
                                background: daysLeft <= 30 ? 'rgba(204,0,0,0.12)' : 'rgba(245,158,11,0.12)',
                                color: daysLeft <= 30 ? '#CC0000' : '#F59E0B', fontWeight: '600',
                              }}>
                                <AlertTriangle size={9} />
                                {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Score */}
                      <td style={{ padding: '10px 12px' }}>
                        <Link href={`/dashboard/members/${member.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%', background: tlHex,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '12px', color: sc.color === 'yellow' ? '#000' : '#fff',
                            boxShadow: `0 0 8px ${tlHex}60`, cursor: 'pointer',
                          }} title={`Score: ${sc.total}`}>
                            {sc.total}
                          </div>
                        </Link>
                      </td>
                      {/* Call */}
                      <td style={{ padding: '10px 12px' }}>
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            title={member.phone}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '30px', height: '30px', borderRadius: '6px',
                              backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                              color: '#10B981', textDecoration: 'none', transition: 'all 0.15s',
                            }}
                          >
                            <Phone size={13} />
                          </a>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#4B5563' }}>—</span>
                        )}
                      </td>
                      {/* Role */}
                      <td style={{ padding: '10px 12px' }}>
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          style={{
                            padding: '4px 6px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer',
                            backgroundColor: roleStyle.bg, color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`, outline: 'none',
                            maxWidth: '100%',
                          }}
                        >
                          {roles.map((r) => (
                            <option key={r.slug} value={r.slug} style={{ background: '#0A0F1E', color: '#ffffff' }}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link
                            href={`/dashboard/members/${member.id}`}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '30px', height: '30px', borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.07)',
                              backgroundColor: 'transparent', color: '#9CA3AF',
                              textDecoration: 'none', transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#C9A84C'
                              e.currentTarget.style.color = '#C9A84C'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                              e.currentTarget.style.color = '#9CA3AF'
                            }}
                          >
                            <Eye size={13} />
                          </Link>
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '30px', height: '30px', borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.07)',
                              backgroundColor: 'transparent', color: '#9CA3AF',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#CC0000'
                              e.currentTarget.style.color = '#CC0000'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                              e.currentTarget.style.color = '#9CA3AF'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newMember) => {
            setMembers((prev) => [
              ...prev,
              { ...newMember, _count: { achievements: 0, tasks: 0, contactSphere: 0 } },
            ])
            setShowAddModal(false)
            toast.success(`${newMember.name} added successfully`)
          }}
        />
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            style={{
              background: 'rgba(10,15,28,0.90)',
              backdropFilter: 'blur(28px) saturate(160%)',
              WebkitBackdropFilter: 'blur(28px) saturate(160%)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '32px',
              width: '100%',
              maxWidth: '480px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: 'var(--font-bebas), sans-serif',
                fontSize: '22px',
                letterSpacing: '2px',
                color: '#ffffff',
                marginBottom: '8px',
              }}
            >
              IMPORT MEMBERS
            </h2>
            <p style={{ fontSize: '17px', color: '#9CA3AF', marginBottom: '24px' }}>
              CSV columns: <code style={{ color: '#C9A84C' }}>name, email, phone, business, category, role</code>
              <br />
              Password will be set to last 6 digits of phone number.
            </p>
            <form onSubmit={handleImport}>
              <input
                type="file"
                accept=".csv"
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255,255,255,0.07)',
                  backgroundColor: 'rgba(6,10,20,0.6)',
                  color: '#9CA3AF',
                  fontSize: '17px',
                  marginBottom: '20px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backgroundColor: 'transparent',
                    color: '#9CA3AF',
                    fontSize: '17px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #C9A84C, #a0803a)',
                    color: '#000',
                    fontSize: '17px',
                    fontWeight: '700',
                    cursor: importing ? 'not-allowed' : 'pointer',
                    opacity: importing ? 0.7 : 1,
                  }}
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function AddMemberModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (member: Omit<Member, '_count'>) => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',   // stores 10-digit number; +91 prepended on submit
    business: '',
    category: '',
    role: 'member',
  })

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        phone: form.phone ? `+91${form.phone.replace(/\D/g, '')}` : '',
      }),
    })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      onSuccess(data)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to create member')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(6,10,20,0.6)',
    color: '#ffffff',
    fontSize: '17px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-montserrat), sans-serif',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(10,15,28,0.90)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '32px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: 'var(--font-bebas), sans-serif',
            fontSize: '22px',
            letterSpacing: '2px',
            color: '#ffffff',
            marginBottom: '24px',
          }}
        >
          ADD NEW MEMBER
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Full Name *
              </label>
              <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="John Smith" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Email *
              </label>
              <input style={inputStyle} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="john@example.com" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Phone
              </label>
              <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,10,20,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', borderRight: '1px solid rgba(255,255,255,0.07)', color: '#9CA3AF', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  style={{ ...inputStyle, border: 'none', background: 'transparent', paddingLeft: '10px', flex: 1 }}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Role
              </label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="president">President</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Business Name
            </label>
            <input style={inputStyle} value={form.business} onChange={(e) => set('business', e.target.value)} placeholder="Acme Corp" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Business Category
            </label>
            <input style={inputStyle} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Real Estate, Finance, etc." />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.07)',
                backgroundColor: 'transparent',
                color: '#9CA3AF',
                fontSize: '17px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #CC0000, #990000)',
                color: '#ffffff',
                fontSize: '17px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
