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
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone)
    ) {
      setIsStandalone(true)
      return
    }

    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    if (ios) {
      const t = setTimeout(() => setShowBanner(true), 4000)
      return () => clearTimeout(t)
    }

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
    if (outcome === 'accepted') localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  function handleDismiss() {
    setShowBanner(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!showBanner || isStandalone) return null

  return (
    <>
      <style>{`
        @keyframes pwaSlideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .pwa-banner { animation: pwaSlideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
      <div
        className="pwa-banner"
        style={{
          position: 'fixed',
          /* mobile: full-width above bottom nav; desktop: bottom-right corner */
          bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          right: '12px',
          left: '12px',
          zIndex: 200,
          background: 'rgba(10,15,30,0.96)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: '14px',
          padding: '10px 12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Single compact row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icon */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #CC0000, #990000)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-bebas), sans-serif', fontSize: '12px',
            color: '#fff', letterSpacing: '1px',
          }}>
            BNI
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2 }}>
              Install BNI App
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.3, marginTop: '1px' }}>
              {isIOS ? (
                <>Tap <Share size={10} style={{ display: 'inline', verticalAlign: 'middle', color: '#C9A84C' }} /> → <strong style={{ color: '#C9A84C' }}>Add to Home Screen</strong></>
              ) : (
                'Faster access & offline support'
              )}
            </div>
          </div>

          {/* Install button (Android only) */}
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #CC0000, #990000)',
                border: 'none', color: '#fff', fontSize: '12px', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <Download size={12} /> Install
            </button>
          )}

          {/* Close */}
          <button
            onClick={handleDismiss}
            style={{
              flexShrink: 0, color: '#4B5563', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#9CA3AF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
          >
            <X size={14} />
          </button>
        </div>

        {/* iOS: no extra row needed — already in text */}
      </div>

      {/* Desktop override — bottom-right corner, not full width */}
      <style>{`
        @media (min-width: 1024px) {
          .pwa-banner {
            left: auto !important;
            bottom: 20px !important;
            right: 20px !important;
            max-width: 300px !important;
          }
        }
      `}</style>
    </>
  )
}
