// frontend/hooks/useRealtime.ts
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getAuthHeaders } from '@/lib/api'

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
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado'
  notas_admin: string
  respuesta_enviada: string
  sesion_id: string
  idioma: string
}

export type RealtimeEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  reclamacion: Reclamacion
  timestamp: Date
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://irachembot-backend-production.up.railway.app'

export function useRealtime() {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([])
  const [eventos,       setEventos]       = useState<RealtimeEvent[]>([])
  const [conectado,     setConectado]     = useState(false)
  const [nuevaAlerta,   setNuevaAlerta]   = useState<RealtimeEvent | null>(null)
  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Carga desde Railway (fuente de verdad) ────────────
  const cargarReclamaciones = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/reclamaciones`, {
        headers: getAuthHeaders(), // ← usa el helper centralizado
      })
      if (!res.ok) {
        console.error(`❌ HTTP ${res.status} al cargar reclamaciones`)
        return
      }
      const data = await res.json()
      setReclamaciones(Array.isArray(data) ? data : data.reclamaciones ?? [])
    } catch (e) {
      console.error('❌ Error cargando reclamaciones:', e)
    }
  }, [])

  // ── Exponer recargar para el botón "Actualizar" ───────
  const recargar = useCallback(async () => {
    await cargarReclamaciones()
  }, [cargarReclamaciones])

  useEffect(() => {
    // 1. Carga inicial
    cargarReclamaciones()

    // 2. Supabase Realtime — notificaciones de cambios
    const channel = supabase
      .channel('reclamaciones-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reclamaciones' },
        (payload) => {
          const evento: RealtimeEvent = {
            type:        payload.eventType as RealtimeEvent['type'],
            reclamacion: (payload.new || payload.old) as Reclamacion,
            timestamp:   new Date(),
          }
          // Recargar lista completa desde Railway
          cargarReclamaciones()
          // Historial de eventos (máx 50)
          setEventos(prev => [evento, ...prev].slice(0, 50))
          // Alerta visual 4s
          setNuevaAlerta(evento)
          setTimeout(() => setNuevaAlerta(null), 4000)
        }
      )
      .subscribe((status) => {
        setConectado(status === 'SUBSCRIBED')
        console.log('📡 Realtime status:', status)
      })

    canalRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cargarReclamaciones])

  return {
    reclamaciones,
    eventos,
    conectado,
    nuevaAlerta,
    recargar,
  }
}


