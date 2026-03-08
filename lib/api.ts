// frontend/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://irachembot-backend-production.up.railway.app'

// ── Helper: obtiene token de cookie (cliente) o env (servidor) ──
function getToken(): string {
  // En servidor (SSR) → usa variable de entorno
  if (typeof document === 'undefined') {
    return process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? ''
  }
  // En cliente → lee la cookie admin_session
  const fromCookie = document.cookie
    .split('; ')
    .find(r => r.startsWith('admin_session='))
    ?.split('=')[1]

  // Fallback a variable de entorno si la cookie está vacía
  return fromCookie || (process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? '')
}

export function getAuthHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  }
}

// ── Chat público ──────────────────────────────────────────
export async function enviarMensaje(payload: {
  sesion_id: string
  mensaje: string
  paso: string
  datos_sesion: Record<string, string>
}) {
  const res = await fetch(`${BASE_URL}/chat/mensaje`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Admin ─────────────────────────────────────────────────
export async function getEstadisticas() {
  const res = await fetch(`${BASE_URL}/admin/estadisticas`, {
    headers: getAuthHeaders(),
  })
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function getReclamaciones(filtros?: {
  estado?: string
  categoria?: string
  urgencia?: string
}) {
  const params = new URLSearchParams()
  if (filtros?.estado)    params.set('estado',    filtros.estado)
  if (filtros?.categoria) params.set('categoria', filtros.categoria)
  if (filtros?.urgencia)  params.set('urgencia',  filtros.urgencia)

  const res = await fetch(
    `${BASE_URL}/admin/reclamaciones?${params}`,
    { headers: getAuthHeaders() }
  )
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function actualizarReclamacion(
  id: string,
  datos: { estado?: string; notas_admin?: string }
) {
  const res = await fetch(`${BASE_URL}/admin/reclamaciones/${id}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos),
  })
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function getStatsPublicas() {
  const res = await fetch(`${BASE_URL}/admin/stats/publicas`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function getNotas(reclamacionId: string) {
  const res = await fetch(
    `${BASE_URL}/admin/reclamaciones/${reclamacionId}/notas`,
    { headers: getAuthHeaders() }
  )
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function crearNota(
  reclamacionId: string,
  contenido: string,
  autor = 'Admin'
) {
  const res = await fetch(
    `${BASE_URL}/admin/reclamaciones/${reclamacionId}/notas`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contenido, autor }),
    }
  )
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}


