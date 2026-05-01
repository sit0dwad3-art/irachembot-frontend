'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtime }     from '@/hooks/useRealtime'
import { RealtimeAlerta }  from '@/components/RealtimeAlerta'
import {
  BarChart3, Clock, AlertTriangle, CheckCircle2,
  Smartphone, Landmark, Zap, Shield, Bus, FileText,
  RefreshCw, Loader2, Settings, Lock, Eye, EyeOff,
  Calendar, ChevronRight, Inbox, X, NotebookPen,
  CircleDot, CircleCheck, Circle, Plus, TrendingUp,
  Filter, Bell, Activity, MessageSquare, User,
  Hash, LogOut, ShieldCheck, Package, Music,
  Palette, Hotel, BarChart2
} from 'lucide-react'

// ══════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════
export interface Reclamacion {
  id: string
  nombre: string
  email: string
  telefono?: string
  dni?: string
  categoria: string
  urgencia: string
  estado: string
  mensaje_original: string
  created_at: string
  notas_admin?: string
}

interface NotaInterna {
  id: string
  created_at: string
  contenido: string
  autor: string
  reclamacion_id: string
}

interface Stats {
  total: number
  pendientes: number
  urgentes: number
  resueltos: number
}

interface StatsPublicas {
  total: number
  por_estado: Record<string, number>
  por_categoria: Record<string, number>
  tasa_resolucion: number
  ultimos_30_dias: number
}

// ══════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend-production.up.railway.app'}`

const ESTADOS = ['pendiente', 'en_proceso', 'resuelto', 'cerrado'] as const

const ESTADO_CONFIG: Record<string, {
  color: string; bg: string; border: string
  Icon: React.ElementType; label: string
}> = {
  pendiente:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  Icon: Clock,        label: 'Pendiente'  },
  en_proceso: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  Icon: Settings,     label: 'En proceso' },
  resuelto:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  Icon: CheckCircle2, label: 'Resuelto'   },
  cerrado:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', Icon: Lock,         label: 'Cerrado'    },
}

const URGENCIA_CONFIG: Record<string, { color: string; Icon: React.ElementType; label: string }> = {
  alta:   { color: '#f87171', Icon: CircleDot, label: 'Alta'   },
  media:  { color: '#fbbf24', Icon: CircleDot, label: 'Media'  },
  normal: { color: '#60a5fa', Icon: Circle,    label: 'Normal' },
  baja:   { color: '#94a3b8', Icon: Circle,    label: 'Baja'   },
}

const CATEGORIA_CONFIG: Record<string, { Icon: React.ElementType; label: string; color: string }> = {
  telefonia:  { Icon: Smartphone, label: 'Telefonía',  color: '#a855f7' },
  banca:      { Icon: Landmark,   label: 'Banca',      color: '#3b82f6' },
  energia:    { Icon: Zap,        label: 'Energía',    color: '#f97316' },
  seguros:    { Icon: Shield,     label: 'Seguros',    color: '#ef4444' },
  transporte: { Icon: Bus,        label: 'Transporte', color: '#22c55e' },
  ecommerce:  { Icon: Package,    label: 'E-commerce', color: '#0891b2' },
  musica:     { Icon: Music,      label: 'Música',     color: '#db2777' },
  arte:       { Icon: Palette,    label: 'Arte',       color: '#9333ea' },
  turismo:    { Icon: Hotel,      label: 'Turismo',    color: '#16a34a' },
  otro:       { Icon: FileText,   label: 'Otro',       color: '#64748b' },
}

