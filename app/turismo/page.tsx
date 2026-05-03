'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface Mensaje {
  rol: 'usuario' | 'bot'
  contenido: string
  opciones?: string[]
  esPlan?: boolean
  planTexto?: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend.onrender.com'

// ── Componentes Markdown ──────────────────────────────────────────────────────
const mdBurbuja: Components = {
  p:      ({ children }) => <p style={{ margin: '3px 0', lineHeight: 1.6 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: '#6ee7b7' }}>{children}</strong>,
  em:     ({ children }) => <em style={{ color: '#a7f3d0' }}>{children}</em>,
  ul:     ({ children }) => <ul style={{ paddingLeft: 18, margin: '4px 0' }}>{children}</ul>,
  ol:     ({ children }) => <ol style={{ paddingLeft: 18, margin: '4px 0' }}>{children}</ol>,
  li:     ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
  table:  ({ children }) => (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr:    ({ children }) => <tr style={{ borderBottom: '1px solid #1e3a2f' }}>{children}</tr>,
  th:    ({ children }) => (
    <th style={{
      background: '#059669', color: 'white',
      padding: '7px 12px', textAlign: 'left',
      border: '1px solid #047857', fontWeight: 600, fontSize: 12,
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ padding: '6px 12px', border: '1px solid #1e3a2f', color: '#d1fae5', fontSize: 12 }}>
      {children}
    </td>
  ),
  code: ({ children }) => (
    <code style={{ background: '#0f172a', color: '#34d399', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: '3px solid #059669', paddingLeft: 12, margin: '6px 0', color: '#94a3b8', fontStyle: 'italic' }}>
      {children}
    </blockquote>
  ),
}

const mdPlan: Components = {
  ...mdBurbuja,
  strong: ({ children }) => <strong style={{ color: '#6ee7b7', fontWeight: 700 }}>{children}</strong>,
  h1: ({ children }) => (
    <h1 style={{ color: '#34d399', fontSize: 16, margin: '14px 0 6px', borderBottom: '1px solid #059669', paddingBottom: 4 }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => <h2 style={{ color: '#34d399', fontSize: 15, margin: '12px 0 5px' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ color: '#6ee7b7', fontSize: 14, margin: '10px 0 4px' }}>{children}</h3>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #065f46', margin: '10px 0' }} />,
}

const CHIP_MERCADO: Record<string, string> = {
  '🏰 Pamplona':         'navarra',
  '🗺️ Toda Navarra':    'navarra',
  '🌍 Fuera de Navarra': 'internacional',
  '✨ Sorpréndeme':      'navarra',
}
const PASOS_MAP: Record<string, number> = {
  bienvenida: 0, recoger_nombre: 1, recoger_email: 2,
  recoger_tipo: 3, recoger_compania: 4, recoger_personas: 5,
  recoger_epoca: 6, recoger_duracion: 7, recoger_presupuesto: 8,
  recoger_origen: 9, recoger_destino: 10, recoger_transporte: 11,
  recoger_hospedaje: 12, recoger_intereses: 13, recoger_necesidades: 14,
  conversacion_libre: 7, generar_plan: 14, finalizado: 14,
}
const PASOS_TOTAL = 14

// ── Pantalla de warm-up ───────────────────────────────────────────────────────
function WarmUpScreen({ elapsed }: { elapsed: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', gap: '1.75rem',
      background: 'linear-gradient(160deg,#060b18,#0a0f1e)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes spin-warm      { to { transform: rotate(360deg); } }
        @keyframes pulse-ring     { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.7);opacity:0} }
        @keyframes fade-in-warm   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes progress-slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
      `}</style>

      {/* Spinner con anillo pulsante */}
      <div style={{ position: 'relative', width: '68px', height: '68px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(16,185,129,0.3)',
          animation: 'pulse-ring 1.6s ease-out infinite',
        }}/>
        <div style={{
          position: 'absolute', inset: '6px', borderRadius: '50%',
          border: '3px solid transparent',
          borderTop: '3px solid #10b981',
          borderRight: '3px solid #059669',
          animation: 'spin-warm 0.9s linear infinite',
        }}/>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>🌍</div>
      </div>

      {/* Texto */}
      <div style={{ textAlign: 'center', animation: 'fade-in-warm .6s ease both' }}>
        <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0' }}>
          Iniciando IracheBot Turismo...
        </p>
        <p style={{ margin: '0 0 .5rem', fontSize: '.85rem', color: '#475569' }}>
          El servidor está despertando ☕
        </p>
        {elapsed >= 5 && (
          <p style={{ margin: 0, fontSize: '.75rem', color: '#334155', animation: 'fade-in-warm .4s ease both' }}>
            {elapsed}s — casi listo, gracias por esperar...
          </p>
        )}
      </div>

      {/* Barra de progreso indeterminada */}
      <div style={{
        width: '220px', height: '3px',
        background: 'rgba(16,185,129,0.1)',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: '35%',
          background: 'linear-gradient(90deg,#059669,#10b981,#34d399)',
          borderRadius: '2px',
          animation: 'progress-slide 1.5s ease-in-out infinite',
        }}/>
      </div>

      {/* Tip */}
      <p style={{
        fontSize: '.72rem', color: '#1e293b',
        maxWidth: '260px', textAlign: 'center', lineHeight: 1.6,
      }}>
        💡 El primer inicio puede tardar ~30s. Los siguientes serán instantáneos.
      </p>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TurismoPage() {
  const router = useRouter()

  // ── Warm-up state ─────────────────────────────────────────────────────────
  const [backendReady, setBackendReady] = useState(false)
  const [elapsed,      setElapsed]      = useState(0)

  // ── Chat state ────────────────────────────────────────────────────────────
  const [mensajes,       setMensajes]       = useState<Mensaje[]>([])
  const [input,          setInput]          = useState('')
  const [cargando,       setCargando]       = useState(false)
  const [sesionId]                          = useState(() => `turismo_${Date.now()}`)
  const [paso,           setPaso]           = useState('bienvenida')
  const [datos,          setDatos]          = useState<Record<string, string>>({})
  const [planListo,      setPlanListo]      = useState(false)
  const [mercado,        setMercado]        = useState<string>('auto')
  const [planTextoFinal, setPlanTextoFinal] = useState('')
  const [botListo,       setBotListo]       = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const iniciado  = useRef(false)
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Scroll al fondo ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // ── Warm-up: ping al backend hasta que responda ───────────────────────────
  useEffect(() => {
    // Contador de segundos visible
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)

    const ping = () => {
      fetch(`${API}/health`)
        .then(() => {
          setBackendReady(true)
          clearInterval(timer)
        })
        .catch(() => {
          // Reintenta cada 3s
          retryRef.current = setTimeout(ping, 3000)
        })
    }

    ping()

    return () => {
      clearInterval(timer)
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [])

  // ── Iniciar conversación solo cuando el backend esté listo ────────────────
  useEffect(() => {
    if (!backendReady || iniciado.current) return
    iniciado.current = true
    iniciarConversacion()
  }, [backendReady])

  // ── Init ──────────────────────────────────────────────────────────────────
  const iniciarConversacion = async () => {
    setCargando(true)
    try {
      const res  = await fetch(`${API}/turismo/mensaje`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sesion_id:    sesionId,
          mensaje:      '',
          paso:         'bienvenida',
          datos_sesion: {},
        }),
      })
      const data = await res.json()
      setMensajes([{ rol: 'bot', contenido: data.respuesta, opciones: data.opciones }])
      setPaso(data.siguiente_paso)
      setBotListo(true)
    } catch {
      setMensajes([{ rol: 'bot', contenido: '⚠️ No puedo conectar con el servidor.' }])
      setBotListo(true)
    } finally {
      setCargando(false)
    }
  }

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || cargando || !botListo) return
    setInput('')
    setMensajes(prev => [...prev, { rol: 'usuario', contenido: texto }])
    setCargando(true)
    try {
      const res  = await fetch(`${API}/turismo/mensaje`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sesion_id:    sesionId,
          mensaje:      texto,
          paso,
          datos_sesion: datos,
          mercado:      CHIP_MERCADO[texto] ?? mercado,
        }),
      })
      const data = await res.json()
      if (data.mercado_detectado) setMercado(data.mercado_detectado)
      if (data.datos_actualizados) setDatos(data.datos_actualizados)
      setPaso(data.siguiente_paso)
      const nuevoMensaje: Mensaje = { rol: 'bot', contenido: data.respuesta, opciones: data.opciones }
      if (data.plan?.texto) {
        nuevoMensaje.esPlan    = true
        nuevoMensaje.planTexto = data.plan.texto
        setPlanListo(true)
        setPlanTextoFinal(data.plan.texto)
      }
      setMensajes(prev => [...prev, nuevoMensaje])
    } catch {
      setMensajes(prev => [...prev, { rol: 'bot', contenido: '⚠️ Error al procesar tu respuesta.' }])
    } finally {
      setCargando(false)
    }
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  const descargarPDF = () => {
    const nombre = datos.nombre || 'Viajero'
    const fecha  = new Date().toLocaleDateString('es-ES')
    const plan   = planTextoFinal || '(sin contenido)'

    const planHtml = plan
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/^### (.+)$/gm,   '<h3>$1</h3>')
      .replace(/^## (.+)$/gm,    '<h2>$1</h2>')
      .replace(/^# (.+)$/gm,     '<h1>$1</h1>')
      .replace(/^---$/gm,        '<hr>')
      .replace(/^\* (.+)$/gm,    '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
      .replace(
        /(\|.+\|\n)((?:\|[-:]+)+\|\n)((?:\|.+\|\n?)*)/g,
        (_, header, _sep, body) => {
          const ths = header.split('|').filter((c: string) => c.trim())
            .map((c: string) => `<th>${c.trim()}</th>`).join('')
          const trs = body.trim().split('\n').map((row: string) => {
            const tds = row.split('|').filter((c: string) => c.trim())
              .map((c: string) => `<td>${c.trim()}</td>`).join('')
            return `<tr>${tds}</tr>`
          }).join('')
          return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
        }
      )
      .replace(/\n/g, '<br>')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan de Viaje — ${nombre}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:48px;max-width:760px;margin:0 auto}
    .header{text-align:center;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #4f46e5}
    .header h1{font-size:26px;color:#a78bfa;margin-bottom:8px}
    .header p{color:#64748b;font-size:13px}
    .badge{display:inline-block;background:#4f46e5;color:white;border-radius:20px;padding:4px 14px;font-size:11px;margin:3px}
    .plan{background:#1e293b;border-radius:12px;padding:28px;font-size:13px;line-height:1.9;color:#d1fae5;border:1px solid #059669}
    .plan h1{color:#34d399;font-size:16px;margin:14px 0 6px;border-bottom:1px solid #059669;padding-bottom:4px}
    .plan h2{color:#34d399;font-size:15px;margin:12px 0 5px}
    .plan h3{color:#6ee7b7;font-size:14px;margin:10px 0 4px}
    .plan strong{color:#6ee7b7}
    .plan hr{border:none;border-top:1px solid #065f46;margin:10px 0}
    .plan ul{padding-left:20px;margin:6px 0}
    .plan li{margin-bottom:4px}
    .plan table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12px}
    .plan th{background:#059669;color:white;padding:7px 12px;text-align:left;border:1px solid #047857}
    .plan td{padding:6px 12px;border:1px solid #1e3a2f}
    .footer{text-align:center;margin-top:28px;color:#475569;font-size:11px}
    @media print{
      body{background:#fff;color:#111;padding:32px}
      .plan{background:#f0fdf4;color:#064e3b;border-color:#059669}
      .plan th{background:#059669;color:white}
      .plan td{border-color:#a7f3d0}
      .plan strong{color:#065f46}
      .plan h1,.plan h2{color:#065f46}
      .header h1{color:#4f46e5}
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌍 Plan de Viaje Personalizado</h1>
    <p>Preparado para <strong style="color:#a78bfa">${nombre}</strong> · ${fecha}</p>
    <div style="margin-top:12px">
      <span class="badge">🤖 IracheBot Turismo</span>
      <span class="badge">📍 ${
        mercado === 'internacional' ? 'Internacional' :
        mercado === 'espana'        ? 'España' : 'Navarra'
      }</span>
    </div>
  </div>
  <div class="plan">${planHtml}</div>
  <div class="footer">
    <p>© 2026 IracheBot · Servicio de Consumo de Navarra</p>
    <p style="margin-top:4px">💡 Ctrl + P → "Guardar como PDF"</p>
  </div>
  <script>window.onload=()=>{window.focus();window.print()}</script>
</body>
</html>`

    const ventana = window.open('', '_blank')
    if (!ventana) return
    ventana.document.write(html)
    ventana.document.close()
  }

  const progreso = Math.round(((PASOS_MAP[paso] ?? 0) / PASOS_TOTAL) * 100)
  const inputBloqueado = !botListo || cargando || planListo
  const botonBloqueado = !input.trim() || !botListo || cargando || planListo

  // ── Mostrar warm-up hasta que el backend responda ─────────────────────────
  if (!backendReady) return <WarmUpScreen elapsed={elapsed} />

  // ── UI principal ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* Header */}
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
          background: 'linear-gradient(135deg,#059669,#10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>🌍</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>IracheBot Turismo</div>
          <div style={{ color: '#10b981', fontSize: 12 }}>
            {botListo
              ? `● En línea · ${
                  mercado === 'navarra'       ? '🏔️ Navarra' :
                  mercado === 'internacional' ? '🌍 Internacional' :
                  mercado === 'espana'        ? '🇪🇸 España' :
                  '🌍 Turismo & Ocio'
                }`
              : '○ Conectando...'
            }
          </div>
        </div>
        {planListo && (
          <button
            onClick={descargarPDF}
            style={{
              background: 'linear-gradient(135deg,#059669,#10b981)',
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

      {/* Barra de progreso */}
      <div style={{ width: '100%', maxWidth: 720, padding: '8px 20px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {Array.from({ length: PASOS_TOTAL + 1 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: (PASOS_MAP[paso] ?? 0) >= i ? '#10b981' : '#1e293b',
              transition: 'background 0.4s',
            }}/>
          ))}
        </div>
        <div style={{ color: '#475569', fontSize: 11, textAlign: 'right' }}>
          {progreso}% completado
        </div>
      </div>

      {/* Mensajes */}
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
            <div style={{
              maxWidth: '80%',
              background: m.rol === 'usuario'
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : '#1e293b',
              color: '#f1f5f9',
              borderRadius: m.rol === 'usuario' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 16px', fontSize: 14,
            }}>
              {m.rol === 'usuario' ? (
                <span>{m.contenido}</span>
              ) : (
                <ReactMarkdown components={mdBurbuja} remarkPlugins={[remarkGfm]}>
                  {m.contenido}
                </ReactMarkdown>
              )}
            </div>

            {m.esPlan && m.planTexto && (
              <div style={{
                maxWidth: '95%', width: '100%',
                background: 'linear-gradient(135deg,#064e3b,#065f46)',
                border: '1px solid #059669', borderRadius: 14,
                padding: '20px 24px', fontSize: 13, color: '#d1fae5', lineHeight: 1.8,
              }}>
                <ReactMarkdown components={mdPlan} remarkPlugins={[remarkGfm]}>
                  {m.planTexto}
                </ReactMarkdown>
              </div>
            )}

            {m.rol === 'bot' && m.opciones && m.opciones.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: '85%' }}>
                {m.opciones.map((op, j) => (
                  <button
                    key={j}
                    onClick={() => enviarMensaje(op)}
                    disabled={cargando || !botListo || i < mensajes.length - 1}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #059669', color: '#10b981',
                      borderRadius: 20, padding: '6px 14px',
                      cursor: (cargando || !botListo || i < mensajes.length - 1) ? 'default' : 'pointer',
                      fontSize: 13,
                      opacity: (!botListo || i < mensajes.length - 1) ? 0.35 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      if (i === mensajes.length - 1 && !cargando && botListo)
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
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                animation: `bounce 1s ${i * 0.18}s infinite`,
              }}/>
            ))}
          </div>
        )}

        {/* Botón reiniciar */}
        {paso === 'conversacion_libre' && !planListo && !cargando && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <button
              onClick={async () => {
                await fetch(`${API}/turismo/sesion/${sesionId}`, { method: 'DELETE' })
                setMensajes([])
                setDatos({})
                setPaso('bienvenida')
                setMercado('auto')
                setPlanListo(false)
                setPlanTextoFinal('')
                setBotListo(false)
                iniciado.current = false
                iniciarConversacion()
              }}
              style={{
                background: 'transparent', border: '1px solid #334155',
                color: '#475569', borderRadius: 20,
                padding: '5px 16px', fontSize: 12,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
            >
              🔄 Empezar de nuevo
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        width: '100%', maxWidth: 720,
        padding: '12px 20px 28px',
        borderTop: '1px solid #1e293b',
        background: '#0f172a',
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: '#1e293b', borderRadius: 14, padding: '8px 12px',
          border: `1px solid ${inputBloqueado ? '#1e293b' : '#334155'}`,
          transition: 'border-color 0.3s',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje(input)}
            placeholder={
              !botListo  ? '⏳ Conectando con el asistente...' :
              planListo  ? '✅ Plan generado — pulsa Descargar PDF' :
              cargando   ? 'Procesando...' :
              '✍️ Escribe tu respuesta...'
            }
            disabled={inputBloqueado}
            style={{
              flex: 1, background: 'none', border: 'none',
              color: (planListo || !botListo) ? '#475569' : '#f1f5f9',
              fontSize: 14, outline: 'none',
              cursor: inputBloqueado ? 'not-allowed' : 'text',
            }}
          />
          <button
            onClick={() => enviarMensaje(input)}
            disabled={botonBloqueado}
            style={{
              background: !botonBloqueado
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : '#334155',
              border: 'none', borderRadius: 10,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: botonBloqueado ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100%{ transform: translateY(0);   }
          50%    { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

