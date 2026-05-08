'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Map, Car, Plane, Train, Bus, Calculator, Compass, ChevronRight, X, ChevronDown, Mic, MicOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import dynamic from 'next/dynamic'

const MapaInteractivo = dynamic(
  () => import('@/components/MapaInteractivo'),
  { ssr: false }
)

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

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 2 — Mensajes de espera dinámicos por contexto
// ══════════════════════════════════════════════════════════════════════════════
const MENSAJES_ESPERA: Record<string, string[]> = {
  default: [
    'Irache está pensando...',
    'Consultando información local...',
    'Preparando la mejor respuesta...',
    'Analizando tu petición...',
  ],
  recoger_destino: [
    'Explorando destinos increíbles...',
    'Buscando los mejores lugares...',
    'Consultando rutas y experiencias...',
  ],
  recoger_presupuesto: [
    'Calculando opciones para tu presupuesto...',
    'Buscando la mejor relación calidad-precio...',
    'Comparando alojamientos y actividades...',
  ],
  generar_plan: [
    'Diseñando tu itinerario personalizado... ✨',
    'Consultando los mejores pintxos de Pamplona...',
    'Calculando la ruta por el Pirineo...',
    'Buscando alojamientos con encanto...',
    'Revisando el clima para tu época...',
    'Añadiendo recomendaciones gastronómicas...',
    'Preparando tu plan de viaje único...',
    'Casi listo, puliendo los últimos detalles...',
  ],
  conversacion_libre: [
    'Irache está preparando tu plan...',
    'Organizando la información de tu viaje...',
    'Creando una experiencia personalizada...',
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 3 — Sugerencias contextuales por paso
// ══════════════════════════════════════════════════════════════════════════════
const SUGERENCIAS_CONTEXTUALES: Record<string, string[]> = {
  recoger_nombre:    ['Ana', 'Carlos', 'María', 'Luis'],
  recoger_email:     ['mi@email.com'],
  recoger_tipo:      ['Turismo cultural', 'Aventura y naturaleza', 'Gastronomía y vino', 'Relax y bienestar'],
  recoger_compania:  ['Voy solo/a', 'En pareja', 'En familia con niños', 'Con amigos'],
  recoger_personas:  ['Solo/a', '2 personas', '3-4 personas', 'Grupo de 5+'],
  recoger_epoca:     ['Este fin de semana', 'Este mes', 'En verano', 'En otoño', 'En Navidades'],
  recoger_duracion:  ['Un día', 'Fin de semana', 'Una semana', 'Más de una semana'],
  recoger_presupuesto: ['Económico, menos de 100€', 'Moderado, unos 200€', 'Confortable, unos 400€', 'Premium, sin límite'],
  recoger_destino:   ['Pirineo navarro', 'Pamplona y alrededores', 'Bardenas Reales', 'Selva de Irati', 'Ruta del vino'],
  recoger_transporte:['En coche propio', 'En tren o bus', 'En avión', 'En bici o senderismo'],
  recoger_hospedaje: ['Hotel céntrico', 'Casa rural con encanto', 'Camping o glamping', 'Apartamento turístico'],
  recoger_intereses: ['Senderismo y montaña', 'Gastronomía local', 'Historia y cultura', 'Fotografía y paisajes'],
  recoger_necesidades: ['No, ninguna especial', 'Viajamos con niños pequeños', 'Tenemos mascota', 'Movilidad reducida'],
  conversacion_libre:['Dame el plan completo', '¿Cuánto costaría aproximadamente?', '¿Cuál es la mejor época?', '¿Qué no puedo perderme?'],
  default:           ['Quiero visitar Navarra', 'Busco un destino de montaña', 'Me interesa la gastronomía', 'Quiero un plan romántico'],
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 4 — Lógica de calidad de respuesta
// ══════════════════════════════════════════════════════════════════════════════
function calcularCalidad(texto: string, paso: string): {
  nivel: 'vacio' | 'corto' | 'medio' | 'bueno'
  color: string
  label: string
  porcentaje: number
} {
  const len      = texto.trim().length
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length

  // Pasos donde la calidad no aplica (respuestas cortas son OK)
  const pasosCortos = ['recoger_nombre', 'recoger_email', 'recoger_personas', 'recoger_compania']
  if (pasosCortos.includes(paso)) {
    if (len === 0) return { nivel: 'vacio',  color: 'transparent', label: '',                    porcentaje: 0   }
    if (len >= 2)  return { nivel: 'bueno',  color: '#10b981',     label: '✓ Perfecto',           porcentaje: 100 }
  }

  if (len === 0)        return { nivel: 'vacio', color: 'transparent', label: '',                      porcentaje: 0  }
  if (palabras <= 2)    return { nivel: 'corto', color: '#ef4444',     label: 'Añade más detalles',     porcentaje: 25 }
  if (palabras <= 5)    return { nivel: 'medio', color: '#f59e0b',     label: 'Bien, puedes añadir más', porcentaje: 60 }
  return                       { nivel: 'bueno', color: '#10b981',     label: '✓ Perfecto',             porcentaje: 100 }
}

// ── Panel flotante ────────────────────────────────────────────────────────────
interface PanelItem {
  id: string
  icon: React.ReactNode
  label: string
  color: string
  subOpciones?: { label: string; mensaje: string; icon?: React.ReactNode }[]
}

const PANEL_ITEMS: PanelItem[] = [
  {
    id: 'nacional', icon: <Map size={15} />, label: 'Turismo nacional', color: '#6366f1',
    subOpciones: [
      { label: 'En coche',   mensaje: 'Voy a viajar en coche',   icon: <Car   size={13}/> },
      { label: 'En avión',   mensaje: 'Voy a viajar en avión',   icon: <Plane size={13}/> },
      { label: 'En tren',    mensaje: 'Voy a viajar en tren',    icon: <Train size={13}/> },
      { label: 'En autobús', mensaje: 'Voy a viajar en autobús', icon: <Bus   size={13}/> },
    ],
  },
  {
    id: 'coste', icon: <Calculator size={15} />, label: 'Calcular coste viaje', color: '#10b981',
    subOpciones: [
      { label: 'Coste ida y vuelta',      mensaje: '¿Puedes calcularme el coste aproximado del viaje de ida y vuelta?' },
      { label: 'Presupuesto total viaje', mensaje: '¿Cuál sería el presupuesto total estimado para el viaje completo?' },
      { label: 'Coste por persona',       mensaje: '¿Cuánto costaría aproximadamente por persona?' },
      { label: 'Opciones económicas',     mensaje: '¿Cuáles son las opciones más económicas para este viaje?' },
    ],
  },
  {
    id: 'destinos', icon: <Compass size={15} />, label: 'Destinos populares', color: '#f59e0b',
    subOpciones: [
      { label: '🏔️ Pirineos navarros',  mensaje: 'Quiero explorar los Pirineos navarros' },
      { label: '🍷 Ruta del vino Rioja', mensaje: 'Me interesa la ruta del vino por La Rioja' },
      { label: '🌿 Selva de Irati',      mensaje: 'Quiero visitar la Selva de Irati' },
      { label: '🛤️ Camino de Santiago', mensaje: 'Me gustaría hacer el Camino de Santiago' },
      { label: '🏰 Pamplona histórica',  mensaje: 'Quiero conocer el casco histórico de Pamplona' },
    ],
  },
  {
    id: 'preguntas', icon: <ChevronRight size={15} />, label: 'Preguntas inteligentes', color: '#a78bfa',
    subOpciones: [
      { label: '¿Mejor época para ir?',   mensaje: '¿Cuál es la mejor época del año para visitar el destino?' },
      { label: '¿Qué no puedo perderme?', mensaje: '¿Qué lugares o experiencias no puedo perderme en este destino?' },
      { label: '¿Hospedaje recomendado?', mensaje: '¿Qué tipo de hospedaje me recomiendas para este viaje?' },
      { label: '¿Gastronomía local?',     mensaje: '¿Qué platos típicos y restaurantes me recomiendas?' },
      { label: '¿Actividades con niños?', mensaje: '¿Qué actividades son ideales para hacer con niños?' },
      { label: '¿Rutas de senderismo?',   mensaje: '¿Hay buenas rutas de senderismo en la zona?' },
    ],
  },
]

function PanelFlotante({
  onEnviar,
  bloqueado,
  esMobil,
}: {
  onEnviar: (msg: string) => void
  bloqueado: boolean
  esMobil:  boolean
}) {
  const [expandido,  setExpandido]  = useState<string | null>(null)
  const [visible,    setVisible]    = useState(true)
  const [minimizado, setMinimizado] = useState(false)

  if (!visible) return null

  // En PC: sidebar fijo a la izquierda que NO pisa el chat
  // En móvil: overlay flotante pequeño
  const estiloContenedor: React.CSSProperties = esMobil
    ? {
        position:      'fixed',
        left:          '8px',
        top:           '50%',
        transform:     'translateY(-50%)',
        zIndex:        50,
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
        maxHeight:     '80vh',
        overflowY:     'auto',
        animation:     'panel-in .4s ease both',
      }
    : {
        position:      'fixed',
        left:          '16px',
        top:           '50%',
        transform:     'translateY(-50%)',
        zIndex:        50,
        display:       'flex',
        flexDirection: 'column',
        gap:           '8px',
        maxHeight:     '80vh',
        overflowY:     'auto',
        animation:     'panel-in .4s ease both',
        // CLAVE: el chat tiene maxWidth 720 centrado,
        // el panel vive FUERA de ese contenedor a la izquierda
        // Solo ocultamos si la ventana es muy estrecha
        ...(typeof window !== 'undefined' && window.innerWidth < 1100
          ? { display: 'none' }
          : {}),
      }

  return (
    <>
      <style>{`
        @keyframes panel-in { from{opacity:0;transform:translateX(-20px) translateY(-50%)} to{opacity:1;transform:translateX(0) translateY(-50%)} }
        @keyframes sub-in   { from{opacity:0;transform:translateY(-8px) scaleY(0.95)} to{opacity:1;transform:translateY(0) scaleY(1)} }
        .panel-item:hover { background: rgba(255,255,255,0.06) !important; }
        .sub-btn:hover    { background: rgba(255,255,255,0.08) !important; transform: translateX(3px); }
        @media (max-width: 1100px) {
          .guia-rapida-panel { display: none !important; }
        }
        @media (max-width: 900px) {
          .guia-rapida-panel { display: flex !important; }
        }
      `}</style>
      <div className="guia-rapida-panel" style={estiloContenedor}>
        {/* Cabecera */}
        <div style={{
          background:     'rgba(10,15,30,0.95)',
          border:         '1px solid rgba(99,102,241,0.3)',
          borderRadius:   '14px',
          padding:        '8px 12px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '8px',
          backdropFilter: 'blur(20px)',
          boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', letterSpacing: '.06em' }}>
            🧭 GUÍA RÁPIDA
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setMinimizado(m => !m)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', lineHeight: 1 }}
            >
              <ChevronDown size={14} style={{ transform: minimizado ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
            </button>
            <button
              onClick={() => setVisible(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', lineHeight: 1 }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {!minimizado && PANEL_ITEMS.map(item => (
          <div key={item.id} style={{ position: 'relative' }}>
            <button
              className="panel-item"
              onClick={() => setExpandido(expandido === item.id ? null : item.id)}
              disabled={bloqueado}
              style={{
                width:      '100%',
                background: expandido === item.id
                  ? `rgba(${item.color === '#6366f1' ? '99,102,241' : item.color === '#10b981' ? '16,185,129' : item.color === '#f59e0b' ? '245,158,11' : '167,139,250'},0.15)`
                  : 'rgba(10,15,30,0.92)',
                border:         `1px solid ${expandido === item.id ? item.color + '55' : 'rgba(30,41,59,0.8)'}`,
                borderRadius:   '12px',
                padding:        '10px 12px',
                cursor:         bloqueado ? 'not-allowed' : 'pointer',
                display:        'flex',
                alignItems:     'center',
                gap:            '8px',
                backdropFilter: 'blur(20px)',
                boxShadow:      expandido === item.id ? `0 4px 20px ${item.color}22` : '0 4px 16px rgba(0,0,0,0.3)',
                transition:     'all .2s ease',
                opacity:        bloqueado ? 0.4 : 1,
                minWidth:       '180px',
                textAlign:      'left',
              }}
            >
              <span style={{
                width:           '26px',
                height:          '26px',
                borderRadius:    '8px',
                background:      `${item.color}22`,
                border:          `1px solid ${item.color}44`,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                color:           item.color,
                flexShrink:      0,
              }}>{item.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', flex: 1 }}>{item.label}</span>
              <ChevronDown
                size={12}
                color="#475569"
                style={{ transform: expandido === item.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }}
              />
            </button>

            {expandido === item.id && item.subOpciones && (
              <div style={{
                marginTop:  '4px',
                background: 'rgba(8,12,24,0.97)',
                border:     `1px solid ${item.color}33`,
                borderRadius: '12px',
                overflow:   'hidden',
                boxShadow:  `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${item.color}11`,
                animation:  'sub-in .2s ease both',
              }}>
                {item.subOpciones.map((sub, idx) => (
                  <button
                    key={idx}
                    className="sub-btn"
                    onClick={() => { onEnviar(sub.mensaje); setExpandido(null) }}
                    disabled={bloqueado}
                    style={{
                      width:        '100%',
                      background:   'transparent',
                      border:       'none',
                      borderBottom: idx < item.subOpciones!.length - 1 ? '1px solid rgba(30,41,59,0.5)' : 'none',
                      padding:      '9px 14px',
                      cursor:       bloqueado ? 'not-allowed' : 'pointer',
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '8px',
                      textAlign:    'left',
                      transition:   'all .15s ease',
                    }}
                  >
                    {sub.icon && <span style={{ color: item.color, flexShrink: 0 }}>{sub.icon}</span>}
                    <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500, lineHeight: 1.4 }}>{sub.label}</span>
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

// ── Feature 2: Typing indicator con mensajes dinámicos ───────────────────────
function TypingIndicator({ paso }: { paso: string }) {
  const pool   = MENSAJES_ESPERA[paso] ?? MENSAJES_ESPERA.default
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    setIdx(0)
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % pool.length)
        setFade(true)
      }, 300)
    }, 2800)
    return () => clearInterval(interval)
  }, [paso, pool.length])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
      <style>{`
        @keyframes typing-dot  { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-6px);opacity:1} }
        @keyframes typing-glow { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)} 50%{box-shadow:0 0 8px 2px rgba(16,185,129,0.3)} }
        @keyframes msg-fade    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg,#059669,#10b981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', flexShrink: 0,
        animation: 'typing-glow 1.5s ease-in-out infinite',
      }}>✈️</div>

      {/* Burbuja */}
      <div style={{
        background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '18px 18px 18px 4px', padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '8px',
        backdropFilter: 'blur(10px)', minWidth: '200px',
      }}>
        {/* Puntos */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#059669,#10b981)',
              animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
            }} />
          ))}
        </div>
        {/* Mensaje rotativo */}
        <span style={{
          fontSize: '11px', color: '#64748b', fontStyle: 'italic',
          opacity: fade ? 1 : 0,
          transform: fade ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity .3s ease, transform .3s ease',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {pool[idx]}
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
    }}>{emoji}</div>
  )
}

// ── Warm-up ───────────────────────────────────────────────────────────────────
function WarmUpScreen({ elapsed }: { elapsed: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', gap: '1.75rem',
      background: 'linear-gradient(160deg,#060b18,#0a0f1e)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes spin-warm      { to{transform:rotate(360deg)} }
        @keyframes pulse-ring     { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.7);opacity:0} }
        @keyframes fade-in-warm   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes progress-slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
      `}</style>
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.3)', animation: 'pulse-ring 1.6s ease-out infinite' }}/>
        <div style={{ position: 'absolute', inset: '6px', borderRadius: '50%', border: '3px solid transparent', borderTop: '3px solid #10b981', borderRight: '3px solid #059669', animation: 'spin-warm 0.9s linear infinite' }}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
            <polygon points="12,4 14,12 12,20 10,12" fill="#10b981" opacity="0.9"/>
            <polygon points="4,12 12,10 20,12 12,14" fill="#059669" opacity="0.7"/>
            <circle cx="12" cy="12" r="2" fill="#34d399"/>
          </svg>
        </div>
      </div>
      <div style={{ textAlign: 'center', animation: 'fade-in-warm .6s ease both' }}>
        <p style={{ margin: '0 0 .5rem', fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>Iniciando IracheBot Turismo</p>
        <p style={{ margin: '0 0 .5rem', fontSize: '.85rem', color: '#475569' }}>Preparando tu asistente de viajes ☕</p>
        {elapsed >= 5 && (
          <p style={{ margin: 0, fontSize: '.75rem', color: '#334155', animation: 'fade-in-warm .4s ease both' }}>{elapsed}s — casi listo...</p>
        )}
      </div>
      <div style={{ width: '220px', height: '3px', background: 'rgba(16,185,129,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '35%', background: 'linear-gradient(90deg,#059669,#10b981,#34d399)', borderRadius: '2px', animation: 'progress-slide 1.5s ease-in-out infinite' }}/>
      </div>
      <p style={{ fontSize: '.72rem', color: '#1e293b', maxWidth: '260px', textAlign: 'center', lineHeight: 1.6 }}>
        💡 El primer inicio puede tardar ~30s. Los siguientes serán instantáneos.
      </p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function TurismoPage() {
  const router = useRouter()

  const [backendReady,   setBackendReady]   = useState(false)
  const [elapsed,        setElapsed]        = useState(0)
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
  const [mapaAbierto, setMapaAbierto] = useState(false)

  const [esMobil, setEsMobil] = useState(false)
  useEffect(() => {
  const check = () => setEsMobil(window.innerWidth < 900)
  check()
  window.addEventListener('resize', check)
  return () => window.removeEventListener('resize', check)
  }, [])


  // ── Feature 1: Voz ──────────────────────────────────────────────────────
  const [escuchando,      setEscuchando]      = useState(false)
  const [vozSoportada,    setVozSoportada]    = useState(false)
  const recognitionRef = useRef<any>(null)

  // ── Feature 3: Sugerencias ──────────────────────────────────────────────
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<string[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const iniciado  = useRef(false)
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Detectar soporte de voz ─────────────────────────────────────────────
  useEffect(() => {
    const soportada = typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    setVozSoportada(soportada)
  }, [])

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
    return () => { clearInterval(timer); if (retryRef.current) clearTimeout(retryRef.current) }
  }, [])

  useEffect(() => {
    if (!backendReady || iniciado.current) return
    iniciado.current = true
    iniciarConversacion()
  }, [backendReady])

  // ── Feature 3: Actualizar sugerencias al cambiar input o paso ──────────
  useEffect(() => {
    if (!input.trim()) {
      setMostrarSugerencias(false)
      return
    }
    const pool = SUGERENCIAS_CONTEXTUALES[paso] ?? SUGERENCIAS_CONTEXTUALES.default
    const filtradas = pool.filter(s =>
      s.toLowerCase().includes(input.toLowerCase()) && s.toLowerCase() !== input.toLowerCase()
    )
    setSugerenciasFiltradas(filtradas.slice(0, 3))
    setMostrarSugerencias(filtradas.length > 0)
  }, [input, paso])

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

  const enviarMensaje = useCallback(async (texto: string) => {
    if (!texto.trim() || cargando || !botListo) return
    setInput('')
    setMostrarSugerencias(false)
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
        setPaso('finalizado')
      }
      if (data.finalizado) {
        setPlanListo(true)                          // ← doble seguro
        setPaso('finalizado')
      }
      setMensajes(prev => [...prev, nuevoMensaje])
    } catch {
      setMensajes(prev => [...prev, { rol: 'bot', contenido: '⚠️ Error al procesar tu respuesta.' }])
    } finally {
      setCargando(false)
    }
  }, [cargando, botListo, sesionId, paso, datos, mercado])

  // ── Feature 1: Lógica de voz ────────────────────────────────────────────
  const toggleVoz = useCallback(() => {
    if (!vozSoportada) return

    if (escuchando) {
      recognitionRef.current?.stop()
      setEscuchando(false)
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang          = 'es-ES'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setEscuchando(true)

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join('')
      setInput(transcript)
      // Si es resultado final, enfocar el input
      if (e.results[e.results.length - 1].isFinal) {
        inputRef.current?.focus()
      }
    }

    recognition.onerror = () => { setEscuchando(false) }
    recognition.onend   = () => { setEscuchando(false) }

    recognitionRef.current = recognition
    recognition.start()
  }, [vozSoportada, escuchando])

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
<div class="footer"><p>© 2026 IracheBot · Servicio de consumo y turismo</p><p style="margin-top:4px">💡 Ctrl + P → "Guardar como PDF"</p></div>
<script>window.onload=()=>{window.focus();window.print()}</script></body></html>`

    const ventana = window.open('', '_blank')
    if (!ventana) return
    ventana.document.write(html)
    ventana.document.close()
  }

  // ── Feature 4: calidad del input ────────────────────────────────────────
  const calidad        = calcularCalidad(input, paso)
  const progreso       = Math.round(((PASOS_MAP[paso] ?? 0) / PASOS_TOTAL) * 100)
  const inputBloqueado = !botListo || cargando || planListo
  const botonBloqueado = !input.trim() || !botListo || cargando || planListo

  if (!backendReady) return <WarmUpScreen elapsed={elapsed} />

  return (
    <div style={{ minHeight: '100vh', background: '#060b18', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @keyframes bounce      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes msg-in-bot  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes msg-in-user { from{opacity:0;transform:translateX(12px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes plan-in     { from{opacity:0;transform:translateY(16px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes sug-in      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mic-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes quality-bar { from{width:0} to{width:var(--q-width)} }
        .sug-item:hover { background: rgba(16,185,129,0.15) !important; color: #10b981 !important; }
      `}</style>

      <PanelFlotante onEnviar={enviarMensaje} bloqueado={inputBloqueado} esMobil={esMobil} />


      {/* ── Header ── */}
      <div style={{
        width: '100%', maxWidth: 720, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(30,41,59,0.8)',
        position: 'sticky', top: 0,
        background: 'rgba(6,11,24,0.92)', backdropFilter: 'blur(20px)', zIndex: 10,
      }}>
        <button onClick={() => router.push('/')} style={{
          background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.5)',
          borderRadius: '10px', cursor: 'pointer', color: '#94a3b8',
          width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.5)')}
        ><ArrowLeft size={16} /></button>

        <div style={{
          width: 42, height: 42, borderRadius: '14px',
          background: 'linear-gradient(135deg,#065f46,#059669,#10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(5,150,105,0.5)', flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <path d="M12 3C12 3 16 7 16 12C16 17 12 21 12 21" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 3C12 3 8 7 8 12C8 17 12 21 12 21" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
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
              background: botListo ? '#22c55e' : '#f59e0b', display: 'inline-block',
              boxShadow: botListo ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
            }}/>
            <span style={{ color: botListo ? '#10b981' : '#f59e0b' }}>
              {botListo
                ? `En línea · ${mercado === 'navarra' ? '🏔️ Navarra' : mercado === 'internacional' ? '🌍 Internacional' : mercado === 'espana' ? '🇪🇸 España' : 'Turismo & Ocio'}`
                : 'Conectando...'}
            </span>
          </div>
        </div>

        {planListo && (
          <button onClick={descargarPDF} style={{
            background: 'linear-gradient(135deg,#059669,#10b981)',
            color: 'white', border: 'none', borderRadius: '10px',
            padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(5,150,105,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 16px rgba(5,150,105,0.4)' }}
          >📄 Descargar PDF</button>
        )}
        <button
          onClick={() => setMapaAbierto(true)}
          style={{
            background:   'rgba(16,185,129,0.1)',
            border:       '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px',
            padding:      '8px 14px',
            cursor:       'pointer',
            fontSize:     12,
            fontWeight:   700,
            color:        '#10b981',
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            transition:   'all 0.2s',
            whiteSpace:   'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
        >
          🗺️ Ver mapa
        </button>
      </div>

      {/* ── Barra de progreso ── */}
      <div style={{ width: '100%', maxWidth: 720, padding: '10px 20px 6px' }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
          {Array.from({ length: PASOS_TOTAL + 1 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: (PASOS_MAP[paso] ?? 0) >= i ? `hsl(${160 - i * 3},70%,45%)` : 'rgba(30,41,59,0.6)',
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
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: '8px',
              flexDirection: m.rol === 'usuario' ? 'row-reverse' : 'row',
            }}>
              {m.rol === 'bot' ? <BotAvatar mercado={mercado} /> : (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                }}>{datos.nombre?.[0]?.toUpperCase() ?? '👤'}</div>
              )}
              <div style={{
                maxWidth: '78%',
                background: m.rol === 'usuario' ? 'linear-gradient(135deg,#059669,#10b981)' : 'rgba(15,23,42,0.8)',
                color: '#f1f5f9',
                borderRadius: m.rol === 'usuario' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '11px 15px', fontSize: 14, lineHeight: 1.6,
                border: m.rol === 'bot' ? '1px solid rgba(30,41,59,0.8)' : 'none',
                backdropFilter: m.rol === 'bot' ? 'blur(10px)' : 'none',
                boxShadow: m.rol === 'usuario' ? '0 4px 16px rgba(5,150,105,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                {m.rol === 'usuario' ? <span>{m.contenido}</span> : (
                  <ReactMarkdown components={mdBurbuja} remarkPlugins={[remarkGfm]}>{m.contenido}</ReactMarkdown>
                )}
              </div>
            </div>

            {/* ── Bloque del plan ── */}
            {m.esPlan && m.planTexto && (
              <div style={{
                maxWidth: '95%', width: '100%',
                background: 'linear-gradient(135deg,rgba(6,78,59,0.9),rgba(6,95,70,0.8))',
                border: '1px solid rgba(5,150,105,0.4)', borderRadius: 16,
                padding: '20px 24px', fontSize: 13, color: '#d1fae5', lineHeight: 1.8,
                backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(5,150,105,0.15)',
                animation: 'plan-in .4s ease both',
              }}>
                <ReactMarkdown components={mdPlan} remarkPlugins={[remarkGfm]}>{m.planTexto}</ReactMarkdown>

                {/* ── Botones del plan ── */}
                <div style={{
                  marginTop:     '16px',
                  paddingTop:    '12px',
                  borderTop:     '1px solid rgba(5,150,105,0.2)',
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           '8px',
                }}>

                  {/* Botón mapa */}
                  <button
                    onClick={() => setMapaAbierto(true)}
                    style={{
                      width:          '100%',
                      background:     'rgba(16,185,129,0.08)',
                      border:         '1px solid rgba(16,185,129,0.25)',
                      borderRadius:   '12px',
                      padding:        '10px 16px',
                      cursor:         'pointer',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      gap:            '8px',
                      fontSize:       '13px',
                      fontWeight:     600,
                      color:          '#10b981',
                      transition:     'all .2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)' }}
                  >
                    🗺️ Ver todos los lugares en el mapa
                  </button>

                  {/* Botón continuar — solo si falta la sección final */}
                  {!m.planTexto.includes('CONSEJO IRACHEBOT') && (
                    <button
                      onClick={() => enviarMensaje(
                        'El plan se cortó, por favor continúa desde donde lo dejaste y termina con el resumen de costes y el consejo final'
                      )}
                      disabled={cargando}
                      style={{
                        width:          '100%',
                        background:     'rgba(245,158,11,0.08)',
                        border:         '1px solid rgba(245,158,11,0.3)',
                        borderRadius:   '12px',
                        padding:        '10px 16px',
                        cursor:         cargando ? 'not-allowed' : 'pointer',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        gap:            '8px',
                        fontSize:       '13px',
                        fontWeight:     600,
                        color:          '#f59e0b',
                        transition:     'all .2s',
                        opacity:        cargando ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!cargando) e.currentTarget.style.background = 'rgba(245,158,11,0.15)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(245,158,11,0.08)'
                      }}
                    >
                      ⚠️ El plan parece incompleto — Continuar desde aquí
                    </button>
                  )}

                </div>
              </div>
            )}

            {/* ── Chips de opciones ── */}
            {m.rol === 'bot' && m.opciones && m.opciones.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxWidth: '85%', paddingLeft: '42px' }}>
                {m.opciones.map((op, j) => (
                  <button
                    key={j}
                    onClick={() => enviarMensaje(op)}
                    disabled={cargando || !botListo || i < mensajes.length - 1}
                    style={{
                      background:     'rgba(6,11,24,0.8)',
                      border:         '1px solid rgba(5,150,105,0.4)',
                      color:          '#10b981',
                      borderRadius:   20,
                      padding:        '6px 14px',
                      cursor:         (cargando || !botListo || i < mensajes.length - 1) ? 'default' : 'pointer',
                      fontSize:       12,
                      fontWeight:     500,
                      opacity:        (!botListo || i < mensajes.length - 1) ? 0.3 : 1,
                      transition:     'all .2s',
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={e => {
                      if (i === mensajes.length - 1 && !cargando && botListo) {
                        const b = e.currentTarget as HTMLButtonElement
                        b.style.background  = 'rgba(5,150,105,0.2)'
                        b.style.borderColor = '#10b981'
                        b.style.transform   = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={e => {
                      const b = e.currentTarget as HTMLButtonElement
                      b.style.background  = 'rgba(6,11,24,0.8)'
                      b.style.borderColor = 'rgba(5,150,105,0.4)'
                      b.style.transform   = 'translateY(0)'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}

          </div>
        ))}

        {/* ── Typing indicator dinámico ── */}
        {cargando && <TypingIndicator paso={paso} />}

        {/* ── Botón empezar de nuevo ── */}
        {paso === 'conversacion_libre' && !planListo && !cargando && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
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
                background:   'transparent',
                border:       '1px solid rgba(51,65,85,0.5)',
                color:        '#334155',
                borderRadius: 20,
                padding:      '5px 16px',
                fontSize:     11,
                cursor:       'pointer',
                transition:   'all .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#475569'
                e.currentTarget.style.color       = '#475569'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)'
                e.currentTarget.style.color       = '#334155'
              }}
            >
              🔄 Empezar de nuevo
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Zona de Input con los 4 features ── */}
      <div style={{
        width:          '100%',
        maxWidth:       720,
        padding:        '8px 20px 24px',
        borderTop:      '1px solid rgba(15,23,42,0.8)',
        background:     'rgba(6,11,24,0.95)',
        backdropFilter: 'blur(20px)',
        position:       'sticky',
        bottom:         0,
        zIndex:         10,
      }}>

        {/* ── Sugerencias contextuales ── */}
        {mostrarSugerencias && sugerenciasFiltradas.length > 0 && !inputBloqueado && (
          <div style={{
            display:    'flex',
            flexWrap:   'wrap',
            gap:        6,
            marginBottom: 8,
            animation:  'sug-in .2s ease both',
          }}>
            {sugerenciasFiltradas.map((sug, i) => (
              <button
                key={i}
                className="sug-item"
                onClick={() => {
                  setInput(sug)
                  setMostrarSugerencias(false)
                  inputRef.current?.focus()
                }}
                style={{
                  background:   'rgba(16,185,129,0.08)',
                  border:       '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 20,
                  padding:      '5px 12px',
                  fontSize:     12,
                  color:        '#6ee7b7',
                  cursor:       'pointer',
                  transition:   'all .15s',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          5,
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.6 }}>✦</span>
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* ── Indicador de calidad ── */}
        {calidad.nivel !== 'vacio' && !inputBloqueado && (
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         8,
            marginBottom: 6,
            paddingLeft: 4,
          }}>
            <div style={{
              flex:       1,
              height:     2,
              borderRadius: 99,
              background: 'rgba(30,41,59,0.6)',
              overflow:   'hidden',
            }}>
              <div style={{
                height:     '100%',
                width:      `${calidad.porcentaje}%`,
                background: calidad.color,
                borderRadius: 99,
                transition: 'width .4s ease, background .3s ease',
                boxShadow:  `0 0 6px ${calidad.color}66`,
              }}/>
            </div>
            <span style={{
              fontSize:   10,
              fontWeight: 600,
              color:      calidad.color,
              transition: 'color .3s ease',
              whiteSpace: 'nowrap',
              minWidth:   120,
              textAlign:  'right',
            }}>
              {calidad.label}
            </span>
          </div>
        )}

        {/* ── Input principal ── */}
        <div style={{
          display:      'flex',
          gap:          8,
          alignItems:   'center',
          background:   'rgba(15,23,42,0.8)',
          borderRadius: 16,
          padding:      '8px 8px 8px 16px',
          border: `1px solid ${
            escuchando
              ? 'rgba(239,68,68,0.6)'
              : inputBloqueado
                ? 'rgba(15,23,42,0.5)'
                : calidad.nivel === 'bueno'
                  ? 'rgba(16,185,129,0.4)'
                  : 'rgba(51,65,85,0.6)'
          }`,
          boxShadow: escuchando
            ? '0 0 0 2px rgba(239,68,68,0.15)'
            : calidad.nivel === 'bueno'
              ? '0 0 0 1px rgba(16,185,129,0.1)'
              : 'none',
          transition: 'all 0.3s',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje(input)}
            onFocus={() => {
              const pool = SUGERENCIAS_CONTEXTUALES[paso] ?? SUGERENCIAS_CONTEXTUALES.default
              if (!input.trim() && pool.length > 0 && !inputBloqueado) {
                setSugerenciasFiltradas(pool.slice(0, 3))
                setMostrarSugerencias(true)
              }
            }}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
            placeholder={
              escuchando ? '🎤 Escuchando... habla ahora'      :
              !botListo  ? '⏳ Conectando con el asistente...' :
              planListo  ? '✅ Plan generado — pulsa Descargar PDF' :
              cargando   ? '⌛ Procesando...'                  :
                           '✍️ Escribe tu respuesta...'
            }
            disabled={inputBloqueado}
            style={{
              flex:       1,
              background: 'none',
              border:     'none',
              color:      (planListo || !botListo) ? '#334155' : escuchando ? '#fca5a5' : '#f1f5f9',
              fontSize:   14,
              outline:    'none',
              cursor:     inputBloqueado ? 'not-allowed' : 'text',
              fontFamily: 'inherit',
            }}
          />

          {/* ── Botón de voz ── */}
          {vozSoportada && !planListo && (
            <button
              onClick={toggleVoz}
              disabled={cargando || !botListo}
              title={escuchando ? 'Detener grabación' : 'Hablar con Irache'}
              style={{
                background:   escuchando ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.6)',
                border:       `1px solid ${escuchando ? 'rgba(239,68,68,0.5)' : 'rgba(51,65,85,0.4)'}`,
                borderRadius: 10,
                width:        36,
                height:       36,
                flexShrink:   0,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                cursor:       (cargando || !botListo) ? 'not-allowed' : 'pointer',
                transition:   'all .2s',
                animation:    escuchando ? 'mic-pulse 1.2s ease-in-out infinite' : 'none',
                opacity:      (!botListo || cargando) ? 0.4 : 1,
              }}
              onMouseEnter={e => {
                if (!cargando && botListo)
                  e.currentTarget.style.background = escuchando
                    ? 'rgba(239,68,68,0.25)'
                    : 'rgba(51,65,85,0.8)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = escuchando
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(30,41,59,0.6)'
              }}
            >
              {escuchando
                ? <MicOff size={15} color="#f87171" />
                : <Mic    size={15} color="#64748b" />
              }
            </button>
          )}

          {/* ── Botón enviar ── */}
          <button
            onClick={() => enviarMensaje(input)}
            disabled={botonBloqueado}
            style={{
              background:   !botonBloqueado
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : 'rgba(30,41,59,0.5)',
              border:       'none',
              borderRadius: 12,
              width:        38,
              height:       38,
              flexShrink:   0,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              cursor:       botonBloqueado ? 'not-allowed' : 'pointer',
              transition:   'all .2s',
              boxShadow:    !botonBloqueado ? '0 4px 12px rgba(5,150,105,0.4)' : 'none',
            }}
            onMouseEnter={e => { if (!botonBloqueado) e.currentTarget.style.transform = 'scale(1.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Send size={15} color={botonBloqueado ? '#334155' : 'white'} />
          </button>
        </div>
      </div>

      {/* ── Mapa interactivo ── */}
      {mapaAbierto && planTextoFinal && (
        <MapaInteractivo
          planTexto={planTextoFinal}
          destino={datos.destino_deseado ?? ''}
          onCerrar={() => setMapaAbierto(false)}
          onEnviarChat={(msg) => {
            setMapaAbierto(false)
            enviarMensaje(msg)
          }}
          cargandoChat={cargando}
        />
      )}

    </div>
  )
}
