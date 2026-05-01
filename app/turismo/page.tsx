// frontend/app/turismo/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Paperclip, MapPin } from 'lucide-react'

interface Mensaje {
  rol: 'usuario' | 'bot'
  contenido: string
  opciones?: string[]
  esPlan?: boolean
  planTexto?: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend.onrender.com'

export default function TurismoPage() {
  const router = useRouter()
  const [mensajes, setMensajes]   = useState<Mensaje[]>([])
  const [input, setInput]         = useState('')
  const [cargando, setCargando]   = useState(false)
  const [sesionId]                = useState(() => `turismo_${Date.now()}`)
  const [paso, setPaso]           = useState('bienvenida')
  const [datos, setDatos]         = useState<Record<string, string>>({})
  const [planListo, setPlanListo] = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const iniciado                  = useRef(false)

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
        body:    JSON.stringify({ sesion_id: sesionId, mensaje: '', paso: 'bienvenida', datos_sesion: {} }),
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

    const nuevosDatos = { ...datos }

    try {
      const res  = await fetch(`${API}/turismo/mensaje`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sesion_id:    sesionId,
          mensaje:      texto,
          paso,
          datos_sesion: nuevosDatos,
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

      if (data.plan) {
        nuevoMensaje.esPlan    = true
        nuevoMensaje.planTexto = data.plan.texto
        setPlanListo(true)
      }

      setMensajes(prev => [...prev, nuevoMensaje])
    } catch {
      setMensajes(prev => [...prev, { rol: 'bot', contenido: '⚠️ Error al procesar tu respuesta.' }])
    } finally {
      setCargando(false)
    }
  }

  const verPlanHTML = () => {
    window.open(`${API}/turismo/plan/${sesionId}`, '_blank')
  }

  // ── Pasos del progreso ──────────────────────────────────
  const PASOS_TOTAL = 13
  const PASOS_MAP: Record<string, number> = {
    bienvenida: 0, recoger_nombre: 1, recoger_tipo: 2,
    recoger_compania: 3, recoger_personas: 4, recoger_epoca: 5,
    recoger_duracion: 6, recoger_presupuesto: 7, recoger_origen: 8,
    recoger_destino: 9, recoger_transporte: 10, recoger_hospedaje: 11,
    recoger_intereses: 12, recoger_necesidades: 13, generar_plan: 13,
  }
  const progreso = Math.round(((PASOS_MAP[paso] ?? 0) / PASOS_TOTAL) * 100)

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* ── Header ── */}
      <div style={{
        width: '100%', maxWidth: 720,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1e293b',
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>🌍</div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>
            IracheBot Turismo
          </div>
          <div style={{ color: '#10b981', fontSize: 12 }}>
            ● En línea · Turismo & Ocio Navarra
          </div>
        </div>

        {planListo && (
          <button
            onClick={verPlanHTML}
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            📄 Ver Plan PDF
          </button>
        )}
      </div>

      {/* ── Barra de progreso ── */}
      <div style={{ width: '100%', maxWidth: 720, padding: '8px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {['Inicio', 'Nombre', 'Email', 'Tipo', 'Compañía', 'Época', 'Duración',
            'Presupuesto', 'Origen', 'Destino', 'Transporte', 'Hospedaje', 'Intereses', 'Plan'].map((label, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: (PASOS_MAP[paso] ?? 0) >= i ? '#10b981' : '#1e293b',
              transition: 'background 0.3s',
            }} title={label} />
          ))}
        </div>
        <div style={{ height: 3, background: '#1e293b', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #059669, #10b981)',
            width: `${progreso}%`, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ color: '#475569', fontSize: 11, marginTop: 4, textAlign: 'right' }}>
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
            display: 'flex',
            justifyContent: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
            flexDirection: 'column',
            alignItems: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
            gap: 8,
          }}>
            {/* Burbuja */}
            <div style={{
              maxWidth: '80%',
              background: m.rol === 'usuario'
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : '#1e293b',
              color: '#f1f5f9',
              borderRadius: m.rol === 'usuario' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 16px',
              fontSize: 14, lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {m.contenido}
            </div>

            {/* Plan card */}
            {m.esPlan && m.planTexto && (
              <div style={{
                maxWidth: '90%',
                background: 'linear-gradient(135deg, #064e3b, #065f46)',
                border: '1px solid #059669',
                borderRadius: 12, padding: 16,
                fontSize: 13, whiteSpace: 'pre-wrap',
                color: '#d1fae5', fontFamily: 'monospace',
              }}>
                {m.planTexto}
              </div>
            )}

            {/* Opciones */}
            {m.rol === 'bot' && m.opciones && m.opciones.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: '80%' }}>
                {m.opciones.map((op, j) => (
                  <button
                    key={j}
                    onClick={() => enviarMensaje(op)}
                    disabled={cargando || i < mensajes.length - 1}
                    style={{
                      background: (cargando || i < mensajes.length - 1) ? '#1e293b' : '#0f172a',
                      border: '1px solid #059669',
                      color: '#10b981',
                      borderRadius: 20, padding: '6px 14px',
                      cursor: (cargando || i < mensajes.length - 1) ? 'default' : 'pointer',
                      fontSize: 13,
                      opacity: i < mensajes.length - 1 ? 0.4 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {cargando && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#10b981',
                animation: `bounce 1s ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        width: '100%', maxWidth: 720,
        padding: '12px 20px 24px',
        borderTop: '1px solid #1e293b',
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: '#1e293b', borderRadius: 14, padding: '8px 12px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje(input)}
            placeholder={cargando ? 'Procesando...' : '✍️ Escribe tu respuesta...'}
            disabled={cargando || planListo}
            style={{
              flex: 1, background: 'none', border: 'none',
              color: '#f1f5f9', fontSize: 14, outline: 'none',
            }}
          />
          <button
            onClick={() => enviarMensaje(input)}
            disabled={!input.trim() || cargando || planListo}
            style={{
              background: input.trim() && !cargando
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : '#334155',
              border: 'none', borderRadius: 10,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !cargando ? 'pointer' : 'default',
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
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
