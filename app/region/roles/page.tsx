'use client'
import { useState, useEffect } from 'react'
import { ROLE_GROUPS, HT_SLUGS, MC_SLUGS } from '@/lib/roles'
import { Users, ChevronDown, Check, Loader2, X } from 'lucide-react'

type Member = { id: string; name: string; role: string; business: string | null; phone: string | null }
type Assignments = Record<string, Member[]>
type Chapter = { id: string; name: string; slug: string }

export default function ManageRolesPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [assignments, setAssignments] = useState<Assignments>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/region/chapters').then(r => r.json()).then(data => {
      setChapters(data)
      if (data.length > 0) setSelectedChapterId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedChapterId) return
    setLoading(true)
    fetch(`/api/region/roles?chapterId=${selectedChapterId}`)
      .then(r => r.json())
      .then(data => { setMembers(data.members ?? []); setAssignments(data.assignments ?? {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedChapterId])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function assign(userId: string, roleSlug: string) {
    setSaving(roleSlug + userId)
    const res = await fetch('/api/region/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roleSlug, chapterId: selectedChapterId }),
    })
    if (res.ok) {
      // Refresh
      const data = await fetch(`/api/region/roles?chapterId=${selectedChapterId}`).then(r => r.json())
      setMembers(data.members ?? []); setAssignments(data.assignments ?? {})
      showToast('Role assigned successfully')
    }
    setSaving('')
  }

  async function removeRole(userId: string) {
    setSaving('remove' + userId)
    const res = await fetch(`/api/region/roles?userId=${userId}&chapterId=${selectedChapterId}`, { method: 'DELETE' })
    if (res.ok) {
      const data = await fetch(`/api/region/roles?chapterId=${selectedChapterId}`).then(r => r.json())
      setMembers(data.members ?? []); setAssignments(data.assignments ?? {})
      showToast('Role removed')
    }
    setSaving('')
  }

  const unassignedMembers = members.filter(m => m.role === 'member')

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '12px 18px', color: '#6EE7B7', fontSize: '14px', fontWeight: '600' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
            MANAGE <span style={{ color: '#3B82F6' }}>CHAPTER ROLES</span>
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>Assign Head Table and Membership Committee roles</p>
        </div>
        <select
          value={selectedChapterId}
          onChange={e => setSelectedChapterId(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#ffffff', fontSize: '14px', cursor: 'pointer', outline: 'none', minWidth: '200px' }}
        >
          {chapters.map(c => <option key={c.id} value={c.id} style={{ background: '#1a1a2e' }}>{c.name} Chapter</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {ROLE_GROUPS.map(group => (
            <div key={group.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              {/* Group header */}
              <div style={{ padding: '14px 20px', background: `${group.color}12`, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', letterSpacing: '2px', color: group.color }}>{group.label}</span>
                <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '4px' }}>({group.shortLabel})</span>
              </div>

              {/* Roles */}
              <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
                {group.roles.map(role => {
                  const assigned = assignments[role.slug] ?? []
                  return (
                    <div key={role.slug} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* Role label */}
                      <div style={{ minWidth: '260px', flex: '0 0 260px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{role.label}</div>
                        <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{role.accessLevel}</div>
                      </div>

                      {/* Assigned member(s) */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {assigned.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: `${group.color}18`, border: `1px solid ${group.color}35` }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${group.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', color: group.color }}>
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{m.name}</div>
                              {m.business && <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.business}</div>}
                            </div>
                            {group.key !== 'member' && (
                              <button onClick={() => removeRole(m.id)} disabled={saving === 'remove' + m.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px', marginLeft: '4px' }}>
                                {saving === 'remove' + m.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={13} />}
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Assign dropdown — only for HT and MC roles, not plain 'member' */}
                        {group.key !== 'member' && (
                          <MemberDropdown
                            members={members}
                            assignedIds={assigned.map(m => m.id)}
                            onAssign={(uid) => assign(uid, role.slug)}
                            saving={saving === role.slug + (members.find(m => m.id === saving.slice(role.slug.length))?.id ?? '')}
                            color={group.color}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Unassigned members summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Unassigned Members ({unassignedMembers.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {unassignedMembers.map(m => (
                <div key={m.id} style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.2)', fontSize: '13px', color: '#9CA3AF' }}>
                  {m.name}
                </div>
              ))}
              {unassignedMembers.length === 0 && <span style={{ fontSize: '13px', color: '#374151' }}>All members have roles assigned</span>}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function MemberDropdown({ members, assignedIds, onAssign, saving, color }: {
  members: Member[]; assignedIds: string[]; onAssign: (id: string) => void; saving: boolean; color: string
}) {
  const [open, setOpen] = useState(false)
  const available = members.filter(m => !assignedIds.includes(m.id))

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}
      >
        <Users size={13} /> Assign <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, minWidth: '200px', maxHeight: '240px', overflowY: 'auto', background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
          {available.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: '13px', color: '#4B5563' }}>No members available</div>
          ) : available.map(m => (
            <button
              key={m.id}
              onClick={() => { onAssign(m.id); setOpen(false) }}
              style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${color}15`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{m.name}</div>
              {m.business && <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.business}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
