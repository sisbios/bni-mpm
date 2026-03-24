'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ClipboardList, ChevronLeft, ChevronRight, CheckCircle, Clock, Phone, MessageSquare, UserCheck, PhoneCall } from 'lucide-react'

type Task = {
  id: string
  week: string
  taskType: string
  contactName: string
  phone: string | null
  status: string
  notes: string | null
  contributorName: string | null
  contributorId: string | null
  contactSphereId: string | null
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: Clock, color: '#CC0000' },
  { value: 'done', label: 'Done', icon: CheckCircle, color: '#10B981' },
  { value: 'no-answer', label: 'No Answer', icon: Phone, color: '#6B7280' },
  { value: 'callback', label: 'Callback', icon: MessageSquare, color: '#F59E0B' },
]

function getCurrentISOWeek() {
  const now = new Date()
  const dayOfYear = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1)
  const weekNum = Math.ceil(dayOfYear / 7)
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function shiftWeek(isoWeek: string, delta: number): string {
  const [year, w] = isoWeek.split('-W')
  const weekNum = parseInt(w) + delta
  const jan1 = new Date(parseInt(year), 0, 1)
  const dayOfJan1 = jan1.getDay()
  const weekStart = new Date(jan1.getTime() + (weekNum - 1) * 7 * 86400000 - dayOfJan1 * 86400000)
  const newYear = weekStart.getFullYear()
  const newDayOfYear = Math.ceil((weekStart.getTime() - new Date(newYear, 0, 1).getTime()) / 86400000 + new Date(newYear, 0, 1).getDay() + 1)
  const newWeekNum = Math.ceil(newDayOfYear / 7)
  return `${newYear}-W${String(newWeekNum).padStart(2, '0')}`
}

