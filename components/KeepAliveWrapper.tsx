'use client'

import { useEffect } from 'react'

export default function KeepAliveWrapper() {
  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_API_URL
    if (!BACKEND) return

    // Ping inmediato
    fetch(`${BACKEND}/health`).catch(() => {})

    // Ping cada 10 minutos
    const interval = setInterval(() => {
      fetch(`${BACKEND}/health`).catch(() => {})
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
