import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Firebase public config — safe to inline (client-side SDK values, not secrets).
  // NEXT_PUBLIC_* vars must be present at build time; embedding here guarantees
  // they are always available in the client bundle regardless of build environment.
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAUY0Za6uDnDCVJZZdxRNmNOaLJ2K-Ie24',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'bni-malappuram.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'bni-malappuram',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:211581124300:web:40d5e8dbbd19c71b4b8c69',
  },
}

export default nextConfig
