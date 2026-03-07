// frontend/app/stats/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, CheckCircle, Clock, AlertTriangle, BarChart3, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StatsPublicas {
  total:           number
  por_estado:      Record<string, number>
  por_categoria:   Record<string, number>
  por_urgencia:    Record<string, number>
  ultimos_30_dias: number
  tasa_resolucion: number
}

const CATEGORIA_EMOJI: Record<string, string> = {
  banca:      '🏦', telefonia: '📱', energia:    '⚡',
  transporte: '✈️', seguros:   '🛡️', ecommerce:  '📦',
  musica:     '🎵', arte:      '🎨', turismo:    '🏨', otro: '📋',
}

const ESTADO_COLOR: Record<string, string> = {
  abierto:    '#6366f1',
  en_proceso: '#f59e0b',
  resuelto:   '#22c55e',
  cerrado:    '#64748b',
}

export default function StatsPage() {
  const router = useRouter()
  const [stats,   setStats]   = useState<StatsPublicas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats/publicas`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError('No se pudieron cargar las estadísticas'); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#060b18', color: '#6366f1', fontSize: '1rem',
    }}>
      ⏳ Cargando estadísticas...
    </div>
  )

  if (error || !stats) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#060b18', color: '#ef4444',
    }}>
      ❌ {error}
    </div>
  )

  const topCategorias = Object.entries(stats.por_categoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 60%, #0d0820 100%)',
      fontFamily: 'system-ui, sans-serif', color: '#f1f5f9',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(79,70,229,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '100px', padding: '6px 16px',
            marginBottom: '1rem', fontSize: '0.78rem',
            color: '#a5b4fc', fontWeight: 600,
          }}>
            📊 ESTADÍSTICAS PÚBLICAS · TIEMPO REAL
          </div>
          <h1 style={{
            fontSize: '2.2rem', fontWeight: 900,
            margin: '0 0 0.5rem', letterSpacing: '-0.03em',
          }}>
            Panel de <span style={{
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Transparencia</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem' }}>
            Datos agregados del Servicio de Consumo de Navarra · Sin datos personales
          </p>
        </div>

        {/* KPIs principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem', marginBottom: '2rem',
        }}>
          {[
            { Icon: Users,        color: '#6366f1', value: stats.total,             label: 'Total casos',         suffix: '' },
            { Icon: CheckCircle,  color: '#22c55e', value: stats.tasa_resolucion,   label: 'Tasa resolución',     suffix: '%' },
            { Icon: Clock,        color: '#f59e0b', value: stats.ultimos_30_dias,   label: 'Últimos 30 días',     suffix: '' },
            { Icon: TrendingUp,   color: '#a78bfa', value: stats.por_estado?.resuelto || 0, label: 'Resueltos', suffix: '' },
          ].map(({ Icon, color, value, label, suffix }) => (
            <div key={label} style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(30,41,59,0.9)',
              borderRadius: '18px', padding: '1.5rem',
              backdropFilter: 'blur(12px)', textAlign: 'center',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '13px',
                background: `${color}18`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem',
              }}>
                <Icon size={20} color={color} />
              </div>
              <p style={{
                margin: '0 0 0.25rem', fontSize: '1.8rem',
                fontWeight: 800, letterSpacing: '-0.03em',
              }}>
                {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
              </p>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.8rem' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Estados + Categorías */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '1rem', marginBottom: '2rem',
        }}>

          {/* Por estado */}
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(30,41,59,0.9)',
            borderRadius: '18px', padding: '1.5rem',
            backdropFilter: 'blur(12px)',
          }}>
            <h3 style={{
              margin: '0 0 1.25rem', fontSize: '0.9rem',
              fontWeight: 700, color: '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <AlertTriangle size={16} color="#f59e0b" /> Estado de casos
            </h3>
            {Object.entries(stats.por_estado).map(([estado, count]) => {
              const pct = stats.total > 0 ? Math.round(count / stats.total * 100) : 0
              const color = ESTADO_COLOR[estado] || '#64748b'
              return (
                <div key={estado} style={{ marginBottom: '0.85rem' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '4px', fontSize: '0.82rem',
                  }}>
                    <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>
                      {estado.replace('_', ' ')}
                    </span>
                    <span style={{ color, fontWeight: 700 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{
                    height: '6px', borderRadius: '100px',
                    background: 'rgba(30,41,59,0.8)',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '100px',
                      width: `${pct}%`, background: color,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Por categoría */}
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(30,41,59,0.9)',
            borderRadius: '18px', padding: '1.5rem',
            backdropFilter: 'blur(12px)',
          }}>
            <h3 style={{
              margin: '0 0 1.25rem', fontSize: '0.9rem',
              fontWeight: 700, color: '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <BarChart3 size={16} color="#6366f1" /> Top sectores
            </h3>
            {topCategorias.map(([cat, count]) => {
              const pct = stats.total > 0 ? Math.round(count / stats.total * 100) : 0
              return (
                <div key={cat} style={{
                  display: 'flex', alignItems: 'center',
                  gap: '10px', marginBottom: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.1rem', width: '24px' }}>
                    {CATEGORIA_EMOJI[cat] || '📋'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '0.8rem', marginBottom: '3px',
                    }}>
                      <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>
                        {cat}
                      </span>
                      <span style={{ color: '#6366f1', fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{
                      height: '5px', borderRadius: '100px',
                      background: 'rgba(30,41,59,0.8)',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '100px',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                      }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer del panel */}
        <div style={{
          textAlign: 'center', padding: '1.5rem',
          display: 'flex', gap: '1rem',
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px', padding: '0.7rem 1.5rem',
              color: '#a5b4fc', fontSize: '0.85rem',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            ← Volver al inicio
          </button>
          <button
            onClick={() => router.push('/chat')}
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              border: 'none', borderRadius: '12px',
              padding: '0.7rem 1.5rem', color: 'white',
              fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Hacer una reclamación →
          </button>
        </div>

      </div>
    </div>
  )
}
