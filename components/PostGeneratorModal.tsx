// frontend/components/PostGeneratorModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { X, Copy, CheckCircle2, Share2, Edit3, Hash, Instagram } from 'lucide-react'

interface Props {
  caso: {
    nombre: string
    categoria: string
    created_at: string
    estado: string
  }
  onClose: () => void
}

// ── Datos por categoría ───────────────────────────────────
const CATEGORIA_EMOJI: Record<string, string> = {
  telefonia:  '📱', banca:      '🏦', energia:    '⚡',
  seguros:    '🛡️', transporte: '🚌', ecommerce:  '🛒',
  musica:     '🎵', arte:       '🎨', turismo:    '🏨', otro: '📄',
}
const CATEGORIA_LABEL: Record<string, string> = {
  telefonia:  'Telefonía',  banca:      'Banca',      energia:    'Energía',
  seguros:    'Seguros',    transporte: 'Transporte', ecommerce:  'E-commerce',
  musica:     'Música',     arte:       'Arte',       turismo:    'Turismo', otro: 'Consumo',
}

// ── Hashtags por sector ───────────────────────────────────
const HASHTAGS_SECTOR: Record<string, string[]> = {
  telefonia:  ['#Euskaltel', '#Movistar', '#Vodafone', '#Telefonía', '#ReclamaYa'],
  banca:      ['#Banca', '#BBVA', '#Santander', '#CaixaBank', '#DerechosBancarios'],
  energia:    ['#Iberdrola', '#Endesa', '#Naturgy', '#LuzCara', '#EnergíaNavarra'],
  seguros:    ['#Seguros', '#Mapfre', '#Allianz', '#ReclamaSeguros'],
  transporte: ['#Renfe', '#Transporte', '#VuelosCancelados', '#ReclamaViaje'],
  ecommerce:  ['#Amazon', '#Ecommerce', '#CompraOnline', '#DerechosConsumidor'],
  turismo:    ['#Turismo', '#Navarra', '#VisitNavarra', '#TurismoRural'],
  otro:       ['#Consumo', '#Reclamaciones', '#DerechosConsumidor'],
}

const HASHTAGS_BASE = ['#IracheBot', '#CasoResuelto', '#Navarra', '#Reclamaciones', '#IA']

// ── Tonos disponibles ─────────────────────────────────────
const TONOS = [
  { key: 'profesional', label: '💼 Profesional', desc: 'Formal y corporativo'  },
  { key: 'cercano',     label: '😊 Cercano',     desc: 'Amigable y directo'    },
  { key: 'urgente',     label: '🔥 Urgente',     desc: 'Llamada a la acción'   },
] as const
type Tono = typeof TONOS[number]['key']

function calcularDias(fecha: string): number {
  const inicio = new Date(fecha)
  const ahora  = new Date()
  return Math.max(1, Math.floor((ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)))
}

