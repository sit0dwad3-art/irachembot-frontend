// frontend/components/RealtimeAlerta.tsx
'use client'
import { useEffect, useState } from 'react'

type Props = {
  alerta: {
    type: 'INSERT' | 'UPDATE' | 'DELETE'
    reclamacion: { nombre?: string; urgencia?: string; categoria?: string }
    timestamp: Date
  } | null
}

const CONFIG = {
  INSERT: {
    emoji: '🔔',
    titulo: 'Nueva reclamación',
    bg:     '#0c1a2e',
    border: '#1d4ed8',
    accent: '#60a5fa',
    dot:    '#3b82f6',
  },
  UPDATE: {
    emoji: '✏️',
    titulo: 'Caso actualizado',
    bg:     '#1c1407',
    border: '#b45309',
    accent: '#fbbf24',
    dot:    '#f59e0b',
  },
  DELETE: {
    emoji: '🗑️',
    titulo: 'Reclamación eliminada',
    bg:     '#1c0a0a',
    border: '#b91c1c',
    accent: '#f87171',
    dot:    '#ef4444',
  },
}

const URGENCIA_COLOR: Record<string, string> = {
  alta:   '#f87171',
  media:  '#fbbf24',
  normal: '#60a5fa',
  baja:   '#94a3b8',
}

export function RealtimeAlerta({ alerta }: Props) {
  const [visible,  setVisible]  = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    if (!alerta) return
    setSaliendo(false)
    setVisible(true)

    const salir  = setTimeout(() => setSaliendo(true),  3200)
    const ocultar = setTimeout(() => setVisible(false), 3800)
    return () => { clearTimeout(salir); clearTimeout(ocultar) }
  }, [alerta])

  if (!visible || !alerta) return null

  const cfg = CONFIG[alerta.type]
  const urgColor = URGENCIA_COLOR[alerta.reclamacion?.urgencia ?? 'normal'] ?? '#60a5fa'

  return (
    <div style={{
      position:  'fixed',
      top:       '1rem',
      right:     '1rem',
      zIndex:    9999,
      width:     '300px',
      background: cfg.bg,
      border:    `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.border}`,
      borderRadius: '12px',
      padding:   '0.9rem 1rem',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}22`,
      animation: saliendo
        ? 'alertaOut 0.5s cubic-bezier(0.4,0,1,1) forwards'
        : 'alertaIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
    }}>

      {/* Barra de progreso */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', borderRadius: '12px 12px 0 0',
        background: `${cfg.border}33`,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: cfg.border,
          animation: 'alertaProgress 3.2s linear forwards',
        }} />
      </div>

      {/* Contenido */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>

        {/* Icono */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
          background: `${cfg.border}20`,
          border: `1px solid ${cfg.border}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}>
          {cfg.emoji}
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: cfg.dot, flexShrink: 0,
              boxShadow: `0 0 6px ${cfg.dot}`,
            }} />
            <p style={{
              margin: 0, fontSize: '0.8rem', fontWeight: 700,
              color: cfg.accent, letterSpacing: '-0.01em',
            }}>
              {cfg.titulo}
            </p>
          </div>

          {alerta.reclamacion?.nombre && (
            <p style={{
              margin: '0 0 0.18rem', fontSize: '0.78rem',
              color: '#e2e8f0', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              👤 {alerta.reclamacion.nombre}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
            {alerta.reclamacion?.categoria && (
              <span style={{
                fontSize: '0.68rem', color: '#94a3b8',
                background: '#1e293b', border: '1px solid #334155',
                borderRadius: '4px', padding: '0.1rem 0.45rem',
              }}>
                📂 {alerta.reclamacion.categoria}
              </span>
            )}
            {alerta.reclamacion?.urgencia && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700,
                color: urgColor,
                background: `${urgColor}15`,
                border: `1px solid ${urgColor}30`,
                borderRadius: '4px', padding: '0.1rem 0.45rem',
              }}>
                ⚡ {alerta.reclamacion.urgencia}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes alertaIn {
          from { opacity: 0; transform: translateX(110%) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
        @keyframes alertaOut {
          from { opacity: 1; transform: translateX(0)   scale(1);    }
          to   { opacity: 0; transform: translateX(110%) scale(0.92); }
        }
        @keyframes alertaProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  )
}
