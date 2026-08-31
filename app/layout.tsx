import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Elschema',
  description: 'Elscheman och funktionsdiagram kring en styrenhet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
