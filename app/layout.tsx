import { Analytics } from '@vercel/analytics/next'
import localFont from 'next/font/local'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const rubik = localFont({
  src: '../node_modules/@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2',
  weight: '300 900',
  variable: '--font-rubik',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AMSI | Access more. Move well.',
  description: 'A private marketplace for exceptional properties, vehicles, auctions and trusted consultancy across East Africa.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${rubik.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
