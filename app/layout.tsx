import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IracheBot — Reclamaciones Navarra',
  description: 'Gestiona tus reclamaciones de banca, energía, telefonía y más. Gratis.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