// ── Generador de texto por tono y plataforma ──────────────
function generarTexto(
  plataforma: 'instagram' | 'facebook',
  tono: Tono,
  nombre: string,
  sector: string,
  emoji: string,
  dias: number,
  hashtagsActivos: string[],
): string {
  const hashtags = hashtagsActivos.join(' ')
  const diaStr   = `${dias} día${dias !== 1 ? 's' : ''}`

  if (plataforma === 'instagram') {
    if (tono === 'profesional') return `✅ Caso resuelto · ${sector}

${emoji} Sector: ${sector}
⏱️ Tiempo de gestión: ${diaStr}
📍 Navarra · IracheBot

Gestionamos la reclamación de ${nombre} de forma íntegra y sin intermediarios. Resultado: resuelto en ${diaStr}.

Servicio 100% gratuito y disponible 24/7.
🔗 Link en bio

${hashtags}`

    if (tono === 'cercano') return `🎉 ¡Otro caso resuelto en ${diaStr}!

${nombre} tenía un problema con ${sector.toLowerCase()} y lo resolvimos juntos 💪

${emoji} Sin llamadas eternas.
✅ Sin burocracia.
⚡ En solo ${diaStr}.

¿Te pasa algo parecido? Cuéntanoslo 👇
👉 Link en bio — es gratis

${hashtags}`

    if (tono === 'urgente') return `🚨 ¿Llevas semanas reclamando sin respuesta?

${nombre} también lo intentó solo... hasta que usó IracheBot.

${emoji} Sector: ${sector}
⏱️ Resuelto en ${diaStr}
🔥 Sin esperas. Sin excusas.

No pierdas más tiempo.
👉 Empieza ahora — link en bio

${hashtags}`
  }

  // Facebook
  if (tono === 'profesional') return `✅ IracheBot · Caso resuelto en ${sector}

${emoji} Sector: ${sector}
⏱️ Tiempo de resolución: ${diaStr}

Hemos gestionado con éxito la reclamación de ${nombre} frente a su compañía de ${sector.toLowerCase()}. Nuestro asistente con IA guía al usuario en cada paso del proceso, sin necesidad de conocimientos legales previos.

🔗 irachembot-frontend.vercel.app

Comparte si conoces a alguien que lo necesite.
${hashtags}`

  if (tono === 'cercano') return `😊 ¡Buenas noticias! Otro caso cerrado con éxito.

${nombre} tenía un problema con su ${sector.toLowerCase()} y hoy puede decir que está resuelto ✅

Con IracheBot no necesitas abogado, ni esperar horas al teléfono. Solo contarnos qué pasó.

${emoji} Sector: ${sector} · ⏱️ ${diaStr}

👉 Pruébalo gratis: irachembot-frontend.vercel.app

¿Conoces a alguien con una reclamación pendiente? Etiquétalo 👇
${hashtags}`

  // urgente facebook
  return `🔴 ATENCIÓN: ¿Tu compañía te ignora?

${nombre} llevaba tiempo intentando resolver su reclamación de ${sector.toLowerCase()} sin éxito.
Con IracheBot lo resolvió en ${diaStr}.

🚫 Sin llamadas interminables.
🚫 Sin formularios imposibles.
✅ Con IA que trabaja para ti.

⏰ Cada día que esperas es un día que pierdes.
👉 irachembot-frontend.vercel.app

${hashtags}`
}

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════
export function PostGeneratorModal({ caso, onClose }: Props) {
  const dias   = calcularDias(caso.created_at)
  const emoji  = CATEGORIA_EMOJI[caso.categoria] ?? '📄'
  const sector = CATEGORIA_LABEL[caso.categoria] ?? 'Consumo'
  const nombre = caso.nombre?.split(' ')[0] ?? 'Cliente'

  const [plataforma,      setPlataforma]      = useState<'instagram' | 'facebook'>('instagram')
  const [tono,            setTono]            = useState<Tono>('cercano')
  const [hashtagsActivos, setHashtagsActivos] = useState<string[]>([
    ...HASHTAGS_BASE,
    ...(HASHTAGS_SECTOR[caso.categoria] ?? []).slice(0, 2),
  ])
  const [textoEditado,    setTextoEditado]    = useState('')
  const [modoEdicion,     setModoEdicion]     = useState(false)
  const [copiado,         setCopiado]         = useState(false)
  const [abrioIG,         setAbrioIG]         = useState(false)

  // Regenerar texto cuando cambian parámetros (si NO está en modo edición)
  useEffect(() => {
    if (modoEdicion) return
    setTextoEditado(generarTexto(plataforma, tono, nombre, sector, emoji, dias, hashtagsActivos))
  }, [plataforma, tono, hashtagsActivos, modoEdicion])

  const toggleHashtag = (tag: string) => {
    setHashtagsActivos(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const copiar = async () => {
    await navigator.clipboard.writeText(textoEditado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const abrirInstagram = async () => {
    await navigator.clipboard.writeText(textoEditado)
    setAbrioIG(true)
    setTimeout(() => setAbrioIG(false), 3000)
    window.open('https://www.instagram.com/irachebotservice/', '_blank')
  }

  const todosHashtags = [...HASHTAGS_BASE, ...(HASHTAGS_SECTOR[caso.categoria] ?? [])]
  const chars = textoEditado.length
  const maxChars = plataforma === 'instagram' ? 2200 : 63206
  const charPct  = Math.min(100, Math.round((chars / maxChars) * 100))
  const charColor = charPct > 90 ? '#f87171' : charPct > 70 ? '#fbbf24' : '#6ee7b7'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1117', border: '1px solid #21262d',
          borderRadius: '20px', width: '100%', maxWidth: '520px',
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          scrollbarWidth: 'thin', scrollbarColor: '#21262d transparent',
          animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >

        {/* ── HEADER ── */}
        <div style={{
          padding: '1.1rem 1.4rem', borderBottom: '1px solid #21262d',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0d1117, #161b22)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Share2 size={16} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Generar Post</p>
              <p style={{ margin: 0, fontSize: '0.68rem', color: '#8b949e' }}>
                Caso resuelto · {sector}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#21262d', border: '1px solid #30363d',
            borderRadius: '7px', width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8b949e', cursor: 'pointer',
          }}>
            <X size={13} />
          </button>
        </div>

        {/* ── STATS ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.5rem', padding: '1rem 1.4rem',
          borderBottom: '1px solid #21262d',
        }}>
          {[
            { label: 'Sector', value: sector,        color: '#a5b4fc' },
            { label: 'Días',   value: `${dias}d`,    color: '#6ee7b7' },
            { label: 'Estado', value: '✅ Resuelto',  color: '#6ee7b7' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#161b22', border: '1px solid #21262d',
              borderRadius: '10px', padding: '0.6rem 0.7rem', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', fontWeight: 700, color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ padding: '1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── PLATAFORMA ── */}
          <div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.63rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Plataforma
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['instagram', 'facebook'] as const).map(p => (
                <button key={p} onClick={() => { setPlataforma(p); setModoEdicion(false) }} style={{
                  flex: 1,
                  background: plataforma === p ? (p === 'instagram' ? '#2d1b4e' : '#0c1a2e') : '#161b22',
                  border: `1px solid ${plataforma === p ? (p === 'instagram' ? '#7c3aed' : '#1e40af') : '#21262d'}`,
                  borderRadius: '10px', padding: '0.55rem',
                  color: plataforma === p ? (p === 'instagram' ? '#c4b5fd' : '#93c5fd') : '#8b949e',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}>
                  {p === 'instagram' ? '📸 Instagram' : '📘 Facebook'}
                </button>
              ))}
            </div>
          </div>

          {/* ── TONO ── */}
          <div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.63rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tono del post
            </p>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {TONOS.map(t => (
                <button key={t.key} onClick={() => { setTono(t.key); setModoEdicion(false) }}
                  title={t.desc}
                  style={{
                    flex: 1,
                    background: tono === t.key ? 'rgba(99,102,241,0.15)' : '#161b22',
                    border: `1px solid ${tono === t.key ? 'rgba(99,102,241,0.45)' : '#21262d'}`,
                    borderRadius: '9px', padding: '0.5rem 0.3rem',
                    color: tono === t.key ? '#a5b4fc' : '#8b949e',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: tono === t.key ? 700 : 400,
                    transition: 'all 0.15s', textAlign: 'center',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── HASHTAGS ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Hash size={11} color="#8b949e" />
              <p style={{ margin: 0, fontSize: '0.63rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Hashtags — {hashtagsActivos.length} activos
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {todosHashtags.map(tag => {
                const activo = hashtagsActivos.includes(tag)
                return (
                  <button key={tag} onClick={() => toggleHashtag(tag)} style={{
                    background: activo ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.5)',
                    border: `1px solid ${activo ? 'rgba(99,102,241,0.4)' : '#21262d'}`,
                    borderRadius: '20px', padding: '0.22rem 0.65rem',
                    color: activo ? '#a5b4fc' : '#475569',
                    cursor: 'pointer', fontSize: '0.72rem', fontWeight: activo ? 600 : 400,
                    transition: 'all 0.15s',
                    textDecoration: activo ? 'none' : 'line-through',
                  }}>
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── PREVIEW / EDITOR ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.63rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {modoEdicion ? '✏️ Editando' : 'Preview'}
              </p>
              <button onClick={() => setModoEdicion(!modoEdicion)} style={{
                background: modoEdicion ? 'rgba(251,191,36,0.1)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${modoEdicion ? 'rgba(251,191,36,0.3)' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: '6px', padding: '0.2rem 0.55rem',
                color: modoEdicion ? '#fbbf24' : '#6366f1',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                transition: 'all 0.15s',
              }}>
                <Edit3 size={10} />
                {modoEdicion ? 'Vista previa' : 'Editar'}
              </button>
            </div>

            {modoEdicion ? (
              <textarea
                value={textoEditado}
                onChange={e => setTextoEditado(e.target.value)}
                style={{
                  width: '100%', minHeight: '220px',
                  background: '#161b22',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: '10px', padding: '0.9rem',
                  color: '#e6edf3', fontSize: '0.8rem',
                  lineHeight: 1.65, resize: 'vertical',
                  outline: 'none', fontFamily: 'system-ui, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{
                background: '#161b22', border: '1px solid #21262d',
                borderRadius: '10px', padding: '0.9rem',
                maxHeight: '220px', overflowY: 'auto',
                scrollbarWidth: 'thin', scrollbarColor: '#21262d transparent',
              }}>
                <pre style={{
                  margin: 0, fontSize: '0.8rem', color: '#e6edf3',
                  lineHeight: 1.65, whiteSpace: 'pre-wrap',
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {textoEditado}
                </pre>
              </div>
            )}

            {/* Contador de caracteres */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.45rem' }}>
              <div style={{ flex: 1, height: '3px', borderRadius: '100px', background: '#21262d' }}>
                <div style={{
                  height: '100%', borderRadius: '100px',
                  width: `${charPct}%`, background: charColor,
                  transition: 'width 0.3s ease, background 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: '0.65rem', color: charColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {chars} / {maxChars.toLocaleString()}
              </span>
            </div>
          </div>

          {/* ── BOTONES ACCIÓN ── */}
          <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.4rem' }}>

            {/* Copiar */}
            <button onClick={copiar} style={{
              flex: 1,
              background: copiado ? '#022c22' : '#1e1b4b',
              border: `1px solid ${copiado ? '#065f46' : '#4338ca'}`,
              borderRadius: '10px', padding: '0.7rem',
              color: copiado ? '#6ee7b7' : '#a5b4fc',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              transition: 'all 0.2s',
            }}>
              {copiado
                ? <><CheckCircle2 size={14} /> ¡Copiado!</>
                : <><Copy size={14} /> Copiar</>
              }
            </button>

            {/* Abrir Instagram */}
            <button onClick={abrirInstagram} style={{
              flex: 1,
              background: abrioIG ? '#2d1b4e' : 'linear-gradient(135deg, #4f1d96, #7c3aed)',
              border: `1px solid ${abrioIG ? '#7c3aed' : '#6d28d9'}`,
              borderRadius: '10px', padding: '0.7rem',
              color: '#e9d5ff',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              transition: 'all 0.2s',
              boxShadow: abrioIG ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
            }}>
              {abrioIG
                ? <><CheckCircle2 size={14} /> Abriendo...</>
                : <><Share2 size={14} /> Copiar + Abrir IG</>
              }
            </button>
          </div>

          {/* Hint */}
          <p style={{ margin: '-0.5rem 0 0', fontSize: '0.67rem', color: '#334155', textAlign: 'center' }}>
            💡 "Copiar + Abrir IG" copia el texto y abre tu perfil de Instagram
          </p>

        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  )
}