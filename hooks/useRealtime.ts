// frontend/hooks/useRealtime.ts
import { useEffect, useState, useCallback } from 'react'
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

export function useRealtime() {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([])
  const [eventos, setEventos] = useState<RealtimeEvent[]>([])
  const [conectado, setConectado] = useState(false)
  const [nuevaAlerta, setNuevaAlerta] = useState<RealtimeEvent | null>(null)

  // Carga inicial
  const cargarReclamaciones = useCallback(async () => {
    const { data, error } = await supabase
      .from('reclamaciones')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReclamaciones(data as Reclamacion[])
    }
  }, [])

  useEffect(() => {
    // 1. Carga inicial de datos
    cargarReclamaciones()

    // 2. Suscripción Realtime
    const channel = supabase
      .channel('reclamaciones-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',         // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'reclamaciones',
        },
        (payload) => {
          const evento: RealtimeEvent = {
            type: payload.eventType as RealtimeEvent['type'],
            reclamacion: (payload.new || payload.old) as Reclamacion,
            timestamp: new Date(),
          }

          // Actualizar lista según el tipo de evento
          setReclamaciones((prev) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new as Reclamacion, ...prev]

              case 'UPDATE':
                return prev.map((r) =>
                  r.id === payload.new.id
                    ? (payload.new as Reclamacion)
                    : r
                )

              case 'DELETE':
                return prev.filter((r) => r.id !== payload.old.id)

              default:
                return prev
            }
          })

          // Guardar evento en historial
          setEventos((prev) => [evento, ...prev].slice(0, 50))

          // Disparar alerta visual
          setNuevaAlerta(evento)
          setTimeout(() => setNuevaAlerta(null), 4000)
        }
      )
      .subscribe((status) => {
        setConectado(status === 'SUBSCRIBED')
      })

    // 3. Cleanup al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [cargarReclamaciones])

  return {
    reclamaciones,
    eventos,
    conectado,
    nuevaAlerta,
    recargar: cargarReclamaciones,
  }
}
