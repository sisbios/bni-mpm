import { headers } from 'next/headers'
import { db } from '@/lib/db'
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const APP_MODE = process.env.BNI_APP_MODE ?? 'chapter'
  const hdrs = await headers()

  // ── REGION ADMIN container ────────────────────────────────────────────────
  if (APP_MODE === 'region') {
    return (
      <LoginClient
        title="BNI MALAPPURAM"
        subtitle="Regional Portal — Admin Sign In"
        accentColor="#CC0000"
      />
    )
  }

  // ── CHAPTER container — try to get chapter name from x-chapter-slug ───────
  const slug = hdrs.get('x-chapter-slug')
  if (slug) {
    const chapter = await db.chapter.findUnique({
      where: { slug },
      select: { name: true },
    }).catch(() => null)

    if (chapter) {
      return (
        <LoginClient
          title={`${chapter.name.toUpperCase()} CHAPTER`}
          subtitle="Member Portal — Sign in to continue"
          accentColor="#CC0000"
        />
      )
    }
  }

  // ── Fallback (no chapter context) ─────────────────────────────────────────
  return (
    <LoginClient
      title="MEMBER PORTAL"
      subtitle="Sign in to continue"
      accentColor="#CC0000"
    />
  )
}
