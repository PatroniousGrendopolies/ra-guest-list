// Root layout with global styles and metadata for the app.

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
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/tasa-orbiter-display"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
