import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      accessLevel: string
      chapterId: string | null
      regionId: string | null
    } & DefaultSession['user']
  }
}
