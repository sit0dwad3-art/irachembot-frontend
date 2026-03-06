const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''

// ── Chat público ──────────────────────────────────────────
export async function enviarMensaje(payload: {
  sesion_id: string
  mensaje: string
  paso: string
  datos_sesion: Record<string, string>
}) {
  const res = await fetch(`${API}/chat/mensaje`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error al enviar mensaje')
  return res.json()
}

// ── Admin ─────────────────────────────────────────────────
const adminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ADMIN_TOKEN}`
}

export async function getEstadisticas() {
  const res = await fetch(`${API}/admin/estadisticas`, { headers: adminHeaders })
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

  const res = await fetch(
    `${API}/admin/reclamaciones?${params}`,
    { headers: adminHeaders }
  )
  return res.json()
}

export async function actualizarReclamacion(
  id: string,
  datos: { estado?: string; notas_admin?: string; respuesta_enviada?: string }
) {
  const res = await fetch(`${API}/admin/reclamaciones/${id}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify(datos)
  })
  return res.json()
}
