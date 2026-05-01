'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'

interface Mensaje {
  rol: 'usuario' | 'bot'
  contenido: string
  opciones?: string[]
  esPlan?: boolean
  planTexto?: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend.onrender.com'

const PASOS_MAP: Record<string, number> = {
  bienvenida: 0, recoger_nombre: 1, recoger_email: 2,
  recoger_tipo: 3, recoger_compania: 4, recoger_personas: 5,
  recoger_epoca: 6, recoger_duracion: 7, recoger_presupuesto: 8,
  recoger_origen: 9, recoger_destino: 10, recoger_transporte: 11,
  recoger_hospedaje: 12, recoger_intereses: 13, recoger_necesidades: 14,
  generar_plan: 14, finalizado: 14,
}
const PASOS_TOTAL = 14

export default function TurismoPage() {
  const router = useRouter()
  const [mensajes, setMensajes]   = useState<Mensaje[]>([])
  const [input, setInput]         = useState('')
  const [cargando, setCargando]   = useState(false)
  const [sesionId]                = useState(() => `turismo_${Date.now()}`)
  const [paso, setPaso]           = useState('bienvenida')
  const [datos, setDatos]         = useState<Record<string, string>>({})
  const [planListo, setPlanListo] = useState(false)
  const [planTextoFinal, setPlanTextoFinal] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const iniciado  = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  useEffect(() => {
    if (iniciado.current) return
    iniciado.current = true
    iniciarConversacion()
  }, [])

  const iniciarConversacion = async () => {
    setCargando(true)
    try {
      const res  = await fetch(`${API}/turismo/mensaje`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sesion_id: sesionId, mensaje: '',
          paso: 'bienvenida', datos_sesion: {},
        }),
      })
      const data = await res.json()
      setMensajes([{ rol: 'bot', contenido: data.respuesta, opciones: data.opciones }])
      setPaso(data.siguiente_paso)
    } catch {
      setMensajes([{ rol: 'bot', contenido: '⚠️ No puedo conectar con el servidor.' }])
    } finally {
      setCargando(false)
    }
  }

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || cargando) return
    setInput('')
    setMensajes(prev => [...prev, { rol: 'usuario', contenido: texto }])
    setCargando(true)

    try {
      const res  = await fetch(`${API}/turismo/mensaje`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sesion_id: sesionId, mensaje: texto,
          paso, datos_sesion: datos,
        }),
      })
      const data = await res.json()

      if (data.datos_actualizados) setDatos(data.datos_actualizados)
      setPaso(data.siguiente_paso)

      const nuevoMensaje: Mensaje = {
        rol:      'bot',
        contenido: data.respuesta,
        opciones:  data.opciones,
      }

      if (data.plan?.texto) {
        nuevoMensaje.esPlan    = true
        nuevoMensaje.planTexto = data.plan.texto
        setPlanListo(true)
        setPlanTextoFinal(data.plan.texto)
      }

      setMensajes(prev => [...prev, nuevoMensaje])
    } catch {
      setMensajes(prev => [...prev, {
        rol: 'bot', contenido: '⚠️ Error al procesar tu respuesta.',
      }])
    } finally {
      setCargando(false)
    }
  }

  // ── PDF 100% frontend — sin depender del backend ─────────────────────────
  const descargarPDF = () => {
    const nombre = datos.nombre || 'Viajero'
    const fecha  = new Date().toLocaleDateString('es-ES')
    const plan   = planTextoFinal || '(sin contenido)'

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan de Viaje — ${nombre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0f172a; color: #e2e8f0;
      padding: 48px; max-width: 760px; margin: 0 auto;
    }
    .header { text-align:center; margin-bottom:36px; padding-bottom:24px; border-bottom:2px solid #4f46e5; }
    .header h1 { font-size:26px; color:#a78bfa; margin-bottom:8px; }
    .header p  { color:#64748b; font-size:13px; }
    .badge {
      display:inline-block; background:#4f46e5; color:white;
      border-radius:20px; padding:4px 14px; font-size:11px; margin:3px;
    }
    .plan {
      background:#1e293b; border-radius:12px; padding:28px;
      font-family:monospace; font-size:13px; line-height:1.9;
      white-space:pre-wrap; color:#d1fae5; border:1px solid #059669;
    }
    .footer { text-align:center; margin-top:28px; color:#475569; font-size:11px; }
    .tip { margin-top:8px; color:#334155; font-size:10px; }
    @media print {
      body { background:#fff; color:#111; padding:32px; }
      .plan { background:#f0fdf4; color:#064e3b; border-color:#059669; }
      .header h1 { color:#4f46e5; }
      .badge { background:#4f46e5; }
      .footer { color:#64748b; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌍 Plan de Viaje Personalizado</h1>
    <p>Preparado para <strong style="color:#a78bfa">${nombre}</strong> · ${fecha}</p>
    <div style="margin-top:12px">
      <span class="badge">🤖 IracheBot Turismo</span>
      <span class="badge">📍 Navarra</span>
    </div>
  </div>
  <div class="plan">${plan}</div>
  <div class="footer">
    <p>© 2026 IracheBot · Servicio de Consumo de Navarra</p>
    <p class="tip">💡 Ctrl + P → "Guardar como PDF" para descargar</p>
  </div>
  <script>
    window.onload = () => { window.focus(); window.print(); }
  </script>
</body>
</html>`

    const ventana = window.open('', '_blank')
    if (!ventana) return
    ventana.document.write(html)
    ventana.document.close()
  }

  const progreso = Math.round(((PASOS_MAP[paso] ?? 0) / PASOS_TOTAL) * 100)

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* ── Header ── */}
      <div style={{
        width: '100%', maxWidth: 720, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1e293b',
        position: 'sticky', top: 0, background: '#0f172a', zIndex: 10,
      }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669, #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>🌍</div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>IracheBot Turismo</div>
          <div style={{ color: '#10b981', fontSize: 12 }}>● En línea · Turismo & Ocio Navarra</div>
        </div>

        {planListo && (
          <button
            onClick={descargarPDF}
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            📄 Descargar PDF
          </button>
        )}
      </div>

      {/* ── Barra de progreso ── */}
      <div style={{ width: '100%', maxWidth: 720, padding: '8px 20px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {Array.from({ length: PASOS_TOTAL + 1 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: (PASOS_MAP[paso] ?? 0) >= i ? '#10b981' : '#1e293b',
              transition: 'background 0.4s',
            }} />
          ))}
        </div>
        <div style={{ color: '#475569', fontSize: 11, textAlign: 'right' }}>
          {progreso}% completado
        </div>
      </div>

      {/* ── Mensajes ── */}
      <div style={{
        flex: 1, width: '100%', maxWidth: 720,
        padding: '16px 20px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {mensajes.map((m, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            alignItems: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
          }}>
            {/* Burbuja */}
            <div style={{
              maxWidth: '80%',
              background: m.rol === 'usuario'
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : '#1e293b',
              color: '#f1f5f9',
              borderRadius: m.rol === 'usuario'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              padding: '12px 16px',
              fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>
              {m.contenido}
            </div>

            {/* Card del plan */}
            {m.esPlan && m.planTexto && (
              <div style={{
                maxWidth: '95%', width: '100%',
                background: 'linear-gradient(135deg, #064e3b, #065f46)',
                border: '1px solid #059669', borderRadius: 14,
                padding: '20px 24px',
                fontSize: 13, whiteSpace: 'pre-wrap',
                color: '#d1fae5', fontFamily: 'monospace', lineHeight: 1.8,
              }}>
                {m.planTexto}
              </div>
            )}

            {/* Opciones */}
            {m.rol === 'bot' && m.opciones && m.opciones.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: '85%' }}>
                {m.opciones.map((op, j) => (
                  <button
                    key={j}
                    onClick={() => enviarMensaje(op)}
                    disabled={cargando || i < mensajes.length - 1}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #059669', color: '#10b981',
                      borderRadius: 20, padding: '6px 14px',
                      cursor: (cargando || i < mensajes.length - 1) ? 'default' : 'pointer',
                      fontSize: 13,
                      opacity: i < mensajes.length - 1 ? 0.35 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      if (i === mensajes.length - 1 && !cargando)
                        (e.currentTarget as HTMLButtonElement).style.background = '#059669'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#0f172a'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {cargando && (
          <div style={{ display: 'flex', gap: 5, padding: '4px 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                animation: `bounce 1s ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        width: '100%', maxWidth: 720,
        padding: '12px 20px 28px',
        borderTop: '1px solid #1e293b',
        background: '#0f172a',
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: '#1e293b', borderRadius: 14, padding: '8px 12px',
          border: '1px solid #334155',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje(input)}
            placeholder={
              planListo    ? '✅ Plan generado — pulsa Descargar PDF' :
              cargando     ? 'Procesando...' :
              '✍️ Escribe tu respuesta...'
            }
            disabled={cargando || planListo}
            style={{
              flex: 1, background: 'none', border: 'none',
              color: planListo ? '#475569' : '#f1f5f9',
              fontSize: 14, outline: 'none',
            }}
          />
          <button
            onClick={() => enviarMensaje(input)}
            disabled={!input.trim() || cargando || planListo}
            style={{
              background: input.trim() && !cargando && !planListo
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : '#334155',
              border: 'none', borderRadius: 10,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !cargando && !planListo ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
