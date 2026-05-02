// frontend/components/PostGeneratorModal.tsx
'use client'
import { useState } from 'react'
import {
  X, Copy, CheckCircle2, Clock, Zap,
  Smartphone, Landmark, Shield, Bus,
  Package, FileText, Share2, Download
} from 'lucide-react'

interface Props {
  caso: {
    nombre: string
    categoria: string
    created_at: string
    estado: string
  }
  onClose: () => void
}

const CATEGORIA_EMOJI: Record<string, string> = {
  telefonia:  '📱',
  banca:      '🏦',
  energia:    '⚡',
  seguros:    '🛡️',
  transporte: '🚌',
  ecommerce:  '🛒',
  otro:       '📄',
}

const CATEGORIA_LABEL: Record<string, string> = {
  telefonia:  'Telefonía',
  banca:      'Banca',
  energia:    'Energía',
  seguros:    'Seguros',
  transporte: 'Transporte',
  ecommerce:  'E-commerce',
  otro:       'Consumo',
}

function calcularDias(fecha: string): number {
  const inicio = new Date(fecha)
  const ahora  = new Date()
  return Math.max(1, Math.floor(
    (ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
  ))
}

export function PostGeneratorModal({ caso, onClose }: Props) {
  const [copiado,   setCopiado]   = useState(false)
  const [plataforma, setPlataforma] = useState<'instagram' | 'facebook'>('instagram')

  const dias     = calcularDias(caso.created_at)
  const emoji    = CATEGORIA_EMOJI[caso.categoria]  ?? '📄'
  const sector   = CATEGORIA_LABEL[caso.categoria]  ?? 'Consumo'
  const nombre   = caso.nombre?.split(' ')[0] ?? 'Cliente' // solo primer nombre

  const copyIG = `🎉 ¡Caso resuelto en ${dias} día${dias !== 1 ? 's' : ''}!

${emoji} Sector: ${sector}
⏱️ Tiempo de gestión: ${dias} día${dias !== 1 ? 's' : ''}
✅ Estado: Resuelto

"${nombre} consiguió resolver su reclamación con IracheBot. Sin llamadas, sin esperas."

¿Tienes un problema sin resolver?
👉 Prueba IracheBot gratis — link en bio

#IracheBot #CasoResuelto #${sector.replace(/\s/g,'')} #Navarra #Reclamaciones`

  const copyFB = `✅ Otro caso resuelto gracias a IracheBot

${emoji} Sector: ${sector}
⏱️ Resuelto en ${dias} día${dias !== 1 ? 's' : ''}

Nuestro asistente con IA ayudó a gestionar una reclamación de ${sector.toLowerCase()} de principio a fin — sin burocracia, sin esperas.

¿Tienes una reclamación pendiente?
🔗 irachembot-frontend.vercel.app

Comparte para ayudar a quien lo necesite 👇
#IracheBot #Navarra #DerechosDelConsumidor #${sector.replace(/\s/g,'')}`

  const textoCopy = plataforma === 'instagram' ? copyIG : copyFB

  const copiar = async () => {
    await navigator.clipboard.writeText(textoCopy)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    // Overlay
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>

      {/* Modal */}
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d1117',
        border: '1px solid #21262d',
        borderRadius: '18px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid #21262d',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0d1117, #161b22)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Share2 size={15} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>
                Generar Post
              </p>
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

        {/* Stats del caso */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.5rem', padding: '1rem 1.4rem',
          borderBottom: '1px solid #21262d',
        }}>
          {[
            { label: 'Sector',   value: sector,              color: '#a5b4fc' },
            { label: 'Días',     value: `${dias}d`,          color: '#6ee7b7' },
            { label: 'Estado',   value: '✅ Resuelto',        color: '#6ee7b7' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#161b22', border: '1px solid #21262d',
              borderRadius: '10px', padding: '0.6rem 0.7rem', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: '#8b949e',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem',
                fontWeight: 700, color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Selector plataforma */}
        <div style={{
          display: 'flex', gap: '0.5rem',
          padding: '1rem 1.4rem 0.5rem',
        }}>
          {(['instagram', 'facebook'] as const).map(p => (
            <button key={p} onClick={() => setPlataforma(p)} style={{
              flex: 1,
              background: plataforma === p ? '#1e1b4b' : '#161b22',
              border: `1px solid ${plataforma === p ? '#4338ca' : '#21262d'}`,
              borderRadius: '8px', padding: '0.45rem',
              color: plataforma === p ? '#a5b4fc' : '#8b949e',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              transition: 'all 0.15s',
            }}>
              {p === 'instagram' ? '📸 Instagram' : '📘 Facebook'}
            </button>
          ))}
        </div>

        {/* Preview del post */}
        <div style={{ padding: '0.75rem 1.4rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.65rem',
            color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Preview
          </p>
          <div style={{
            background: '#161b22', border: '1px solid #21262d',
            borderRadius: '10px', padding: '0.9rem',
            maxHeight: '200px', overflowY: 'auto',
            scrollbarWidth: 'thin', scrollbarColor: '#21262d transparent',
          }}>
            <pre style={{
              margin: 0, fontSize: '0.78rem', color: '#e6edf3',
              lineHeight: 1.65, whiteSpace: 'pre-wrap',
              fontFamily: 'system-ui, sans-serif',
            }}>
              {textoCopy}
            </pre>
          </div>
        </div>

        {/* Botones acción */}
        <div style={{
          display: 'flex', gap: '0.5rem',
          padding: '0.75rem 1.4rem 1.2rem',
        }}>
          <button onClick={copiar} style={{
            flex: 1,
            background: copiado ? '#022c22' : '#1e1b4b',
            border: `1px solid ${copiado ? '#065f46' : '#4338ca'}`,
            borderRadius: '10px', padding: '0.65rem',
            color: copiado ? '#6ee7b7' : '#a5b4fc',
            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '0.45rem',
            transition: 'all 0.2s',
          }}>
            {copiado
              ? <><CheckCircle2 size={14} /> ¡Copiado!</>
              : <><Copy size={14} /> Copiar texto</>
            }
          </button>
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
