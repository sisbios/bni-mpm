'use client'
import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Don't show if already installed as PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone)
    ) {
      setIsStandalone(true)
      return
    }

    // Respect previous dismissal (7-day cooldown)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    if (ios) {
      // iOS: show hint after 4s (no install event)
      const t = setTimeout(() => setShowBanner(true), 4000)
      return () => clearTimeout(t)
    }

    // Chrome / Edge / Android: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowBanner(true), 2500)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowBanner(false)
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    }
  }

  function handleDismiss() {
    setShowBanner(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!showBanner || isStandalone) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '12px',
        right: '12px',
        zIndex: 200,
        background: 'rgba(10, 15, 30, 0.92)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: '1px solid rgba(201, 168, 76, 0.28)',
        borderRadius: '18px',
        padding: '16px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08) inset',
        animation: 'pwaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* BNI Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #CC0000, #990000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-bebas), sans-serif',
            fontSize: '14px',
            color: '#fff',
            letterSpacing: '1px',
            boxShadow: '0 4px 16px rgba(204,0,0,0.4)',
          }}
        >
          BNI
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-bebas), sans-serif',
              fontSize: '18px',
              color: '#ffffff',
              letterSpacing: '2px',
              lineHeight: 1,
              marginBottom: '4px',
            }}
          >
            INSTALL APP
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>
            {isIOS ? (
              <>
                Tap{' '}
                <Share
                  size={12}
                  style={{ display: 'inline', verticalAlign: 'middle', color: '#C9A84C' }}
                />{' '}
                then <strong style={{ color: '#C9A84C' }}>Add to Home Screen</strong>
              </>
            ) : (
              'Quick access, offline support & faster load times'
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          style={{
            color: '#4B5563',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#9CA3AF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
        >
          <X size={16} />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
          <button
            onClick={handleInstall}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #CC0000, #990000)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(204,0,0,0.35)',
              letterSpacing: '0.3px',
            }}
          >
            <Download size={14} />
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: '11px 18px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#6B7280',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = '#9CA3AF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#6B7280'
            }}
          >
            Later
          </button>
        </div>
      )}
    </div>
  )
}
