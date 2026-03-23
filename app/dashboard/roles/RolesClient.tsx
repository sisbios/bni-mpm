'use client'
import { useState, useEffect } from 'react'
import { ROLE_GROUPS, HT_SLUGS } from '@/lib/roles'
import { Users, ChevronDown, Loader2, X, Lock, Phone } from 'lucide-react'

type Member = { id: string; name: string; role: string; business: string | null; phone: string | null }
type Assignments = Record<string, Member[]>

const ROLE_LABEL: Record<string, string> = {
  president: 'President',
  vicePresident: 'Vice President',
  secretaryTreasurer: 'Sec/Treasurer',
}

export default function RolesClient({ canManage, callerRole }: { canManage: boolean; callerRole: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [assignments, setAssignments] = useState<Assignments>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function loadRoles() {
    const data = await fetch('/api/chapter-roles').then(r => r.json())
    setMembers(data.members ?? [])
    setAssignments(data.assignments ?? {})
  }

  useEffect(() => {
    loadRoles().finally(() => setLoading(false))
  }, [])

  async function assign(userId: string, roleSlug: string) {
    setSaving(roleSlug + userId)
    const res = await fetch('/api/chapter-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roleSlug }),
    })
    if (res.ok) {
      await loadRoles()
      showToast('Role assigned')
    } else {
      const err = await res.json()
      showToast(err.error ?? 'Failed to assign role')
    }
    setSaving('')
  }

  async function removeRole(userId: string, roleSlug: string) {
    setSaving('remove' + userId)
    const res = await fetch(`/api/chapter-roles?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      await loadRoles()
      showToast('Role removed')
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed to remove role')
    }
    setSaving('')
  }

  const unassigned = members.filter(m => m.role === 'member')

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '12px 18px', color: '#6EE7B7', fontSize: '14px', fontWeight: '600' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          CHAPTER <span style={{ color: '#3B82F6' }}>ROLES</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
          {canManage ? 'Assign Membership Committee roles to your chapter members' : 'Current role assignments for this chapter'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {ROLE_GROUPS.map(group => {
            const isHT = group.key === 'HT'
            const isMemberGroup = group.key === 'member'
            // Chapter HT can manage MC; HT is locked to region admin
            const groupEditable = canManage && !isHT && !isMemberGroup

            return (
              <div key={group.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                {/* Group header */}
                <div style={{ padding: '14px 20px', background: `${group.color}12`, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', letterSpacing: '2px', color: group.color }}>{group.label}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '4px' }}>({group.shortLabel})</span>
                  {isHT && (
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4B5563' }}>
                      <Lock size={11} /> Region Admin only
                    </span>
                  )}
                </div>

                {/* Roles */}
                <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
                  {group.roles.filter(r => r.slug !== 'member').map(role => {
                    const assigned = assignments[role.slug] ?? []
                    return (
                      <div key={role.slug} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Role label */}
                        <div style={{ minWidth: '240px', flex: '0 0 240px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{role.label}</div>
                          <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{role.accessLevel}</div>
                        </div>

                        {/* Assigned members */}
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
                              {m.phone && (
                                <a href={`tel:${m.phone}`} style={{ color: '#6B7280', marginLeft: '2px' }}>
                                  <Phone size={11} />
                                </a>
                              )}
                              {groupEditable && (
                                <button
                                  onClick={() => removeRole(m.id, role.slug)}
                                  disabled={saving === 'remove' + m.id}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px', marginLeft: '4px' }}
                                >
                                  {saving === 'remove' + m.id
                                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <X size={13} />}
                                </button>
                              )}
                            </div>
                          ))}

                          {assigned.length === 0 && (
                            <span style={{ fontSize: '13px', color: '#374151' }}>
                              {isHT ? 'Not assigned — contact Region Admin' : 'Unassigned'}
                            </span>
                          )}

                          {groupEditable && (
                            <MemberDropdown
                              members={members}
                              assignedIds={assigned.map(m => m.id)}
                              onAssign={(uid) => assign(uid, role.slug)}
                              color={group.color}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Unassigned members */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Unassigned Members ({unassigned.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {unassigned.map(m => (
                <div key={m.id} style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.2)', fontSize: '13px', color: '#9CA3AF' }}>
                  {m.name}
                </div>
              ))}
              {unassigned.length === 0 && <span style={{ fontSize: '13px', color: '#374151' }}>All members have roles</span>}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function MemberDropdown({ members, assignedIds, onAssign, color }: {
  members: Member[]
  assignedIds: string[]
  onAssign: (id: string) => void
  color: string
}) {
  const [open, setOpen] = useState(false)
  const available = members.filter(m => !assignedIds.includes(m.id) && m.role === 'member')

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
            <div style={{ padding: '14px 16px', fontSize: '13px', color: '#4B5563' }}>No unassigned members</div>
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
