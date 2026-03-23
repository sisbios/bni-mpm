import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'

/** Derives access level from role slug without a DB call (fallback) */
function deriveAccessLevel(role: string): string {
  if (role === 'admin') return 'superadmin'
  if (role === 'member') return 'member'
  return 'officer'
}

async function getAccessLevel(role: string): Promise<string> {
  try {
    const chapterRole = await db.chapterRole.findFirst({ where: { slug: role } })
    return chapterRole?.accessLevel ?? deriveAccessLevel(role)
  } catch {
    return deriveAccessLevel(role)
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({ where: { email: credentials.email as string } })
        if (!user || !user.isActive) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        // Use DB-stored accessLevel directly; fall back to role-derived value
        const accessLevel = user.accessLevel || await getAccessLevel(user.role)
        return {
          id: user.id, email: user.email, name: user.name,
          role: user.role, accessLevel,
          chapterId: user.chapterId ?? null,
          regionId: user.regionId ?? null,
        }
      },
    }),
    Credentials({
      id: 'firebase-otp',
      name: 'Phone OTP',
      credentials: {
        idToken: { label: 'Firebase ID Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null
        try {
          const { getFirebaseAdminAuth } = await import('./firebase-admin')
          const adminAuth = getFirebaseAdminAuth()
          const decoded = await adminAuth.verifyIdToken(credentials.idToken as string)
          const phone = decoded.phone_number
          if (!phone) return null
          // Normalize phone: try exact match first, then with + prefix
          const user = await db.user.findFirst({
            where: {
              OR: [
                { phone: phone },
                { phone: phone.replace('+', '') },
                { phone: '+' + phone.replace('+', '') },
              ],
              isActive: true,
            },
          })
          if (!user) return null
          const accessLevel = user.accessLevel || await getAccessLevel(user.role)
          return {
            id: user.id, email: user.email, name: user.name,
            role: user.role, accessLevel,
            chapterId: user.chapterId ?? null,
            regionId: user.regionId ?? null,
          }
        } catch (e) {
          console.error('Firebase OTP auth error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.accessLevel = (user as any).accessLevel ?? deriveAccessLevel((user as any).role ?? 'member')
        token.chapterId = (user as any).chapterId ?? null
        token.regionId = (user as any).regionId ?? null
      }
      if (!token.accessLevel && token.role) {
        token.accessLevel = deriveAccessLevel(token.role as string)
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.accessLevel = (token.accessLevel as string) ?? deriveAccessLevel(token.role as string)
        session.user.chapterId = (token.chapterId as string | null) ?? null
        session.user.regionId = (token.regionId as string | null) ?? null
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 90 * 24 * 60 * 60, // 90 days
    updateAge: 24 * 60 * 60,    // refresh token once per day max
  },
})
