// frontend/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend-production.up.railway.app'
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? 'irachembot_admin_2026_supersecreto'

const adminHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ADMIN_TOKEN}`
}

// ── Chat público ─────────────────────────────────────────
export async function enviarMensaje(payload: {
  sesion_id: string
  mensaje: string
  paso: string
  datos_sesion: Record<string, string>
}) {
  const url = `${BASE_URL}/chat/mensaje`
  console.log('📡 Enviando a:', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

// ── Admin ────────────────────────────────────────────────
export async function getEstadisticas() {
  const url = `${BASE_URL}/admin/estadisticas`
  console.log('📡 Stats URL:', url)

  const res = await fetch(url, { headers: adminHeaders })
  if (!res.ok) throw new Error(`Error ${res.status}`)
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

  const url = `${BASE_URL}/admin/reclamaciones?${params}`
  console.log('📡 Reclamaciones URL:', url)

  const res = await fetch(url, { headers: adminHeaders })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function actualizarReclamacion(
  id: string,
  datos: { estado?: string; notas_admin?: string; respuesta_enviada?: string }
) {
  const res = await fetch(`${BASE_URL}/admin/reclamaciones/${id}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify(datos)
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

