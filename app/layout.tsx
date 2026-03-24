import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Open_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import AuthSessionProvider from '@/components/SessionProvider'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat', // keep var name for site-wide compatibility
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#CC0000',
}

export const metadata: Metadata = {
  title: 'BNI Chapter Platform',
  description: 'Chapter Management System — BNI Malappuram Region',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BNI Chapter',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0A0F1E',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bebasNeue.variable} ${openSans.variable} font-sans subpixel-antialiased`}
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 15% 0%, rgba(204,0,0,0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 100%, rgba(201,168,76,0.05) 0%, transparent 55%), #0A0F1E',
          backgroundAttachment: 'fixed',
          color: '#ffffff',
        }}
      >
        <AuthSessionProvider>
          {children}
          <Toaster theme="dark" richColors />
          <PWAInstallPrompt />
          <ServiceWorkerRegistration />
        </AuthSessionProvider>
      </body>
    </html>
  )
}
