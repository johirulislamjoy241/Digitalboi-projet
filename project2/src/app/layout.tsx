import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const viewport: Viewport = {
  themeColor: '#FF5722',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Digiboi — আপনার ব্যবসার ডিজিটাল সহকারী',
  description: 'প্রিমিয়াম ক্লাউড POS সিস্টেম',
  applicationName: 'Digiboi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
