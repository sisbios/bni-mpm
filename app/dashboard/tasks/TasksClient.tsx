'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, ClipboardList, X, ChevronLeft, ChevronRight } from 'lucide-react'

type Task = {
  id: string
  userId: string
  week: string
  taskType: string
  contactName: string
  phone: string | null
  status: string
  notes: string | null
  user: { id: string; name: string; business: string | null }
}

type Member = {
  id: string
  name: string
  business: string | null
}

const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#CC0000' },
  { value: 'done', label: 'Done', color: '#10B981' },
  { value: 'no-answer', label: 'No Answer', color: '#6B7280' },
  { value: 'callback', label: 'Callback', color: '#F59E0B' },
]

const TASK_TYPES = ['call', 'followup', 'visit', 'referral']

function getWeekLabel(isoWeek: string) {
  const [year, w] = isoWeek.split('-W')
  const weekNum = parseInt(w)
  const jan1 = new Date(parseInt(year), 0, 1)
  const dayOfJan1 = jan1.getDay()
  const weekStart = new Date(jan1.getTime() + (weekNum - 1) * 7 * 86400000 - dayOfJan1 * 86400000)
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000)
  return `${weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

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

export default function TasksClient({ members }: { members: Member[] }) {
  const [week, setWeek] = useState(getCurrentISOWeek())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/tasks?week=${week}`)
    if (res.ok) setTasks(await res.json())
    setLoading(false)
  }, [week])

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
    } else {
      toast.error('Failed to update status')
    }
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast.success('Task deleted')
    }
  }

  // Group tasks by member
  const grouped: Record<string, { member: Member; tasks: Task[] }> = {}
  for (const task of tasks) {
    if (!grouped[task.userId]) {
      const member = members.find((m) => m.id === task.userId) ?? {
        id: task.userId,
        name: task.user.name,
        business: task.user.business,
      }
      grouped[task.userId] = { member, tasks: [] }
    }
    grouped[task.userId].tasks.push(task)
  }

  const totalDone = tasks.filter((t) => t.status === 'done').length
  const totalTasks = tasks.length

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #CC0000, #C9A84C)', borderRadius: '2px' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1' }}>WEEKLY TASKS</h1>
            <p style={{ fontSize: '17px', color: '#9CA3AF', marginTop: '2px' }}>
              {totalDone}/{totalTasks} completed
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
            borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #CC0000, #990000)',
            color: '#ffffff', fontSize: '17px', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(204,0,0,0.3)',
          }}
        >
          <Plus size={15} /> Assign Task
        </button>
      </div>

      {/* Week navigation */}
      <div
        style={{
          background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
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

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '17px', color: '#9CA3AF' }}>Chapter Progress</span>
            <span style={{ fontSize: '17px', color: '#10B981' }}>{Math.round((totalDone / totalTasks) * 100)}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#4B5563', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(totalDone / totalTasks) * 100}%`,
                background: 'linear-gradient(90deg, #10B981, #059669)',
                borderRadius: '4px',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#8B95A3' }}>Loading tasks...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#8B95A3' }}>
          <ClipboardList size={40} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
          <p>No tasks for this week. Assign tasks to members.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.values(grouped).map(({ member, tasks: memberTasks }) => {
            const doneTasks = memberTasks.filter((t) => t.status === 'done').length
            return (
              <div key={member.id} style={{ background: 'rgba(11,16,30,0.60)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.28)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(201,168,76,0.10)',
                      border: '1px solid rgba(201,168,76,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '17px', color: '#C9A84C', flexShrink: 0,
                    }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff' }}>{member.name}</div>
                    <div style={{ fontSize: '17px', color: '#6B7280' }}>{member.business || ''}</div>
                  </div>
                  <div style={{ fontSize: '17px', color: doneTasks === memberTasks.length ? '#10B981' : '#9CA3AF', fontWeight: '600' }}>
                    {doneTasks}/{memberTasks.length}
                  </div>
                </div>
                <div>
                  {memberTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '17px', color: '#ffffff', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.contactName}
                        </div>
                        <div style={{ fontSize: '17px', color: '#8B95A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.taskType}{task.phone && ` • ${task.phone}`}
                        </div>
                        {task.notes && <div style={{ fontSize: '17px', color: '#6B7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.notes}</div>}
                      </div>
                      <select
                        value={task.status}
                        disabled={updatingId === task.id}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        style={{
                          padding: '5px 8px', borderRadius: '6px', flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(6,10,20,0.6)',
                          color: TASK_STATUSES.find((s) => s.value === task.status)?.color ?? '#9CA3AF',
                          fontSize: '17px', cursor: 'pointer', outline: 'none', maxWidth: '100px',
                        }}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent',
                          color: '#6B7280', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#4B5563'; e.currentTarget.style.color = '#6B7280' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <AssignTaskModal
          members={members}
          week={week}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newTask) => {
            setTasks((prev) => [...prev, newTask])
            toast.success('Task assigned')
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

function AssignTaskModal({
  members,
  week,
  onClose,
  onSuccess,
}: {
  members: Member[]
  week: string
  onClose: () => void
  onSuccess: (task: Task) => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    userId: members[0]?.id ?? '',
    week,
    contactName: '',
    phone: '',
    taskType: 'call',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) onSuccess(await res.json())
    else toast.error('Failed to assign task')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(6,10,20,0.6)',
    color: '#ffffff', fontSize: '17px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'var(--font-montserrat), sans-serif',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'rgba(10,15,28,0.90)', backdropFilter: 'blur(28px) saturate(160%)', WebkitBackdropFilter: 'blur(28px) saturate(160%)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', padding: '28px', width: '100%', maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', letterSpacing: '2px', color: '#ffffff', marginBottom: '24px' }}>ASSIGN TASK</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Member *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} required>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.business ? ` – ${m.business}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact Name *</label>
            <input style={inputStyle} value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} required placeholder="Contact to call/visit" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone</label>
              <input style={inputStyle} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 ..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.taskType} onChange={(e) => setForm((p) => ({ ...p, taskType: e.target.value }))}>
                {TASK_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '17px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Notes</label>
            <input style={inputStyle} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '17px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #990000)', color: '#ffffff', fontSize: '17px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
