'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Map, Car, Plane, Train, Bus, Calculator, Compass, ChevronRight, X, ChevronDown } from 'lucide-react'
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

// ── Markdown ──────────────────────────────────────────────────────────────────
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
    <th style={{ background: '#059669', color: 'white', padding: '7px 12px', textAlign: 'left', border: '1px solid #047857', fontWeight: 600, fontSize: 12 }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ padding: '6px 12px', border: '1px solid #1e3a2f', color: '#d1fae5', fontSize: 12 }}>{children}</td>
  ),
  code: ({ children }) => (
    <code style={{ background: '#0f172a', color: '#34d399', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{children}</code>
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
    <h1 style={{ color: '#34d399', fontSize: 16, margin: '14px 0 6px', borderBottom: '1px solid #059669', paddingBottom: 4 }}>{children}</h1>
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

// ── Panel flotante de herramientas inteligentes ───────────────────────────────
interface PanelItem {
  id: string
  icon: React.ReactNode
  label: string
  color: string
  subOpciones?: { label: string; mensaje: string; icon?: React.ReactNode }[]
}

const PANEL_ITEMS: PanelItem[] = [
  {
    id: 'nacional',
    icon: <Map size={15} />,
    label: 'Turismo nacional',
    color: '#6366f1',
    subOpciones: [
      { label: 'En coche',  mensaje: 'Voy a viajar en coche',  icon: <Car   size={13}/> },
      { label: 'En avión',  mensaje: 'Voy a viajar en avión',  icon: <Plane size={13}/> },
      { label: 'En tren',   mensaje: 'Voy a viajar en tren',   icon: <Train size={13}/> },
      { label: 'En autobús',mensaje: 'Voy a viajar en autobús',icon: <Bus   size={13}/> },
    ],
  },
  {
    id: 'coste',
    icon: <Calculator size={15} />,
    label: 'Calcular coste viaje',
    color: '#10b981',
    subOpciones: [
      { label: 'Coste ida y vuelta',       mensaje: '¿Puedes calcularme el coste aproximado del viaje de ida y vuelta?' },
      { label: 'Presupuesto total viaje',  mensaje: '¿Cuál sería el presupuesto total estimado para el viaje completo?' },
      { label: 'Coste por persona',        mensaje: '¿Cuánto costaría aproximadamente por persona?' },
      { label: 'Opciones económicas',      mensaje: '¿Cuáles son las opciones más económicas para este viaje?' },
    ],
  },
  {
    id: 'destinos',
    icon: <Compass size={15} />,
    label: 'Destinos populares',
    color: '#f59e0b',
    subOpciones: [
      { label: '🏔️ Pirineos navarros', mensaje: 'Quiero explorar los Pirineos navarros' },
      { label: '🍷 Ruta del vino Rioja', mensaje: 'Me interesa la ruta del vino por La Rioja' },
      { label: '🌿 Selva de Irati',     mensaje: 'Quiero visitar la Selva de Irati' },
      { label: '🛤️ Camino de Santiago', mensaje: 'Me gustaría hacer el Camino de Santiago' },
      { label: '🏰 Pamplona histórica', mensaje: 'Quiero conocer el casco histórico de Pamplona' },
    ],
  },
  {
    id: 'preguntas',
    icon: <ChevronRight size={15} />,
    label: 'Preguntas inteligentes',
    color: '#a78bfa',
    subOpciones: [
      { label: '¿Mejor época para ir?',         mensaje: '¿Cuál es la mejor época del año para visitar el destino?' },
      { label: '¿Qué no puedo perderme?',       mensaje: '¿Qué lugares o experiencias no puedo perderme en este destino?' },
      { label: '¿Hospedaje recomendado?',       mensaje: '¿Qué tipo de hospedaje me recomiendas para este viaje?' },
      { label: '¿Gastronomía local?',           mensaje: '¿Qué platos típicos y restaurantes me recomiendas?' },
      { label: '¿Actividades con niños?',       mensaje: '¿Qué actividades son ideales para hacer con niños?' },
      { label: '¿Rutas de senderismo?',         mensaje: '¿Hay buenas rutas de senderismo en la zona?' },
    ],
  },
]

// ── Componente Panel Flotante ─────────────────────────────────────────────────
function PanelFlotante({
  onEnviar,
  bloqueado,
}: {
  onEnviar: (msg: string) => void
  bloqueado: boolean
}) {
  const [expandido, setExpandido] = useState<string | null>(null)
  const [visible,   setVisible]   = useState(true)
  const [minimizado, setMinimizado] = useState(false)

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes panel-in {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes sub-in {
          from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
          to   { opacity: 1; transform: translateY(0)  scaleY(1); }
        }
        .panel-item:hover { background: rgba(255,255,255,0.06) !important; }
        .sub-btn:hover    { background: rgba(255,255,255,0.08) !important; transform: translateX(3px); }
      `}</style>

      <div style={{
        position: 'fixed',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'panel-in .4s ease both',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>

        {/* Cabecera del panel */}
        <div style={{
          background: 'rgba(10,15,30,0.95)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '14px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', letterSpacing: '.06em' }}>
            🧭 GUÍA RÁPIDA
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setMinimizado(m => !m)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', lineHeight: 1 }}
              title={minimizado ? 'Expandir' : 'Minimizar'}
            >
              <ChevronDown size={14} style={{ transform: minimizado ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
            </button>
            <button
              onClick={() => setVisible(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', lineHeight: 1 }}
              title="Cerrar panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Items del panel */}
        {!minimizado && PANEL_ITEMS.map(item => (
          <div key={item.id} style={{ position: 'relative' }}>
            {/* Botón principal */}
            <button
              className="panel-item"
              onClick={() => setExpandido(expandido === item.id ? null : item.id)}
              disabled={bloqueado}
              style={{
                width: '100%',
                background: expandido === item.id
                  ? `rgba(${item.color === '#6366f1' ? '99,102,241' : item.color === '#10b981' ? '16,185,129' : item.color === '#f59e0b' ? '245,158,11' : '167,139,250'},0.15)`
                  : 'rgba(10,15,30,0.92)',
                border: `1px solid ${expandido === item.id ? item.color + '55' : 'rgba(30,41,59,0.8)'}`,
                borderRadius: '12px',
                padding: '10px 12px',
                cursor: bloqueado ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(20px)',
                boxShadow: expandido === item.id ? `0 4px 20px ${item.color}22` : '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'all .2s ease',
                opacity: bloqueado ? 0.4 : 1,
                minWidth: '180px',
                textAlign: 'left',
              }}
            >
              <span style={{
                width: '26px', height: '26px', borderRadius: '8px',
                background: `${item.color}22`,
                border: `1px solid ${item.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.color, flexShrink: 0,
              }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', flex: 1 }}>
                {item.label}
              </span>
              <ChevronDown
                size={12}
                color="#475569"
                style={{
                  transform: expandido === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform .2s',
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Sub-opciones desplegables */}
            {expandido === item.id && item.subOpciones && (
              <div style={{
                marginTop: '4px',
                background: 'rgba(8,12,24,0.97)',
                border: `1px solid ${item.color}33`,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${item.color}11`,
                animation: 'sub-in .2s ease both',
              }}>
                {item.subOpciones.map((sub, idx) => (
                  <button
                    key={idx}
                    className="sub-btn"
                    onClick={() => {
                      onEnviar(sub.mensaje)
                      setExpandido(null)
                    }}
                    disabled={bloqueado}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: idx < item.subOpciones!.length - 1 ? '1px solid rgba(30,41,59,0.5)' : 'none',
                      padding: '9px 14px',
                      cursor: bloqueado ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'all .15s ease',
                    }}
                  >
                    {sub.icon && (
                      <span style={{ color: item.color, flexShrink: 0 }}>{sub.icon}</span>
                    )}
                    <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500, lineHeight: 1.4 }}>
                      {sub.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Typing indicator mejorado ─────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0);    opacity: .4; }
          30%            { transform: translateY(-6px); opacity: 1;  }
        }
        @keyframes typing-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          50%      { box-shadow: 0 0 8px 2px rgba(16,185,129,0.3); }
        }
      `}</style>

      {/* Avatar del bot animado */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg,#059669,#10b981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', flexShrink: 0,
        animation: 'typing-glow 1.5s ease-in-out infinite',
      }}>
        ✈️
      </div>

      {/* Burbuja con puntos */}
      <div style={{
        background: 'rgba(30,41,59,0.8)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '18px 18px 18px 4px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        backdropFilter: 'blur(10px)',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: `linear-gradient(135deg,#059669,#10b981)`,
            animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
        <span style={{ fontSize: '11px', color: '#475569', marginLeft: '6px', fontStyle: 'italic' }}>
          Irache está escribiendo...
        </span>
      </div>
    </div>
  )
}

// ── Avatar del bot ────────────────────────────────────────────────────────────
function BotAvatar({ mercado }: { mercado: string }) {
  const emoji = mercado === 'internacional' ? '🌍' : mercado === 'espana' ? '🇪🇸' : '🏔️'
  return (
    <div style={{
      width: '34px', height: '34px', borderRadius: '50%',
      background: 'linear-gradient(135deg,#059669,#10b981)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '15px', flexShrink: 0,
      boxShadow: '0 4px 12px rgba(5,150,105,0.4)',
    }}>
      {emoji}
    </div>
  )
}

// ── Warm-up ───────────────────────────────────────────────────────────────────
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

      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
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
        {/* Icono SVG de brújula en lugar del emoji */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
            <polygon points="12,4 14,12 12,20 10,12" fill="#10b981" opacity="0.9"/>
            <polygon points="4,12 12,10 20,12 12,14" fill="#059669" opacity="0.7"/>
            <circle cx="12" cy="12" r="2" fill="#34d399"/>
          </svg>
        </div>
      </div>

      <div style={{ textAlign: 'center', animation: 'fade-in-warm .6s ease both' }}>
        <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>
          Iniciando IracheBot Turismo
        </p>
        <p style={{ margin: '0 0 .5rem', fontSize: '.85rem', color: '#475569' }}>
          Preparando tu asistente de viajes ☕
        </p>
        {elapsed >= 5 && (
          <p style={{ margin: 0, fontSize: '.75rem', color: '#334155', animation: 'fade-in-warm .4s ease both' }}>
            {elapsed}s — casi listo...
          </p>
        )}
      </div>

      <div style={{ width: '220px', height: '3px', background: 'rgba(16,185,129,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: '35%',
          background: 'linear-gradient(90deg,#059669,#10b981,#34d399)',
          borderRadius: '2px',
          animation: 'progress-slide 1.5s ease-in-out infinite',
        }}/>
      </div>

      <p style={{ fontSize: '.72rem', color: '#1e293b', maxWidth: '260px', textAlign: 'center', lineHeight: 1.6 }}>
        💡 El primer inicio puede tardar ~30s. Los siguientes serán instantáneos.
      </p>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TurismoPage() {
  const router = useRouter()

  const [backendReady, setBackendReady] = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    const ping = () => {
      fetch(`${API}/health`)
        .then(() => { setBackendReady(true); clearInterval(timer) })
        .catch(() => { retryRef.current = setTimeout(ping, 3000) })
    }
    ping()
    return () => {
      clearInterval(timer)
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [])

  useEffect(() => {
    if (!backendReady || iniciado.current) return
    iniciado.current = true
    iniciarConversacion()
  }, [backendReady])

  const iniciarConversacion = async () => {
    setCargando(true)
    try {
      const res  = await fetch(`${API}/turismo/mensaje`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion_id: sesionId, mensaje: '', paso: 'bienvenida', datos_sesion: {} }),
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

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || cargando || !botListo) return
    setInput('')
    setMensajes(prev => [...prev, { rol: 'usuario', contenido: texto }])
    setCargando(true)
    try {
      const res  = await fetch(`${API}/turismo/mensaje`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id: sesionId, mensaje: texto, paso,
          datos_sesion: datos, mercado: CHIP_MERCADO[texto] ?? mercado,
        }),
      })
      const data = await res.json()
      if (data.mercado_detectado)  setMercado(data.mercado_detectado)
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
      .replace(/(\|.+\|\n)((?:\|[-:]+)+\|\n)((?:\|.+\|\n?)*)/g, (_, header, _sep, body) => {
        const ths = header.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('')
        const trs = body.trim().split('\n').map((row: string) => {
          const tds = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('')
          return `<tr>${tds}</tr>`
        }).join('')
        return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
      })
      .replace(/\n/g, '<br>')

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Plan de Viaje — ${nombre}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:48px;max-width:760px;margin:0 auto}.header{text-align:center;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #4f46e5}.header h1{font-size:26px;color:#a78bfa;margin-bottom:8px}.header p{color:#64748b;font-size:13px}.badge{display:inline-block;background:#4f46e5;color:white;border-radius:20px;padding:4px 14px;font-size:11px;margin:3px}.plan{background:#1e293b;border-radius:12px;padding:28px;font-size:13px;line-height:1.9;color:#d1fae5;border:1px solid #059669}.plan h1{color:#34d399;font-size:16px;margin:14px 0 6px;border-bottom:1px solid #059669;padding-bottom:4px}.plan h2{color:#34d399;font-size:15px;margin:12px 0 5px}.plan h3{color:#6ee7b7;font-size:14px;margin:10px 0 4px}.plan strong{color:#6ee7b7}.plan hr{border:none;border-top:1px solid #065f46;margin:10px 0}.plan ul{padding-left:20px;margin:6px 0}.plan li{margin-bottom:4px}.plan table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12px}.plan th{background:#059669;color:white;padding:7px 12px;text-align:left;border:1px solid #047857}.plan td{padding:6px 12px;border:1px solid #1e3a2f}.footer{text-align:center;margin-top:28px;color:#475569;font-size:11px}@media print{body{background:#fff;color:#111;padding:32px}.plan{background:#f0fdf4;color:#064e3b;border-color:#059669}.plan th{background:#059669;color:white}.plan td{border-color:#a7f3d0}.plan strong{color:#065f46}.plan h1,.plan h2{color:#065f46}.header h1{color:#4f46e5}}</style>
</head><body>
<div class="header"><h1>🌍 Plan de Viaje Personalizado</h1><p>Preparado para <strong style="color:#a78bfa">${nombre}</strong> · ${fecha}</p>
<div style="margin-top:12px"><span class="badge">🤖 IracheBot Turismo</span><span class="badge">📍 ${mercado === 'internacional' ? 'Internacional' : mercado === 'espana' ? 'España' : 'Navarra'}</span></div></div>
<div class="plan">${planHtml}</div>
<div class="footer"><p>© 2026 IracheBot · Servicio de Consumo de Navarra</p><p style="margin-top:4px">💡 Ctrl + P → "Guardar como PDF"</p></div>
<script>window.onload=()=>{window.focus();window.print()}</script></body></html>`

    const ventana = window.open('', '_blank')
    if (!ventana) return
    ventana.document.write(html)
    ventana.document.close()
  }

  const progreso       = Math.round(((PASOS_MAP[paso] ?? 0) / PASOS_TOTAL) * 100)
  const inputBloqueado = !botListo || cargando || planListo
  const botonBloqueado = !input.trim() || !botListo || cargando || planListo

  if (!backendReady) return <WarmUpScreen elapsed={elapsed} />

  return (
    <div style={{ minHeight: '100vh', background: '#060b18', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @keyframes bounce {
          0%,100%{ transform: translateY(0);   }
          50%    { transform: translateY(-6px); }
        }
        @keyframes msg-in-bot  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes msg-in-user { from{opacity:0;transform:translateX(12px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes plan-in     { from{opacity:0;transform:translateY(16px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      {/* Panel flotante izquierdo */}
      <PanelFlotante onEnviar={enviarMensaje} bloqueado={inputBloqueado} />

      {/* ── Header ── */}
      <div style={{
        width: '100%', maxWidth: 720, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(30,41,59,0.8)',
        position: 'sticky', top: 0,
        background: 'rgba(6,11,24,0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.5)',
            borderRadius: '10px', cursor: 'pointer', color: '#94a3b8',
            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.5)')}
        >
          <ArrowLeft size={16} />
        </button>

        {/* Logo SVG en lugar del emoji */}
        <div style={{
          width: 42, height: 42, borderRadius: '14px',
          background: 'linear-gradient(135deg,#065f46,#059669,#10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(5,150,105,0.5)',
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <path d="M12 3C12 3 16 7 16 12C16 17 12 21 12 21" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 3C12 3 8 7 8 12C8 17 12 21 12 21"  stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M3 12H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            <path d="M4 8H20M4 16H20" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            <circle cx="12" cy="12" r="2" fill="white"/>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>IracheBot Turismo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 11 }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: botListo ? '#22c55e' : '#f59e0b',
              display: 'inline-block',
              boxShadow: botListo ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
            }}/>
            <span style={{ color: botListo ? '#10b981' : '#f59e0b' }}>
              {botListo
                ? `En línea · ${mercado === 'navarra' ? '🏔️ Navarra' : mercado === 'internacional' ? '🌍 Internacional' : mercado === 'espana' ? '🇪🇸 España' : 'Turismo & Ocio'}`
                : 'Conectando...'
              }
            </span>
          </div>
        </div>

        {planListo && (
          <button
            onClick={descargarPDF}
            style={{
              background: 'linear-gradient(135deg,#059669,#10b981)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '8px 14px', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(5,150,105,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 16px rgba(5,150,105,0.4)' }}
          >
            📄 Descargar PDF
          </button>
        )}
      </div>

      {/* ── Barra de progreso ── */}
      <div style={{ width: '100%', maxWidth: 720, padding: '10px 20px 6px' }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
          {Array.from({ length: PASOS_TOTAL + 1 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: (PASOS_MAP[paso] ?? 0) >= i
                ? `hsl(${160 - i * 3},70%,45%)`
                : 'rgba(30,41,59,0.6)',
              transition: 'background 0.4s',
              boxShadow: (PASOS_MAP[paso] ?? 0) >= i ? '0 0 4px rgba(16,185,129,0.4)' : 'none',
            }}/>
          ))}
        </div>
        <div style={{ color: '#334155', fontSize: 10, textAlign: 'right', fontWeight: 600 }}>
          {progreso === 100 ? '✅ Completado' : `${progreso}% completado`}
        </div>
      </div>

      {/* ── Mensajes ── */}
      <div style={{
        flex: 1, width: '100%', maxWidth: 720,
        padding: '12px 20px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {mensajes.map((m, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            alignItems: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
            animation: m.rol === 'bot' ? 'msg-in-bot .3s ease both' : 'msg-in-user .3s ease both',
          }}>

            {/* Fila con avatar + burbuja */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: '8px',
              flexDirection: m.rol === 'usuario' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar */}
              {m.rol === 'bot' ? (
                <BotAvatar mercado={mercado} />
              ) : (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                }}>
                  {datos.nombre?.[0]?.toUpperCase() ?? '👤'}
                </div>
              )}

              {/* Burbuja */}
              <div style={{
                maxWidth: '78%',
                background: m.rol === 'usuario'
                  ? 'linear-gradient(135deg,#059669,#10b981)'
                  : 'rgba(15,23,42,0.8)',
                color: '#f1f5f9',
                borderRadius: m.rol === 'usuario' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '11px 15px', fontSize: 14, lineHeight: 1.6,
                border: m.rol === 'bot' ? '1px solid rgba(30,41,59,0.8)' : 'none',
                backdropFilter: m.rol === 'bot' ? 'blur(10px)' : 'none',
                boxShadow: m.rol === 'usuario'
                  ? '0 4px 16px rgba(5,150,105,0.3)'
                  : '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                {m.rol === 'usuario' ? (
                  <span>{m.contenido}</span>
                ) : (
                  <ReactMarkdown components={mdBurbuja} remarkPlugins={[remarkGfm]}>
                    {m.contenido}
                  </ReactMarkdown>
                )}
              </div>
            </div>

            {/* Card del plan */}
            {m.esPlan && m.planTexto && (
              <div style={{
                maxWidth: '95%', width: '100%',
                background: 'linear-gradient(135deg,rgba(6,78,59,0.9),rgba(6,95,70,0.8))',
                border: '1px solid rgba(5,150,105,0.4)', borderRadius: 16,
                padding: '20px 24px', fontSize: 13, color: '#d1fae5', lineHeight: 1.8,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 16px 48px rgba(5,150,105,0.15)',
                animation: 'plan-in .4s ease both',
              }}>
                <ReactMarkdown components={mdPlan} remarkPlugins={[remarkGfm]}>
                  {m.planTexto}
                </ReactMarkdown>
              </div>
            )}

            {/* Opciones */}
            {m.rol === 'bot' && m.opciones && m.opciones.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxWidth: '85%', paddingLeft: '42px' }}>
                {m.opciones.map((op, j) => (
                  <button
                    key={j}
                    onClick={() => enviarMensaje(op)}
                    disabled={cargando || !botListo || i < mensajes.length - 1}
                    style={{
                      background: 'rgba(6,11,24,0.8)',
                      border: '1px solid rgba(5,150,105,0.4)', color: '#10b981',
                      borderRadius: 20, padding: '6px 14px',
                      cursor: (cargando || !botListo || i < mensajes.length - 1) ? 'default' : 'pointer',
                      fontSize: 12, fontWeight: 500,
                      opacity: (!botListo || i < mensajes.length - 1) ? 0.3 : 1,
                      transition: 'all .2s',
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={e => {
                      if (i === mensajes.length - 1 && !cargando && botListo) {
                        const b = e.currentTarget as HTMLButtonElement
                        b.style.background = 'rgba(5,150,105,0.2)'
                        b.style.borderColor = '#10b981'
                        b.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={e => {
                      const b = e.currentTarget as HTMLButtonElement
                      b.style.background = 'rgba(6,11,24,0.8)'
                      b.style.borderColor = 'rgba(5,150,105,0.4)'
                      b.style.transform = 'translateY(0)'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator mejorado */}
        {cargando && <TypingIndicator />}

        {/* Botón reiniciar */}
        {paso === 'conversacion_libre' && !planListo && !cargando && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button
              onClick={async () => {
                await fetch(`${API}/turismo/sesion/${sesionId}`, { method: 'DELETE' })
                setMensajes([]); setDatos({}); setPaso('bienvenida')
                setMercado('auto'); setPlanListo(false); setPlanTextoFinal('')
                setBotListo(false); iniciado.current = false
                iniciarConversacion()
              }}
              style={{
                background: 'transparent', border: '1px solid rgba(51,65,85,0.5)',
                color: '#334155', borderRadius: 20, padding: '5px 16px',
                fontSize: 11, cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#475569' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)'; e.currentTarget.style.color = '#334155' }}
            >
              🔄 Empezar de nuevo
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        width: '100%', maxWidth: 720,
        padding: '12px 20px 28px',
        borderTop: '1px solid rgba(15,23,42,0.8)',
        background: 'rgba(6,11,24,0.95)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'rgba(15,23,42,0.8)',
          borderRadius: 16, padding: '8px 8px 8px 16px',
          border: `1px solid ${inputBloqueado ? 'rgba(15,23,42,0.5)' : 'rgba(51,65,85,0.6)'}`,
          boxShadow: inputBloqueado ? 'none' : '0 0 0 1px rgba(16,185,129,0.05)',
          transition: 'all 0.3s',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje(input)}
            placeholder={
              !botListo  ? '⏳ Conectando con el asistente...' :
              planListo  ? '✅ Plan generado — pulsa Descargar PDF' :
              cargando   ? '⌛ Procesando...' :
              '✍️ Escribe tu respuesta...'
            }
            disabled={inputBloqueado}
            style={{
              flex: 1, background: 'none', border: 'none',
              color: (planListo || !botListo) ? '#334155' : '#f1f5f9',
              fontSize: 14, outline: 'none',
              cursor: inputBloqueado ? 'not-allowed' : 'text',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => enviarMensaje(input)}
            disabled={botonBloqueado}
            style={{
              background: !botonBloqueado
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : 'rgba(30,41,59,0.5)',
              border: 'none', borderRadius: 12,
              width: 38, height: 38, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: botonBloqueado ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
              boxShadow: !botonBloqueado ? '0 4px 12px rgba(5,150,105,0.4)' : 'none',
            }}
            onMouseEnter={e => { if (!botonBloqueado) e.currentTarget.style.transform = 'scale(1.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Send size={15} color={botonBloqueado ? '#334155' : 'white'} />
          </button>
        </div>
      </div>
    </div>
  )
}
