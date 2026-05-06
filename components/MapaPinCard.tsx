'use client'

import { X, ExternalLink, Clock, DollarSign } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface LugarMapa {
  id:       number
  nombre:   string
  tipo:     'playa' | 'gastronomia' | 'cultura' | 'alojamiento' | 'nocturno' | 'transporte' | 'otro'
  dia:      string   // "Día 1", "Día 2", "General"
  hora:     string   // "Mañana", "09:00", etc.
  precio:   string   // "Gratis", "15-25€", etc.
  lat?:     number
  lng?:     number
  geocoded: boolean
}

// ── Config de colores y emojis por tipo ──────────────────────────────────────
export const TIPO_CONFIG: Record<LugarMapa['tipo'], { color: string; emoji: string; label: string }> = {
  playa:       { color: '#3b82f6', emoji: '🏖️', label: 'Playa / Naturaleza'  },
  gastronomia: { color: '#f59e0b', emoji: '🍽️', label: 'Gastronomía / Bares' },
  cultura:     { color: '#8b5cf6', emoji: '🏛️', label: 'Cultura / Museos'    },
  alojamiento: { color: '#10b981', emoji: '🏨', label: 'Alojamiento'          },
  nocturno:    { color: '#ef4444', emoji: '🎵', label: 'Ocio nocturno'        },
  transporte:  { color: '#64748b', emoji: '🚌', label: 'Transporte'           },
  otro:        { color: '#94a3b8', emoji: '📍', label: 'Lugar de interés'     },
}

// ── Componente ────────────────────────────────────────────────────────────────
interface MapaPinCardProps {
  lugar:    LugarMapa
  onCerrar: () => void
}

export default function MapaPinCard({ lugar, onCerrar }: MapaPinCardProps) {
  const cfg = TIPO_CONFIG[lugar.tipo]

  const abrirEnMaps = () => {
    const query = encodeURIComponent(lugar.nombre)
    if (lugar.lat && lugar.lng) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`,
        '_blank'
      )
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        '_blank'
      )
    }
  }

  return (
    <>
      <style>{`
        @keyframes card-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <div style={{
        position:      'absolute',
        bottom:        '12px',
        left:          '12px',
        right:         '12px',
        zIndex:        1000,
        background:    'rgba(8,12,24,0.97)',
        border:        `1px solid ${cfg.color}44`,
        borderRadius:  '16px',
        padding:       '14px 16px',
        backdropFilter:'blur(20px)',
        boxShadow:     `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${cfg.color}22`,
        animation:     'card-slide-up .25s ease both',
      }}>

        {/* Fila superior: tipo badge + cerrar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            background:   `${cfg.color}18`,
            border:       `1px solid ${cfg.color}33`,
            borderRadius: '20px',
            padding:      '3px 10px',
          }}>
            <span style={{ fontSize: '12px' }}>{cfg.emoji}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, letterSpacing: '.04em' }}>
              {cfg.label.toUpperCase()}
            </span>
          </div>

          <button
            onClick={onCerrar}
            style={{
              background:   'rgba(30,41,59,0.6)',
              border:       '1px solid rgba(51,65,85,0.4)',
              borderRadius: '8px',
              width:        '26px',
              height:       '26px',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              cursor:       'pointer',
              color:        '#475569',
              transition:   'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.8)'; e.currentTarget.style.color = '#94a3b8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#475569' }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Nombre del lugar */}
        <p style={{
          margin:     '0 0 10px',
          fontSize:   '14px',
          fontWeight: 700,
          color:      '#f1f5f9',
          lineHeight: 1.3,
        }}>
          {lugar.nombre}
        </p>

        {/* Metadatos: día, hora, precio */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {lugar.dia && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#475569' }}>📅</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{lugar.dia}</span>
            </div>
          )}
          {lugar.hora && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} color="#475569" />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{lugar.hora}</span>
            </div>
          )}
          {lugar.precio && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={10} color="#475569" />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{lugar.precio}</span>
            </div>
          )}
        </div>

        {/* Botón Google Maps */}
        <button
          onClick={abrirEnMaps}
          style={{
            width:          '100%',
            background:     'linear-gradient(135deg,#059669,#10b981)',
            border:         'none',
            borderRadius:   '10px',
            padding:        '9px 14px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '6px',
            cursor:         'pointer',
            fontSize:       '12px',
            fontWeight:     700,
            color:          'white',
            boxShadow:      '0 4px 12px rgba(5,150,105,0.35)',
            transition:     'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(5,150,105,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,150,105,0.35)' }}
        >
          <ExternalLink size={13} />
          Abrir en Google Maps
        </button>
      </div>
    </>
  )
}
