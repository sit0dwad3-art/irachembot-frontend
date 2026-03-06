export type Categoria = 'banca' | 'energia' | 'telefonia' | 'seguros' | 'comercio' | 'otro'
export type Urgencia  = 'baja' | 'normal' | 'alta'
export type Estado    = 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado'
export type Rol       = 'usuario' | 'bot'

export interface Mensaje {
  id?: string
  rol: Rol
  contenido: string
  created_at?: string
}

export interface Reclamacion {
  id: string
  created_at: string
  nombre?: string
  email?: string
  mensaje_original: string
  categoria: Categoria
  urgencia: Urgencia
  estado: Estado
  notas_admin?: string
  respuesta_enviada?: string
  sesion_id: string
  mensajes_chat?: Mensaje[]
}

export interface BotResponse {
  respuesta: string
  siguiente_paso: string
  sesion_id: string
  opciones?: string[]
}

export interface Estadisticas {
  total: number
  por_categoria: Record<string, number>
  por_estado: Record<string, number>
  urgentes: number
  pendientes: number
}
