import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guest List Creator',
  description: 'Create and manage guest lists for your events',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