const KPI_CONFIG = [
  { key: 'total',      label: 'Total casos',  Icon: BarChart3,     color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)'  },
  { key: 'pendientes', label: 'Pendientes',   Icon: Clock,         color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'  },
  { key: 'urgentes',   label: 'Urgentes',     Icon: AlertTriangle, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  { key: 'resueltos',  label: 'Resueltos',    Icon: CheckCircle2,  color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
]

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function getAuthHeaders(): Record<string, string> {
  const token = document.cookie
    .split('; ')
    .find(r => r.startsWith('admin_session='))
    ?.split('=')[1] ?? ''
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function formatFecha(f: string, full = false) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-ES', full
    ? { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  )
}

function maskData(value: string | undefined, type: 'email' | 'phone' | 'dni'): string {
  if (!value) return '—'
  if (type === 'email') {
    const [user, domain] = value.split('@')
    return `${user.slice(0, 2)}***@${domain}`
  }
  if (type === 'phone') return value.slice(0, 3) + '****' + value.slice(-2)
  if (type === 'dni')   return '***' + value.slice(-3)
  return value
}

// ══════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════

function Sparkline({ color, values }: { color: string; values?: number[] }) {
  const pts = values ?? [3, 7, 4, 9, 6, 11, 8, 13, 10, 15]
  const max = Math.max(...pts)
  const w = 64, h = 26
  const coords = pts.map((p, i) =>
    `${(i / (pts.length - 1)) * w},${h - (p / max) * (h - 2) - 1}`
  )
  return (
    <svg width={w} height={h} style={{ opacity: 0.55, flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={coords.join(' ')}
        fill="none" stroke={color}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: '20px', padding: '0.22rem 0.7rem',
      fontSize: '0.72rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '0.32rem',
      whiteSpace: 'nowrap',
    }}>
      <cfg.Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}

function CategoriaBadge({ categoria }: { categoria: string }) {
  const cat = CATEGORIA_CONFIG[categoria] ?? CATEGORIA_CONFIG.otro
  return (
    <span style={{
      background: `${cat.color}14`,
      border: `1px solid ${cat.color}28`,
      borderRadius: '6px', padding: '0.18rem 0.55rem',
      fontSize: '0.74rem', color: cat.color,
      display: 'inline-flex', alignItems: 'center', gap: '0.32rem',
      whiteSpace: 'nowrap',
    }}>
      <cat.Icon size={10} strokeWidth={2.5} />
      {cat.label}
    </span>
  )
}

// ── Barra de progreso mini ─────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '5px', borderRadius: '100px',
        background: 'rgba(30,41,59,0.8)',
      }}>
        <div style={{
          height: '100%', borderRadius: '100px',
          width: `${pct}%`, background: color,
          transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.7rem', color, fontWeight: 700, minWidth: '30px' }}>
        {pct}%
      </span>
    </div>
  )
}

// ── Nota del tracker ───────────────────────────────────
function NotaItem({ nota, isLast }: { nota: NotaInterna; isLast: boolean }) {
  const fecha = new Date(nota.created_at)
  const hoy   = new Date()
  const esHoy = fecha.toDateString() === hoy.toDateString()
  const fechaStr = esHoy
    ? `Hoy · ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', gap: '0.7rem', position: 'relative' }}>
      {!isLast && (
        <div style={{
          position: 'absolute', left: '7px', top: '20px',
          width: '2px', height: 'calc(100% + 4px)',
          background: 'linear-gradient(to bottom, rgba(99,102,241,0.25), transparent)',
        }} />
      )}
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
        marginTop: '3px', zIndex: 1,
        background: isLast ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.12)',
        border: `2px solid ${isLast ? '#34d399' : '#6366f1'}`,
        boxShadow: isLast ? '0 0 8px rgba(52,211,153,0.35)' : 'none',
      }} />
      <div style={{ flex: 1, paddingBottom: isLast ? '0.25rem' : '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.67rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Calendar size={9} /> {fechaStr}
          </span>
          <span style={{
            fontSize: '0.62rem', fontWeight: 600,
            background: isLast ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)',
            color: isLast ? '#34d399' : '#818cf8',
            borderRadius: '4px', padding: '0.08rem 0.4rem',
          }}>
            {nota.autor}
          </span>
          {isLast && (
            <span style={{
              fontSize: '0.6rem', color: '#34d399',
              background: 'rgba(52,211,153,0.07)',
              borderRadius: '4px', padding: '0.08rem 0.35rem',
            }}>
              ● Última
            </span>
          )}
        </div>
        <p style={{
          margin: 0, fontSize: '0.81rem', color: '#cbd5e1',
          lineHeight: 1.55, background: 'rgba(15,23,42,0.45)',
          borderRadius: '6px', padding: '0.45rem 0.6rem',
          borderLeft: `2px solid ${isLast ? '#34d39940' : '#6366f125'}`,
        }}>
          {nota.contenido}
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PANEL DETALLE
// ══════════════════════════════════════════════════════════
function PanelDetalle({
  caso, onClose, onEstadoChange, actualizando, isModal = false,
}: {
  caso: Reclamacion
  onClose: () => void
  onEstadoChange: (id: string, estado: string) => void
  actualizando: boolean
  isModal?: boolean
}) {
  const [notas,         setNotas]         = useState('')
  const [historial,     setHistorial]     = useState<NotaInterna[]>([])
  const [cargandoNotas, setCargandoNotas] = useState(false)
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [notaGuardada,  setNotaGuardada]  = useState(false)
  const [tabActiva,     setTabActiva]     = useState<'detalle' | 'notas' | 'datos'>('detalle')
  const [revelarDatos,  setRevelarDatos]  = useState(false)
  const historialRef = useRef<HTMLDivElement>(null)

  const cfg = ESTADO_CONFIG[caso.estado]  ?? ESTADO_CONFIG.pendiente
  const cat = CATEGORIA_CONFIG[caso.categoria] ?? CATEGORIA_CONFIG.otro

  useEffect(() => { cargarHistorial() }, [caso.id])
  useEffect(() => {
    if (historialRef.current)
      historialRef.current.scrollTop = historialRef.current.scrollHeight
  }, [historial])

  const cargarHistorial = async () => {
    setCargandoNotas(true)
    try {
      const res  = await fetch(`${API_BASE}/admin/reclamaciones/${caso.id}/notas`, { headers: getAuthHeaders() })
      const data = await res.json()
      setHistorial(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setCargandoNotas(false) }
  }

  const guardarNota = async () => {
    if (!notas.trim() || guardandoNota) return
    setGuardandoNota(true)
    try {
      await fetch(`${API_BASE}/admin/reclamaciones/${caso.id}/notas`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ contenido: notas.trim(), autor: 'Admin' }),
      })
      setNotas('')
      setNotaGuardada(true)
      setTimeout(() => setNotaGuardada(false), 2500)
      await cargarHistorial()
    } catch (e) { console.error(e) }
    finally { setGuardandoNota(false) }
  }

  const tabs = [
    { key: 'detalle', label: 'Detalle',  Icon: FileText      },
    { key: 'notas',   label: `Notas${historial.length > 0 ? ` (${historial.length})` : ''}`, Icon: NotebookPen },
    { key: 'datos',   label: 'Datos PII', Icon: ShieldCheck  },
  ] as const

  return (
    <div style={{
      background: 'rgba(8,13,26,0.98)',
      border: '1px solid rgba(99,102,241,0.22)',
      borderRadius: isModal ? '0' : '18px',
      backdropFilter: 'blur(24px)',
      position: isModal ? 'relative' : 'sticky',
      top: isModal ? 'auto' : '76px',
      overflow: 'hidden',
      boxShadow: isModal ? 'none' : '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
    }}>

      {/* Header */}
      <div style={{
        padding: '1.2rem 1.4rem 0',
        background: 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(30,41,59,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '11px',
              background: `linear-gradient(135deg, ${cat.color}28, ${cat.color}0a)`,
              border: `1px solid ${cat.color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <cat.Icon size={17} color={cat.color} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {caso.nombre || 'Sin nombre'}
              </h2>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#475569' }}>
                {maskData(caso.email, 'email')}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(30,41,59,0.7)', border: '1px solid #1e293b',
            borderRadius: '8px', width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#475569', cursor: 'pointer',
          }}>
            <X size={13} />
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          <EstadoBadge estado={caso.estado} />
          <CategoriaBadge categoria={caso.categoria} />
          <span style={{
            background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b',
            borderRadius: '6px', padding: '0.18rem 0.55rem',
            fontSize: '0.7rem', color: '#475569',
            display: 'inline-flex', alignItems: 'center', gap: '0.28rem',
          }}>
            <Hash size={9} />
            {caso.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTabActiva(key)} style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tabActiva === key ? '#6366f1' : 'transparent'}`,
              padding: '0.55rem 0.4rem',
              color: tabActiva === key ? '#a5b4fc' : '#475569',
              cursor: 'pointer', fontSize: '0.75rem',
              fontWeight: tabActiva === key ? 600 : 400,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.3rem',
              transition: 'all 0.2s',
            }}>
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '1.2rem 1.4rem' }}>

        {/* ── TAB DETALLE ── */}
        {tabActiva === 'detalle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

            {/* Grid metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
              {[
                { label: 'Fecha',    value: formatFecha(caso.created_at, true), Icon: Calendar     },
                { label: 'Urgencia', value: (URGENCIA_CONFIG[caso.urgencia] ?? URGENCIA_CONFIG.normal).label, Icon: AlertTriangle },
              ].map(({ label, value, Icon: Ic }) => (
                <div key={label} style={{
                  background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b',
                  borderRadius: '8px', padding: '0.55rem 0.7rem',
                }}>
                  <p style={{ margin: '0 0 0.18rem', fontSize: '0.63rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.22rem' }}>
                    <Ic size={9} /> {label}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Mensaje */}
            <div style={{
              background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b',
              borderRadius: '10px', padding: '0.9rem',
            }}>
              <p style={{ margin: '0 0 0.55rem', fontSize: '0.63rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.28rem' }}>
                <FileText size={9} /> Descripción del problema
              </p>
              <p style={{ margin: 0, fontSize: '0.845rem', lineHeight: 1.65, color: '#cbd5e1' }}>
                {caso.mensaje_original || 'Sin descripción'}
              </p>
            </div>

            {/* Cambiar estado */}
            <div>
              <p style={{ margin: '0 0 0.55rem', fontSize: '0.63rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cambiar estado
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.38rem' }}>
                {ESTADOS.map(e => {
                  const c = ESTADO_CONFIG[e]
                  const isActive = caso.estado === e
                  return (
                    <button key={e} onClick={() => onEstadoChange(caso.id, e)}
                      disabled={isActive || actualizando}
                      style={{
                        background: isActive ? c.bg : 'rgba(10,15,25,0.8)',
                        border: `1px solid ${isActive ? c.color + '55' : '#1e293b'}`,
                        borderRadius: '8px', padding: '0.5rem 0.45rem',
                        color: isActive ? c.color : '#334155',
                        cursor: isActive ? 'default' : 'pointer',
                        fontSize: '0.76rem', fontWeight: isActive ? 700 : 400,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.32rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {actualizando && !isActive
                        ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <c.Icon size={11} strokeWidth={2.5} />
                      }
                      {c.label}
                      {isActive && <CircleCheck size={10} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB NOTAS ── */}
        {tabActiva === 'notas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Activity size={12} color="#6366f1" />
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                  Historial de actividad
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {cargandoNotas && <Loader2 size={11} color="#6366f1" style={{ animation: 'spin 0.8s linear infinite' }} />}
                <span style={{
                  background: historial.length > 0 ? 'rgba(99,102,241,0.12)' : 'rgba(30,41,59,0.5)',
                  color: historial.length > 0 ? '#a5b4fc' : '#334155',
                  borderRadius: '20px', padding: '0.12rem 0.55rem',
                  fontSize: '0.68rem', fontWeight: 600,
                }}>
                  {historial.length} nota{historial.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {historial.length === 0 && !cargandoNotas ? (
              <div style={{
                padding: '1.75rem', textAlign: 'center',
                background: 'rgba(10,15,25,0.5)', borderRadius: '10px',
                border: '1px dashed #1e293b',
              }}>
                <NotebookPen size={22} color="#1e293b" style={{ marginBottom: '0.45rem' }} />
                <p style={{ margin: 0, color: '#334155', fontSize: '0.8rem' }}>Sin notas todavía</p>
                <p style={{ margin: '0.2rem 0 0', color: '#1e293b', fontSize: '0.72rem' }}>
                  Añade la primera nota de gestión
                </p>
              </div>
            ) : (
              <div ref={historialRef} style={{
                background: 'rgba(6,10,20,0.65)', border: '1px solid #1e293b',
                borderRadius: '10px', padding: '0.9rem 0.9rem 0.4rem',
                maxHeight: '240px', overflowY: 'auto',
                scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent',
              }}>
                {historial.map((nota, i) => (
                  <NotaItem key={nota.id} nota={nota} isLast={i === historial.length - 1} />
                ))}
              </div>
            )}

            {/* Input nota */}
            <div style={{
              background: 'rgba(10,15,25,0.7)',
              border: `1px solid ${notas.trim() ? 'rgba(99,102,241,0.32)' : '#1e293b'}`,
              borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); guardarNota() } }}
                placeholder="Nota de gestión... (Ctrl+Enter para guardar)"
                rows={3}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  padding: '0.7rem', color: '#f1f5f9', fontSize: '0.82rem',
                  resize: 'none', outline: 'none', boxSizing: 'border-box',
                  lineHeight: 1.55, fontFamily: 'system-ui, sans-serif',
                }}
              />
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.35rem 0.7rem', borderTop: '1px solid #1e293b',
                background: 'rgba(6,10,20,0.5)',
              }}>
                <span style={{ fontSize: '0.63rem', color: '#334155' }}>
                  {notas.length > 0 ? `${notas.length} caracteres` : 'Ctrl+Enter para guardar'}
                </span>
                <button onClick={guardarNota} disabled={guardandoNota || !notas.trim()} style={{
                  background: notaGuardada ? 'rgba(52,211,153,0.12)'
                    : notas.trim() ? 'rgba(99,102,241,0.18)' : 'rgba(30,41,59,0.3)',
                  border: `1px solid ${notaGuardada ? 'rgba(52,211,153,0.3)'
                    : notas.trim() ? 'rgba(99,102,241,0.3)' : '#1e293b'}`,
                  borderRadius: '6px', padding: '0.28rem 0.7rem',
                  color: notaGuardada ? '#34d399' : notas.trim() ? '#a5b4fc' : '#334155',
                  cursor: (guardandoNota || !notas.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '0.73rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  transition: 'all 0.2s',
                }}>
                  {guardandoNota
                    ? <><Loader2 size={10} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando</>
                    : notaGuardada
                      ? <><CircleCheck size={10} /> Guardado</>
                      : <><Plus size={10} /> Añadir</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB DATOS PII ── */}
        {tabActiva === 'datos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* Aviso seguridad */}
            <div style={{
              background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '10px', padding: '0.75rem 0.9rem',
              display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
            }}>
              <ShieldCheck size={14} color="#fbbf24" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 0.15rem', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                  Datos personales sensibles
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#92400e', lineHeight: 1.5 }}>
                  Acceso registrado. Solo para gestión interna del caso.
                </p>
              </div>
            </div>

            {/* Toggle revelar */}
            <button onClick={() => setRevelarDatos(!revelarDatos)} style={{
              background: revelarDatos ? 'rgba(248,113,113,0.08)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${revelarDatos ? 'rgba(248,113,113,0.25)' : 'rgba(99,102,241,0.25)'}`,
              borderRadius: '10px', padding: '0.65rem 1rem',
              color: revelarDatos ? '#f87171' : '#a5b4fc',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.2s', width: '100%', justifyContent: 'center',
            }}>
              {revelarDatos ? <><EyeOff size={14} /> Ocultar datos</> : <><Eye size={14} /> Revelar datos completos</>}
            </button>

            {/* Datos */}
            {[
              { label: 'Nombre completo', value: caso.nombre,   type: null       },
              { label: 'Email',           value: caso.email,    type: 'email'    },
              { label: 'Teléfono',        value: caso.telefono, type: 'phone'    },
              { label: 'DNI / NIF',       value: caso.dni,      type: 'dni'      },
            ].map(({ label, value, type }) => (
              <div key={label} style={{
                background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b',
                borderRadius: '8px', padding: '0.6rem 0.8rem',
              }}>
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.63rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </p>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#94a3b8', fontWeight: 500, fontFamily: 'monospace' }}>
                  {revelarDatos
                    ? (value || '—')
                    : (type ? maskData(value, type as 'email' | 'phone' | 'dni') : (value ? value.split(' ')[0] + ' ***' : '—'))
                  }
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PANEL ANALYTICS (sidebar derecho cuando no hay caso)
// ══════════════════════════════════════════════════════════
function PanelAnalytics({ stats, reclamaciones }: { stats: Stats; reclamaciones: Reclamacion[] }) {
  const topCategorias = Object.entries(
    reclamaciones.reduce((acc, r) => {
      acc[r.categoria] = (acc[r.categoria] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const porEstado = ESTADOS.map(e => ({
    estado: e,
    count: reclamaciones.filter(r => r.estado === e).length,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '76px' }}>

      {/* Distribución por estado */}
      <div style={{
        background: 'rgba(8,13,26,0.95)', border: '1px solid rgba(30,41,59,0.8)',
        borderRadius: '16px', padding: '1.25rem',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
          <BarChart2 size={14} color="#6366f1" />
          <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>
            Distribución por estado
          </h3>
        </div>
        {porEstado.map(({ estado, count }) => {
          const cfg = ESTADO_CONFIG[estado]
          return (
            <div key={estado} style={{ marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.76rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <cfg.Icon size={10} color={cfg.color} /> {cfg.label}
                </span>
                <span style={{ fontSize: '0.76rem', color: cfg.color, fontWeight: 700 }}>{count}</span>
              </div>
              <MiniBar value={count} max={stats.total} color={cfg.color} />
            </div>
          )
        })}
      </div>

      {/* Top categorías */}
      <div style={{
        background: 'rgba(8,13,26,0.95)', border: '1px solid rgba(30,41,59,0.8)',
        borderRadius: '16px', padding: '1.25rem',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
          <TrendingUp size={14} color="#a78bfa" />
          <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>
            Top sectores
          </h3>
        </div>
        {topCategorias.map(([cat, count]) => {
          const cfg = CATEGORIA_CONFIG[cat] ?? CATEGORIA_CONFIG.otro
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                background: `${cfg.color}14`, border: `1px solid ${cfg.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <cfg.Icon size={13} color={cfg.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>{cfg.label}</span>
                  <span style={{ fontSize: '0.76rem', color: cfg.color, fontWeight: 700 }}>{count}</span>
                </div>
                <MiniBar value={count} max={stats.total} color={cfg.color} />
              </div>
            </div>
          )
        })}
        {topCategorias.length === 0 && (
          <p style={{ margin: 0, color: '#334155', fontSize: '0.78rem', textAlign: 'center', padding: '1rem 0' }}>
            Sin datos todavía
          </p>
        )}
      </div>

      {/* Tasa resolución */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(99,102,241,0.05))',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: '16px', padding: '1.25rem',
        textAlign: 'center',
      }}>
        <CheckCircle2 size={22} color="#34d399" style={{ marginBottom: '0.5rem' }} />
        <p style={{ margin: '0 0 0.2rem', fontSize: '2rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.04em' }}>
          {stats.total > 0 ? Math.round((stats.resueltos / stats.total) * 100) : 0}%
        </p>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>Tasa de resolución</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function AdminPage() {
  const router = useRouter()
    // ── Responsive ──────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

const {
  reclamaciones: reclamacionesRT,
  conectado,
  nuevaAlerta,
  recargar,
} = useRealtime()
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([])
  const [stats,               setStats]               = useState<Stats>({ total: 0, pendientes: 0, urgentes: 0, resueltos: 0 })
  const [filtro,              setFiltro]              = useState('todos')
  const [seleccionada,        setSeleccionada]        = useState<Reclamacion | null>(null)
  const [cargando,            setCargando]            = useState(true)
  const [actualizando,        setActualizando]        = useState(false)
  const [busqueda,            setBusqueda]            = useState('')
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [notificacion,        setNotificacion]        = useState<string | null>(null)

  // ── Notificación toast ──────────────────────────────
  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg)
    setTimeout(() => setNotificacion(null), 3000)
  }

  // ── Logout ──────────────────────────────────────────
  const handleLogout = () => {
    document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/admin/login')
  }

  // ── Carga de datos ──────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      const headers = getAuthHeaders()
      const sRes = await fetch(`${API_BASE}/admin/estadisticas`, { headers })

      // Si el token expiró → redirigir al login
      if (sRes.status === 401 || sRes.status === 403) {
        router.push('/admin/login')
        return
      }

      const sData = await sRes.json()
      setStats({
        total:      sData.total      ?? 0,
        pendientes: sData.pendientes ?? 0,
        urgentes:   sData.urgentes   ?? 0,
        resueltos:  sData.resueltos  ?? 0,
      })
      setUltimaActualizacion(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [router])




useEffect(() => {
  setReclamaciones(reclamacionesRT)
  
  // Siempre actualizar stats, tenga o no datos
  const total      = reclamacionesRT.length
  const pendientes = reclamacionesRT.filter(r => r.estado === 'pendiente').length
  const urgentes   = reclamacionesRT.filter(r => r.urgencia === 'alta' || r.urgencia === 'urgente').length
  const resueltos  = reclamacionesRT.filter(r => r.estado === 'resuelto').length
  setStats({ total, pendientes, urgentes, resueltos })
  setUltimaActualizacion(new Date())
  setCargando(false)  // ← SIEMPRE, con o sin datos

}, [reclamacionesRT])

// cargarDatos sigue existiendo para el botón "Actualizar"
// pero ahora también llama a recargar del hook
const cargarDatosCompleto = useCallback(async () => {
  await recargar()
  // Mantener las estadísticas del backend (más precisas)
  try {
    const sRes  = await fetch(`${API_BASE}/admin/estadisticas`, { headers: getAuthHeaders() })
    if (sRes.ok) {
      const sData = await sRes.json()
      setStats({
        total:      sData.total      ?? 0,
        pendientes: sData.pendientes ?? 0,
        urgentes:   sData.urgentes   ?? 0,
        resueltos:  sData.resueltos  ?? 0,
      })
    }
  } catch (e) { console.error(e) }
}, [recargar])

  // ── Cambiar estado ──────────────────────────────────
  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setActualizando(true)
    try {
      const res = await fetch(`${API_BASE}/admin/reclamaciones/${id}/estado`, {
        method: 'PATCH', headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      await cargarDatosCompleto()
      if (seleccionada?.id === id)
        setSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado } : null)
      mostrarNotificacion(`Estado actualizado → ${ESTADO_CONFIG[nuevoEstado]?.label}`)
    } catch (e) {
      mostrarNotificacion('❌ Error al actualizar el estado')
    } finally {
      setActualizando(false)
    }
  }

  // ── Filtrado ────────────────────────────────────────
  const recFiltradas = reclamaciones.filter(r => {
    const matchFiltro   = filtro === 'todos' || r.estado === filtro
    const matchBusqueda = !busqueda ||
      r.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.id?.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 60%, #0d0820 100%)',
      fontFamily: 'system-ui, sans-serif', color: '#f1f5f9',
    }}>
      {/* ── ALERTA REALTIME ── */}
      <RealtimeAlerta alerta={nuevaAlerta} />

      {/* ── TOAST ── */}
      {notificacion && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px', padding: '0.85rem 1.25rem',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          fontSize: '0.85rem', color: '#e2e8f0',
          animation: 'slideUp 0.3s ease',
        }}>
          <CheckCircle2 size={16} color="#34d399" />
          {notificacion}
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{
        background: 'rgba(4,8,20,0.98)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        padding: '0 1rem',
        height: isMobile ? 'auto' : '60px',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backdropFilter: 'blur(24px)',
        position: 'sticky', top: 0, zIndex: 100,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        paddingTop:    isMobile ? '0.6rem' : '0',
        paddingBottom: isMobile ? '0.6rem' : '0',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              IracheBot <span style={{ color: '#6366f1' }}>Admin</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.58rem', color: '#334155' }}>
              Panel de Gestión · Navarra
            </p>
          </div>
        </div>

        <div style={{ width: '1px', height: '22px', background: '#1e293b', flexShrink: 0 }} />

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: conectado ? '#34d399' : '#f87171',
            boxShadow: conectado ? '0 0 6px rgba(52,211,153,0.6)' : '0 0 6px rgba(248,113,113,0.6)',
            animation: conectado ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: '0.68rem', color: conectado ? '#334155' : '#f87171' }}>
            {conectado
              ? ultimaActualizacion
                ? `RT · ${ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                : 'Tiempo real'
              : 'Reconectando...'}
          </span>
        </div>

        {/* Spacer — solo desktop */}
        {!isMobile && <div style={{ flex: 1 }} />}

        {/* Buscador — ocupa línea completa en móvil */}
        <div style={{
          position: 'relative',
          width: isMobile ? '100%' : 'auto',
          order: isMobile ? 10 : 0,   // va al final en móvil
        }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar nombre, email, ID..."
            style={{
              background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b',
              borderRadius: '8px', padding: '0.42rem 0.9rem 0.42rem 2.1rem',
              color: '#f1f5f9', fontSize: '0.8rem',
              width: isMobile ? '100%' : '220px',
              outline: 'none', transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
            onBlur={e  => e.currentTarget.style.borderColor = '#1e293b'}
          />
          <Filter size={12} color="#334155" style={{
            position: 'absolute', left: '0.65rem', top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none',
          }} />
        </div>

        {/* Botones — se agrupan en móvil */}
        <div style={{
          display: 'flex', gap: '0.4rem',
          marginLeft: isMobile ? '0' : '0',
          flexShrink: 0,
        }}>
          <button onClick={cargarDatosCompleto} disabled={cargando} style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: '8px', padding: '0.42rem 0.7rem', color: '#6366f1',
            cursor: 'pointer', fontSize: '0.78rem',
            display: 'flex', alignItems: 'center', gap: '0.38rem',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>
            {cargando
              ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <RefreshCw size={12} />
            }
            {!isMobile && 'Actualizar'}
          </button>

          {!isMobile && (
            <button onClick={() => router.push('/stats')} style={{
              background: 'transparent', border: '1px solid #1e293b',
              borderRadius: '8px', padding: '0.42rem 0.8rem',
              color: '#475569', cursor: 'pointer', fontSize: '0.78rem',
              display: 'flex', alignItems: 'center', gap: '0.38rem',
              transition: 'color 0.2s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              <BarChart3 size={12} /> Stats públicas
            </button>
          )}

          <button onClick={handleLogout} style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '8px', padding: '0.42rem 0.7rem',
            color: '#f87171', cursor: 'pointer', fontSize: '0.78rem',
            display: 'flex', alignItems: 'center', gap: '0.38rem',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>
            <LogOut size={12} />
            {!isMobile && 'Salir'}
          </button>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── KPI CARDS ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile
          ? 'repeat(2, 1fr)'
          : 'repeat(4, 1fr)',
          gap: '1rem', marginBottom: '1.5rem',
        }}>
          {KPI_CONFIG.map(({ key, label, Icon, color, bg, border }) => (
            <div key={key} style={{
              background: bg, border: `1px solid ${border}`,
              borderRadius: '16px', padding: '1.2rem 1.4rem',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(12px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.3)`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: `${color}18`, border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={19} color={color} strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {cargando ? '—' : stats[key as keyof Stats]}
                  </p>
                  <p style={{ margin: '0.18rem 0 0', fontSize: '0.73rem', color: '#475569' }}>
                    {label}
                  </p>
                </div>
              </div>
              <Sparkline color={color} />
            </div>
          ))}
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : (seleccionada ? '1fr 370px' : '1fr 300px'),
          gap: '1.25rem',
          alignItems: 'start',
        }}>

          {/* ── TABLA ── */}
          <div style={{
            background: 'rgba(8,13,26,0.9)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(12px)',
          }}>

            {/* Filtros */}
            <div style={{
              padding: '0.8rem 1.4rem',
              borderBottom: '1px solid rgba(30,41,59,0.7)',
              display: 'flex', gap: '0.38rem', alignItems: 'center', flexWrap: 'wrap',
            }}>
              <span style={{ color: '#334155', fontSize: '0.72rem', marginRight: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.28rem' }}>
                <Filter size={10} /> Filtrar:
              </span>
              {['todos', ...ESTADOS].map(e => {
                const cfg = ESTADO_CONFIG[e]
                const isActive = filtro === e
                const activeColor = e === 'todos' ? '#6366f1' : cfg?.color
                return (
                  <button key={e} onClick={() => setFiltro(e)} style={{
                    background: isActive ? `${activeColor}15` : 'transparent',
                    border: `1px solid ${isActive ? activeColor + '45' : '#1e293b'}`,
                    borderRadius: '20px', padding: '0.22rem 0.7rem',
                    color: isActive ? activeColor : '#334155',
                    cursor: 'pointer', fontSize: '0.73rem',
                    fontWeight: isActive ? 600 : 400,
                    display: 'flex', alignItems: 'center', gap: '0.28rem',
                    transition: 'all 0.15s',
                  }}>
                    {e === 'todos'
                      ? <><BarChart3 size={10} /> Todos</>
                      : <><cfg.Icon size={10} /> {cfg.label}</>
                    }
                  </button>
                )
              })}
              <span style={{ marginLeft: 'auto', color: '#334155', fontSize: '0.7rem', display: 'flex',               alignItems: 'center', gap: '0.28rem' }}>
                <Hash size={10} />
                {recFiltradas.length} resultado{recFiltradas.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading bar */}
            {(cargando || actualizando) && (
              <div style={{
                padding: '0.38rem 1.4rem',
                background: 'rgba(99,102,241,0.05)',
                borderBottom: '1px solid rgba(99,102,241,0.1)',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
              }}>
                <Loader2 size={11} color="#6366f1" style={{ animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#6366f1', fontSize: '0.73rem' }}>
                  {actualizando ? 'Guardando cambios...' : 'Cargando datos...'}
                </span>
              </div>
            )}

            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.7)' }}>
                    {['Fecha', 'Nombre', 'Categoría', 'Urgencia', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{
                        padding: '0.7rem 1.2rem', textAlign: 'left',
                        fontSize: '0.65rem', color: '#334155', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                          <Inbox size={30} color="#1e293b" />
                          <span style={{ color: '#1e293b', fontSize: '0.85rem' }}>
                            {cargando ? 'Cargando reclamaciones...' : 'No hay reclamaciones'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : recFiltradas.map(r => {
                    const urg        = URGENCIA_CONFIG[r.urgencia] ?? URGENCIA_CONFIG.normal
                    const isSelected = seleccionada?.id === r.id
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSeleccionada(isSelected ? null : r)}
                        style={{
                          borderBottom: '1px solid rgba(30,41,59,0.45)',
                          background: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent',
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected)
                            (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(99,102,241,0.03)'
                        }}
                        onMouseLeave={e => {
                          if (!isSelected)
                            (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                        }}
                      >
                        {/* Fecha */}
                        <td style={{ padding: '0.85rem 1.2rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', color: '#475569', fontSize: '0.76rem' }}>
                            <Calendar size={11} />
                            {formatFecha(r.created_at)}
                          </div>
                        </td>

                        {/* Nombre */}
                        <td style={{ padding: '0.85rem 1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.48rem' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '8px',
                              background: 'rgba(99,102,241,0.08)',
                              border: '1px solid rgba(99,102,241,0.14)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <User size={13} color="#6366f1" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.845rem', whiteSpace: 'nowrap' }}>
                                {r.nombre || '—'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#334155' }}>
                                {maskData(r.email, 'email')}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td style={{ padding: '0.85rem 1.2rem' }}>
                          <CategoriaBadge categoria={r.categoria} />
                        </td>

                        {/* Urgencia */}
                        <td style={{ padding: '0.85rem 1.2rem' }}>
                          <span style={{
                            color: urg.color, fontSize: '0.8rem', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '0.32rem',
                            whiteSpace: 'nowrap',
                          }}>
                            <urg.Icon size={11} fill={urg.color} strokeWidth={0} />
                            {urg.label}
                          </span>
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '0.85rem 1.2rem' }}>
                          <EstadoBadge estado={r.estado} />
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: '0.85rem 1.2rem' }}>
                          <button
                            onClick={e => { e.stopPropagation(); setSeleccionada(isSelected ? null : r) }}
                            style={{
                              background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.07)',
                              border: `1px solid ${isSelected ? 'rgba(99,102,241,0.38)' : 'rgba(99,102,241,0.14)'}`,
                              borderRadius: '7px', padding: '0.28rem 0.7rem',
                              color: isSelected ? '#a5b4fc' : '#6366f1',
                              cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                              display: 'inline-flex', alignItems: 'center', gap: '0.28rem',
                              transition: 'all 0.15s', whiteSpace: 'nowrap',
                            }}
                          >
                            {isSelected
                              ? <><EyeOff size={11} /> Cerrar</>
                              : <><Eye    size={11} /> Ver</>
                            }
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer tabla */}
            {recFiltradas.length > 0 && (
              <div style={{
                padding: '0.65rem 1.4rem',
                borderTop: '1px solid rgba(30,41,59,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.7rem', color: '#334155' }}>
                  Mostrando {recFiltradas.length} de {reclamaciones.length} casos
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  color: conectado ? '#34d399' : '#f87171',
                  display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: conectado ? '#34d399' : '#f87171',
                    display: 'inline-block'
                  }}/>
                  {conectado ? 'Tiempo real activo' : 'Reconectando...'}
                </span>
              </div>
            )}
          </div>

          {/* ── PANEL DERECHO: Detalle o Analytics ── */}
          {isMobile ? (
            // ── MÓVIL: Modal overlay ──────────────────────────
            seleccionada && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'flex-end',
                padding: '0',
              }}
                onClick={() => setSeleccionada(null)}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: '20px 20px 0 0',
                    background: 'rgba(8,13,26,0.99)',
                    border: '1px solid rgba(99,102,241,0.22)',
                    borderBottom: 'none',
                    animation: 'slideUpModal 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {/* Handle bar */}
                  <div style={{
                    width: '36px', height: '4px', borderRadius: '2px',
                    background: '#1e293b', margin: '0.75rem auto 0',
                  }} />
                  <PanelDetalle
                    caso={seleccionada}
                    onClose={() => setSeleccionada(null)}
                    onEstadoChange={cambiarEstado}
                    actualizando={actualizando}
                    isModal={true}
                  />
                </div>
              </div>
            )
          ) : (
            // ── DESKTOP: Sidebar sticky ───────────────────────
            seleccionada ? (
              <PanelDetalle
                caso={seleccionada}
                onClose={() => setSeleccionada(null)}
                onEstadoChange={cambiarEstado}
                actualizando={actualizando}
                isModal={false}
              />
            ) : (
              <PanelAnalytics
                stats={stats}
                reclamaciones={reclamaciones}
              />
            )
          )}

        </div>
      </div>

      {/* ── ESTILOS GLOBALES ── */}
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes slideUp   { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }
        input::placeholder    { color: #334155; }
        textarea::placeholder { color: #334155; }
        ::-webkit-scrollbar         { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track   { background: transparent; }
        ::-webkit-scrollbar-thumb   { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  )
}




