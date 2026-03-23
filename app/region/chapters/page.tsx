'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Building2, Pencil, MapPin, Clock, Users, Leaf,
  UserCheck, TrendingUp, Phone, IndianRupee,
} from 'lucide-react'

type HTMember = { id: string; name: string; role: string; phone: string | null }
type ChapterStat = {
  id: string
  name: string
  slug: string
  city: string | null
  meetingDay: string | null
  meetingTime: string | null
  meetingLocation: string | null
  meetingFee: number | null
  visitorFee: number | null
  isActive: boolean
  totalMembers: number
  totalGreenMembers: number
  totalVisitorsLastMonth: number
  totalRevenue: number
  headTable: HTMember[]
}

const ROLE_LABEL: Record<string, string> = {
  president: 'President',
  vicePresident: 'Vice President',
  secretaryTreasurer: 'Sec/Treasurer',
}

function StatPill({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: `${color}10`, border: `1px solid ${color}22` }}>
      <Icon size={13} style={{ color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
      </div>
    </div>
  )
}

export default function ChaptersListPage() {
  const [chapters, setChapters] = useState<ChapterStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/region/chapter-stats')
      .then(r => r.json())
      .then(data => { setChapters(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>CHAPTERS</h1>
            <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>Loading...</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', height: '180px', animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
            CHAPTERS
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} in your region
          </p>
        </div>
        <Link href="/region/chapters/new" style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
          borderRadius: '10px', textDecoration: 'none',
          background: 'rgba(30,64,175,0.2)', border: '1px solid rgba(59,130,246,0.35)',
          color: '#3B82F6', fontSize: '14px', fontWeight: '600',
        }}>
          <Plus size={16} /> New Chapter
        </Link>
      </div>

      {chapters.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '60px', textAlign: 'center',
        }}>
          <Building2 size={48} style={{ color: '#374151', margin: '0 auto 16px' }} />
          <p style={{ color: '#4B5563', margin: 0, fontSize: '16px' }}>No chapters yet.</p>
          <Link href="/region/chapters/new" style={{ display: 'inline-block', marginTop: '16px', color: '#3B82F6', fontWeight: '600', textDecoration: 'none' }}>
            Create your first chapter →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {chapters.map((ch) => (
            <div
              key={ch.id}
              style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${ch.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(107,114,128,0.15)'}`,
                borderRadius: '16px', overflow: 'hidden',
                opacity: ch.isActive ? 1 : 0.65,
              }}
            >
              {/* Card header */}
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                    background: ch.isActive ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.1)',
                    border: `1px solid ${ch.isActive ? 'rgba(59,130,246,0.28)' : 'rgba(107,114,128,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px',
                    color: ch.isActive ? '#3B82F6' : '#6B7280',
                  }}>
                    {ch.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>{ch.name} Chapter</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: ch.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                        color: ch.isActive ? '#10B981' : '#6B7280',
                      }}>
                        {ch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {(ch.meetingLocation || ch.city) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                          <MapPin size={11} style={{ color: '#4B5563' }} />
                          {ch.meetingLocation ?? ch.city}
                        </span>
                      )}
                      {ch.meetingDay && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                          <Clock size={11} style={{ color: '#4B5563' }} />
                          {ch.meetingDay}{ch.meetingTime ? ` · ${ch.meetingTime}` : ''}
                        </span>
                      )}
                      {(ch.meetingFee != null || ch.visitorFee != null) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                          <IndianRupee size={11} style={{ color: '#4B5563' }} />
                          {ch.meetingFee != null ? `Member ₹${ch.meetingFee}` : ''}
                          {ch.meetingFee != null && ch.visitorFee != null ? ' · ' : ''}
                          {ch.visitorFee != null ? `Visitor ₹${ch.visitorFee}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link href={`/region/chapters/${ch.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  borderRadius: '8px', textDecoration: 'none',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9CA3AF', fontSize: '13px', fontWeight: '600', flexShrink: 0,
                }}>
                  <Pencil size={13} /> Edit
                </Link>
              </div>

              {/* Stats row */}
              <div style={{ padding: '12px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <StatPill icon={Users} value={ch.totalMembers} label="Members" color="#3B82F6" />
                <StatPill icon={Leaf} value={ch.totalGreenMembers} label="Green" color="#10B981" />
                <StatPill icon={UserCheck} value={ch.totalVisitorsLastMonth} label="Visitors (mo)" color="#F59E0B" />
                <StatPill icon={TrendingUp} value={ch.totalRevenue > 0 ? `₹${(ch.totalRevenue / 100000).toFixed(1)}L` : '—'} label="Revenue" color="#8B5CF6" />
              </div>

              {/* Head Table */}
              {ch.headTable.length > 0 && (
                <div style={{ padding: '12px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '1px', marginRight: '4px' }}>HT:</span>
                  {ch.headTable.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.2)' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(204,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#CC0000', flexShrink: 0 }}>
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', lineHeight: 1 }}>{m.name}</div>
                        <div style={{ fontSize: '10px', color: '#CC0000', marginTop: '1px' }}>{ROLE_LABEL[m.role] ?? m.role}</div>
                      </div>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} style={{ color: '#6B7280', marginLeft: '2px' }}>
                          <Phone size={11} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ch.headTable.length === 0 && (
                <div style={{ padding: '10px 20px' }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>No Head Table assigned · </span>
                  <Link href="/region/roles" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>Assign roles →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
