import type { Metadata } from 'next'
import './globals.css'
import KeepAliveWrapper from '@/components/KeepAliveWrapper'

export const metadata: Metadata = {
  title: 'IracheBot — Reclamaciones Navarra',
  description: 'Gestiona tus reclamaciones de banca, energía, telefonía y más. Gratis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <KeepAliveWrapper />
        {children}
      </body>
    </html>
  )
}

