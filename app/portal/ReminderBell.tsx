'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

export default function ReminderBell({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const key = `reminder:${eventId}`
  const [set, setSet] = useState(false)

  useEffect(() => {
    setSet(localStorage.getItem(key) === '1')
  }, [key])

  function toggle() {
    if (set) {
      localStorage.removeItem(key)
      setSet(false)
    } else {
      localStorage.setItem(key, '1')
      setSet(true)
      // Try native notification permission (best-effort)
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }

  return (
    <button
      onClick={toggle}
      title={set ? `Remove reminder: ${eventTitle}` : `Set reminder: ${eventTitle}`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '8px', border: 'none',
        background: set ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.06)',
        color: set ? '#C9A84C' : '#6B7280',
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
      }}
    >
      {set ? <Bell size={14} /> : <BellOff size={14} />}
    </button>
  )
}
