// frontend/hooks/useRealtime.ts
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export type Reclamacion = {
  id: string
  created_at: string
  updated_at: string
  nombre: string
  email: string
  telefono: string
  mensaje_original: string
  categoria: string
  subcategoria: string
  urgencia: 'baja' | 'normal' | 'alta' | 'urgente'
  estado: 'pendiente' | 'en_proceso' | 'resuelto'
  notas_admin: string
  respuesta_enviada: string
  sesion_id: string
  idioma: string
}

type RealtimeEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  reclamacion: Reclamacion
  timestamp: Date
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://irachembot-backend-production.up.railway.app'

function getAuthHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const token = document.cookie
    .split('; ')
    .find(r => r.startsWith('admin_session='))
    ?.split('=')[1] ?? ''
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export function useRealtime() {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([])
  const [eventos,       setEventos]       = useState<RealtimeEvent[]>([])
  const [conectado,     setConectado]     = useState(false)
  const [nuevaAlerta,   setNuevaAlerta]   = useState<RealtimeEvent | null>(null)

  // ── Carga inicial desde Railway (datos reales) ──────────────────────────
  const cargarReclamaciones = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/reclamaciones`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setReclamaciones(Array.isArray(data) ? data : data.reclamaciones ?? [])
    } catch (e) {
      console.error('❌ Error cargando reclamaciones desde Railway:', e)
      setReclamaciones([])
    }
  }, [])

  useEffect(() => {
    // 1. Carga inicial desde Railway
    cargarReclamaciones()

    // 2. Supabase Realtime — solo para recibir notificaciones de cambios
    //    Cuando llega un evento → recargamos desde Railway (fuente de verdad)
    const channel = supabase
      .channel('reclamaciones-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reclamaciones' },
        (payload) => {
          const evento: RealtimeEvent = {
            type:         payload.eventType as RealtimeEvent['type'],
            reclamacion:  (payload.new || payload.old) as Reclamacion,
            timestamp:    new Date(),
          }

          // Recargar lista completa desde Railway
          cargarReclamaciones()

          // Historial de eventos
          setEventos(prev => [evento, ...prev].slice(0, 50))

          // Alerta visual 4s
          setNuevaAlerta(evento)
          setTimeout(() => setNuevaAlerta(null), 4000)
        }
      )
      .subscribe((status) => {
        setConectado(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [cargarReclamaciones])

  return { reclamaciones, eventos, conectado, nuevaAlerta, recargar: cargarReclamaciones }
}