function getWeekLabel(isoWeek: string) {
  const [year, w] = isoWeek.split('-W')
  const weekNum = parseInt(w)
  const jan1 = new Date(parseInt(year), 0, 1)
  const dayOfJan1 = jan1.getDay()
  const weekStart = new Date(jan1.getTime() + (weekNum - 1) * 7 * 86400000 - dayOfJan1 * 86400000)
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000)
  return `${weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
}

export default function PortalTasksClient({ userId, userName, chapterName }: { userId: string; userName: string; chapterName: string }) {
  const [week, setWeek] = useState(getCurrentISOWeek())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/tasks?week=${week}&userId=${userId}`)
    if (res.ok) setTasks(await res.json())
    setLoading(false)
  }, [week, userId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function updateStatus(taskId: string, status: string) {
    setUpdatingId(taskId)
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdatingId(null)
    if (res.ok) {
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)))
      toast.success(`Marked as ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`)
    } else {
      toast.error('Failed to update')
    }
  }

  async function saveNotes(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesText }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)))
      setEditingNotes(null)
      toast.success('Notes saved')
    }
  }

  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1' }}>MY TASKS</h1>
          <p style={{ fontSize: '17px', color: '#9CA3AF', marginTop: '2px' }}>{done}/{total} completed this week</p>
        </div>
      </div>

      {/* Week nav */}
      <div
        style={{
          background: 'rgba(13,19,36,0.55)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)',
          padding: '12px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <button onClick={() => setWeek((w) => shiftWeek(w, -1))} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff' }}>{week}</div>
          <div style={{ fontSize: '17px', color: '#6B7280' }}>{getWeekLabel(week)}</div>
        </div>
        <button onClick={() => setWeek((w) => shiftWeek(w, 1))} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '17px', color: '#9CA3AF' }}>Your progress</span>
            <span style={{ fontSize: '17px', color: '#10B981' }}>{Math.round((done / total) * 100)}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: 'rgba(31,41,55,0.8)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', width: `${(done / total) * 100}%`,
                background: 'linear-gradient(90deg, #C9A84C, #10B981)', borderRadius: '4px', transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8B95A3' }}>Loading...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#8B95A3', background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.28)' }}>
          <ClipboardList size={40} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
          <p>No tasks assigned for this week</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task) => {
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === task.status)
            return (
              <div
                key={task.id}
                style={{
                  background: 'rgba(13,19,36,0.55)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  borderRadius: '10px',
                  border: `1px solid ${task.status === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  padding: '16px 20px',
                  opacity: task.status === 'done' ? 0.75 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {statusOpt && (
                    <statusOpt.icon
                      size={18}
                      style={{ color: statusOpt.color, flexShrink: 0, marginTop: '2px' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '16px', fontWeight: '600',
                              color: task.status === 'done' ? '#6B7280' : '#ffffff',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            }}
                          >
                            {task.contactName}
                          </span>
                          {task.phone && (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <a
                                href={`tel:${task.phone}`}
                                title={`Call ${task.phone}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '4px 10px', borderRadius: '6px',
                                  backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                                  color: '#10B981', fontSize: '12px', fontWeight: '500', textDecoration: 'none',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <PhoneCall size={12} /> Call
                              </a>
                              <a
                                href={`https://wa.me/${task.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`WhatsApp ${task.phone}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '4px 10px', borderRadius: '6px',
                                  backgroundColor: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)',
                                  color: '#25D366', fontSize: '12px', fontWeight: '500', textDecoration: 'none',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <MessageSquare size={12} /> WA
                              </a>
                            </div>
                          )}
                        </div>
                        {task.phone && (
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', fontWeight: '300' }}>
                            {task.phone}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '17px', padding: '2px 8px', borderRadius: '3px',
                          backgroundColor: `${statusOpt?.color ?? '#9CA3AF'}15`,
                          color: statusOpt?.color ?? '#9CA3AF', textTransform: 'capitalize',
                        }}
                      >
                        {task.taskType}
                      </span>
                    </div>

                    {/* Notes */}
                    {editingNotes === task.id ? (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          autoFocus
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveNotes(task.id); if (e.key === 'Escape') setEditingNotes(null) }}
                          placeholder="Add notes..."
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: '6px',
                            border: '1px solid #C9A84C', backgroundColor: 'rgba(6,10,20,0.6)',
                            color: '#ffffff', fontSize: '17px', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ fontSize: '17px', color: '#6B7280', marginTop: '4px' }}>Enter to save, Esc to cancel</div>
                      </div>
                    ) : (
                      task.notes && (
                        <div
                          style={{ fontSize: '17px', color: '#9CA3AF', marginTop: '6px', cursor: 'pointer' }}
                          onClick={() => { setEditingNotes(task.id); setNotesText(task.notes ?? '') }}
                        >
                          {task.notes}
                        </div>
                      )
                    )}

                    {/* Contributor info */}
                    {task.contributorName && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px',
                        padding: '10px 12px', borderRadius: '8px',
                        background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
                      }}>
                        <UserCheck size={14} style={{ color: '#C9A84C', flexShrink: 0, marginTop: '1px' }} />
                        <div>
                          <div style={{ fontSize: '13px', color: '#C9A84C', fontWeight: '700' }}>
                            Contact from {task.contributorName}&apos;s sphere
                          </div>
                          <div style={{ fontSize: '13px', color: '#8B95A3', marginTop: '2px' }}>
                            Intro: &quot;Hi, I&apos;m calling from {chapterName}. {task.contributorName} thought you might be interested in joining our weekly business networking meeting.&quot;
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateStatus(task.id, opt.value)}
                          disabled={updatingId === task.id || task.status === opt.value}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '5px 12px', borderRadius: '5px', fontSize: '17px',
                            cursor: task.status === opt.value ? 'default' : 'pointer',
                            border: `1px solid ${task.status === opt.value ? opt.color + '50' : 'rgba(255,255,255,0.07)'}`,
                            backgroundColor: task.status === opt.value ? `${opt.color}15` : 'transparent',
                            color: task.status === opt.value ? opt.color : '#6B7280',
                            fontWeight: task.status === opt.value ? '600' : '400',
                            transition: 'all 0.15s',
                          }}
                        >
                          <opt.icon size={11} />
                          {opt.label}
                        </button>
                      ))}
                      <button
                        onClick={() => { setEditingNotes(task.id); setNotesText(task.notes ?? '') }}
                        style={{
                          padding: '5px 12px', borderRadius: '5px', fontSize: '17px',
                          cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)',
                          backgroundColor: 'transparent', color: '#6B7280', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6B7280' }}
                      >
                        + Notes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
