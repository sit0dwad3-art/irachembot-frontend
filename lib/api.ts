// lib/api.ts
import { API_URL, ADMIN_TOKEN } from './config'

const adminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ADMIN_TOKEN}`
}

// ── Chat público ──────────────────────────────────────────
export async function enviarMensaje(payload: {
  sesion_id: string
  mensaje: string
  paso: string
  datos_sesion: Record<string, string>
}) {
  const res = await fetch(`${API_URL}/chat/mensaje`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error al enviar mensaje')
  return res.json()
}

// ── Admin ─────────────────────────────────────────────────
export async function getEstadisticas() {
  const res = await fetch(`${API_URL}/admin/estadisticas`, {
    headers: adminHeaders
  })
  if (!res.ok) throw new Error('Error estadísticas')
  return res.json()
}

export async function getReclamaciones(filtros?: {
  estado?: string
  categoria?: string
  urgencia?: string
}) {
  const params = new URLSearchParams()
  if (filtros?.estado)    params.set('estado', filtros.estado)
  if (filtros?.categoria) params.set('categoria', filtros.categoria)
  if (filtros?.urgencia)  params.set('urgencia', filtros.urgencia)

  const res = await fetch(`${API_URL}/admin/reclamaciones?${params}`, {
    headers: adminHeaders
  })
  if (!res.ok) throw new Error('Error reclamaciones')
  return res.json()
}

export async function actualizarReclamacion(
  id: string,
  datos: { estado?: string; notas_admin?: string; respuesta_enviada?: string }
) {
  const res = await fetch(`${API_URL}/admin/reclamaciones/${id}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify(datos)
  })
  if (!res.ok) throw new Error('Error actualizando')
  return res.json()
}
