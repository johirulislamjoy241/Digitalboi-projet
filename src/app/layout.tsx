import type { Metadata,Viewport } from 'next'
import '@/styles/globals.css'
import { AuthProvider } from '@/lib/auth-context'
export const viewport:Viewport={themeColor:'#6c63ff',width:'device-width',initialScale:1,maximumScale:1}
export const metadata:Metadata={title:'DigitalBoi — আপনার ব্যবসার ডিজিটাল সহকারী',description:'Professional cloud POS system.',applicationName:'DigitalBoi'}
export default function RootLayout({children}:{children:React.ReactNode}){
  return(
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>"/>
      </head>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  )
}
