'use client'
import { useState, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [tab, setTab] = useState<'password' | 'otp'>('password')
  const router = useRouter()

  // Password login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')

  // OTP state
  const [phone, setPhone] = useState('+91')
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone')
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const recaptchaRef = useRef<HTMLDivElement>(null)

  const firebaseAvailable = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setPwLoading(true); setPwError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    setPwLoading(false)
    if (result?.error) {
      setPwError('Invalid email or password')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!firebaseAvailable) { setOtpError('Firebase not configured. Contact admin.'); return }
    setOtpLoading(true); setOtpError('')
    try {
      const { getFirebaseApp } = await import('@/lib/firebase-client')
      const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
      const app = getFirebaseApp()
      const auth = getAuth(app)
      if (!(window as any).__recaptchaVerifier) {
        ;(window as any).__recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current!, { size: 'invisible' })
      }
      const result = await signInWithPhoneNumber(auth, phone, (window as any).__recaptchaVerifier)
      setConfirmationResult(result)
      setOtpStep('code')
    } catch (err: any) {
      setOtpError(err.message ?? 'Failed to send OTP')
      ;(window as any).__recaptchaVerifier = null
    }
    setOtpLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpLoading(true); setOtpError('')
    try {
      const userCred = await confirmationResult.confirm(otpCode)
      const idToken = await userCred.user.getIdToken()
      const result = await signIn('firebase-otp', { idToken, redirect: false })
      if (result?.error) {
        setOtpError('Phone number not registered in this chapter. Contact your admin.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setOtpError(err.message ?? 'Invalid OTP')
    }
    setOtpLoading(false)
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(10,15,28,0.92)',
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', color: '#9CA3AF',
    marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px',
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0A0F1E', padding: '20px',
    }}>
      {/* Background gradient orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(204,0,0,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #CC0000, #880000)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', color: '#fff', letterSpacing: '1px',
            boxShadow: '0 8px 24px rgba(204,0,0,0.4)',
          }}>BNI</div>
          <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '4px', color: '#C9A84C' }}>OSCAR</div>
          <div style={{ fontSize: '13px', color: '#6B7280', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>Chapter Portal</div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '4px' }}>
          {[
            { key: 'password', label: '🔑 Password' },
            { key: 'otp', label: '📱 Phone OTP' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              style={{
                flex: 1, padding: '9px', borderRadius: '6px', border: 'none',
                background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t.key ? '#ffffff' : '#6B7280',
                fontSize: '13px', fontWeight: tab === t.key ? '700' : '600',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Password Tab */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" autoComplete="email" />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
            </div>
            {pwError && <div style={{ fontSize: '13px', color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '10px 12px' }}>{pwError}</div>}
            <button type="submit" disabled={pwLoading} style={{ padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #880000)', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: pwLoading ? 'not-allowed' : 'pointer', opacity: pwLoading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(204,0,0,0.3)' }}>
              {pwLoading ? 'Signing in...' : 'Sign In'}
            </button>
            <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>Admin &amp; officer password login</p>
          </form>
        )}

        {/* OTP Tab */}
        {tab === 'otp' && (
          <div>
            {otpStep === 'phone' ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Mobile Number</label>
                  <input
                    style={inputStyle} type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)} required
                    placeholder="+91 98765 43210"
                  />
                  <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Include country code (e.g. +91 for India)</p>
                </div>
                {otpError && <div style={{ fontSize: '13px', color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '10px 12px' }}>{otpError}</div>}
                <div ref={recaptchaRef} id="recaptcha-container" />
                <button type="submit" disabled={otpLoading} style={{ padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '15px', fontWeight: '700', cursor: otpLoading ? 'not-allowed' : 'pointer', opacity: otpLoading ? 0.7 : 1 }}>
                  {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(201,168,76,0.06)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <p style={{ fontSize: '13px', color: '#C9A84C' }}>OTP sent to <strong>{phone}</strong></p>
                </div>
                <div>
                  <label style={labelStyle}>Enter OTP</label>
                  <input style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }} type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} required placeholder="000000" />
                </div>
                {otpError && <div style={{ fontSize: '13px', color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '10px 12px' }}>{otpError}</div>}
                <button type="submit" disabled={otpLoading} style={{ padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '15px', fontWeight: '700', cursor: otpLoading ? 'not-allowed' : 'pointer', opacity: otpLoading ? 0.7 : 1 }}>
                  {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <button type="button" onClick={() => { setOtpStep('phone'); setOtpCode(''); setOtpError('') }} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                  Change number
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
