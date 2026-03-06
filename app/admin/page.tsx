'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart3, Clock, AlertTriangle, CheckCircle2,
  Smartphone, Landmark, Zap, Shield, Bus, FileText,
  RefreshCw, Loader2, Settings, Lock, Eye, EyeOff,
  Calendar, ChevronRight, Inbox, X, NotebookPen,
  CircleDot, CircleCheck, Circle, Plus, TrendingUp,
  Filter, Download, Bell, Activity, ChevronDown,
  MessageSquare, User, Hash, ArrowUpRight
} from 'lucide-react'

// ══════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════
interface Reclamacion {
  id: string
  nombre: string
  email: string
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

// ══════════════════════════════════════════════════════════
// CONSTANTES Y CONFIGURACIÓN
// ══════════════════════════════════════════════════════════
const API_BASE   = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend-production.up.railway.app'}/admin`
const AUTH_TOKEN = 'irachembot_admin_2026_supersecreto'
const HEADERS    = { Authorization: `Bearer ${AUTH_TOKEN}`, 'Content-Type': 'application/json' }

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
  normal: { color: '#60a5fa', Icon: Circle,    label: 'Normal' },
  baja:   { color: '#94a3b8', Icon: Circle,    label: 'Baja'   },
}

const CATEGORIA_CONFIG: Record<string, { Icon: React.ElementType; label: string; color: string }> = {
  telefonia:  { Icon: Smartphone, label: 'Telefonía',  color: '#a855f7' },
  banca:      { Icon: Landmark,   label: 'Banca',      color: '#3b82f6' },
  energia:    { Icon: Zap,        label: 'Energía',    color: '#f97316' },
  seguros:    { Icon: Shield,     label: 'Seguros',    color: '#ef4444' },
  transporte: { Icon: Bus,        label: 'Transporte', color: '#22c55e' },
  otro:       { Icon: FileText,   label: 'Otro',       color: '#64748b' },
}

const KPI_CONFIG = [
  { key: 'total',      label: 'Total',      Icon: BarChart3,     color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)'  },
  { key: 'pendientes', label: 'Pendientes', Icon: Clock,         color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  { key: 'urgentes',   label: 'Urgentes',   Icon: AlertTriangle, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  { key: 'resueltos',  label: 'Resueltos',  Icon: CheckCircle2,  color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
]

// ══════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════

// ── Mini sparkline decorativo ──────────────────────────
function Sparkline({ color }: { color: string }) {
  const points = [3, 7, 4, 9, 6, 11, 8, 13, 10, 15]
  const max = Math.max(...points)
  const w = 60, h = 24
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / max) * h}`)
  return (
    <svg width={w} height={h} style={{ opacity: 0.6 }}>
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Badge de estado ────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: '20px', padding: '0.25rem 0.75rem',
      fontSize: '0.75rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    }}>
      <cfg.Icon size={11} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}

// ── Badge de categoría ─────────────────────────────────
function CategoriaBadge({ categoria }: { categoria: string }) {
  const cat = CATEGORIA_CONFIG[categoria] || CATEGORIA_CONFIG.otro
  return (
    <span style={{
      background: `${cat.color}15`,
      border: `1px solid ${cat.color}30`,
      borderRadius: '6px', padding: '0.2rem 0.6rem',
      fontSize: '0.78rem', color: cat.color,
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    }}>
      <cat.Icon size={11} strokeWidth={2.5} />
      {cat.label}
    </span>
  )
}

// ── Nota individual del tracker ────────────────────────
function NotaItem({ nota, isLast }: { nota: NotaInterna; isLast: boolean }) {
  const fecha = new Date(nota.created_at)
  const hoy   = new Date()
  const esHoy = fecha.toDateString() === hoy.toDateString()

  const fechaStr = esHoy
    ? `Hoy · ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : fecha.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })

  return (
    <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
      {/* Línea vertical */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: '7px', top: '20px',
          width: '2px', height: 'calc(100% + 4px)',
          background: 'linear-gradient(to bottom, rgba(99,102,241,0.3), transparent)',
        }} />
      )}
      {/* Dot */}
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
        marginTop: '3px', zIndex: 1,
        background: isLast ? 'rgba(52,211,153,0.2)' : 'rgba(99,102,241,0.15)',
        border: `2px solid ${isLast ? '#34d399' : '#6366f1'}`,
        boxShadow: isLast ? '0 0 8px rgba(52,211,153,0.4)' : 'none',
      }} />
      {/* Contenido */}
      <div style={{ flex: 1, paddingBottom: isLast ? '0.25rem' : '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <span style={{
            fontSize: '0.68rem', color: '#475569',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
          }}>
            <Calendar size={9} /> {fechaStr}
          </span>
          <span style={{
            fontSize: '0.62rem', fontWeight: 600,
            background: isLast ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)',
            color: isLast ? '#34d399' : '#818cf8',
            borderRadius: '4px', padding: '0.1rem 0.45rem',
          }}>
            {nota.autor}
          </span>
          {isLast && (
            <span style={{
              fontSize: '0.6rem', color: '#34d399',
              background: 'rgba(52,211,153,0.08)',
              borderRadius: '4px', padding: '0.1rem 0.4rem',
            }}>
              ● Última
            </span>
          )}
        </div>
        <p style={{
          margin: 0, fontSize: '0.82rem', color: '#cbd5e1',
          lineHeight: 1.55, fontFamily: 'monospace',
          background: 'rgba(15,23,42,0.4)',
          borderRadius: '6px', padding: '0.5rem 0.6rem',
          borderLeft: `2px solid ${isLast ? '#34d39950' : '#6366f130'}`,
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
  caso,
  onClose,
  onEstadoChange,
  actualizando,
}: {
  caso: Reclamacion
  onClose: () => void
  onEstadoChange: (id: string, estado: string) => void
  actualizando: boolean
}) {
  const [notas,          setNotas]          = useState('')
  const [historial,      setHistorial]      = useState<NotaInterna[]>([])
  const [cargandoNotas,  setCargandoNotas]  = useState(false)
  const [guardandoNota,  setGuardandoNota]  = useState(false)
  const [notaGuardada,   setNotaGuardada]   = useState(false)
  const [tabActiva,      setTabActiva]      = useState<'detalle' | 'notas' | 'chat'>('detalle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const historialRef = useRef<HTMLDivElement>(null)

  const cfg = ESTADO_CONFIG[caso.estado] || ESTADO_CONFIG.pendiente
  const cat = CATEGORIA_CONFIG[caso.categoria] || CATEGORIA_CONFIG.otro

  // Carga notas al montar
  useEffect(() => {
    cargarHistorial()
  }, [caso.id])

  // Scroll al final del historial cuando se añade nota
  useEffect(() => {
    if (historialRef.current) {
      historialRef.current.scrollTop = historialRef.current.scrollHeight
    }
  }, [historial])

  const cargarHistorial = async () => {
    setCargandoNotas(true)
    try {
      const res = await fetch(`${API_BASE}/reclamaciones/${caso.id}/notas`, { headers: HEADERS })
      const data = await res.json()
      setHistorial(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando notas:', e)
    } finally {
      setCargandoNotas(false)
    }
  }

  const guardarNota = async () => {
    if (!notas.trim() || guardandoNota) return
    setGuardandoNota(true)
    try {
      await fetch(`${API_BASE}/reclamaciones/${caso.id}/notas`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ contenido: notas.trim(), autor: 'Admin' }),
      })
      setNotas('')
      setNotaGuardada(true)
      setTimeout(() => setNotaGuardada(false), 2500)
      await cargarHistorial()
    } catch (e) {
      console.error('Error guardando nota:', e)
    } finally {
      setGuardandoNota(false)
    }
  }

  const formatFecha = (f: string) => new Date(f).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  // ── Tabs ──────────────────────────────────────────────
  const tabs = [
    { key: 'detalle', label: 'Detalle',  Icon: FileText      },
    { key: 'notas',   label: `Notas ${historial.length > 0 ? `(${historial.length})` : ''}`, Icon: NotebookPen },
    { key: 'chat',    label: 'Chat',     Icon: MessageSquare },
  ] as const

  return (
    <div style={{
      background: 'rgba(10,15,30,0.97)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '18px',
      backdropFilter: 'blur(20px)',
      height: 'fit-content',
      position: 'sticky',
      top: '80px',
      overflow: 'hidden',
      boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)',
    }}>

      {/* ── Header del panel ── */}
      <div style={{
        padding: '1.25rem 1.5rem 0',
        background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(51,65,85,0.4)',
      }}>
        {/* Fila nombre + cerrar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${cat.color}30, ${cat.color}10)`,
              border: `1px solid ${cat.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>
              <cat.Icon size={18} color={cat.color} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {caso.nombre || 'Sin nombre'}
              </h2>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#475569' }}>
                {caso.email || 'Sin email'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(30,41,59,0.8)', border: '1px solid #1e293b',
              borderRadius: '8px', width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#475569', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Badges rápidos */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <EstadoBadge estado={caso.estado} />
          <CategoriaBadge categoria={caso.categoria} />
          <span style={{
            background: 'rgba(30,41,59,0.6)', border: '1px solid #1e293b',
            borderRadius: '6px', padding: '0.2rem 0.6rem',
            fontSize: '0.72rem', color: '#475569',
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          }}>
            <Hash size={9} />
            {caso.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0' }}>
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTabActiva(key)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${tabActiva === key ? '#6366f1' : 'transparent'}`,
                padding: '0.6rem 0.5rem',
                color: tabActiva === key ? '#a5b4fc' : '#475569',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: tabActiva === key ? 600 : 400,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.35rem',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido de tabs ── */}
      <div style={{ padding: '1.25rem 1.5rem' }}>

        {/* TAB: DETALLE */}
        {tabActiva === 'detalle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Metadata grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
            }}>
              {[
                { label: 'Fecha',    value: formatFecha(caso.created_at), Icon: Calendar  },
                { label: 'Urgencia', value: (URGENCIA_CONFIG[caso.urgencia] || URGENCIA_CONFIG.normal).label, Icon: AlertTriangle },
              ].map(({ label, value, Icon: Ic }) => (
                <div key={label} style={{
                  background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b',
                  borderRadius: '8px', padding: '0.6rem 0.75rem',
                }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Ic size={9} /> {label}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Mensaje original */}
            <div style={{
              background: 'rgba(30,41,59,0.5)', border: '1px solid #1e293b',
              borderRadius: '10px', padding: '1rem',
            }}>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.65rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FileText size={9} /> Descripción del problema
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.65, color: '#cbd5e1' }}>
                {caso.mensaje_original || 'Sin descripción'}
              </p>
            </div>

            {/* Cambiar estado */}
            <div>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.65rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cambiar estado
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {ESTADOS.map(e => {
                  const c = ESTADO_CONFIG[e]
                  const isActive = caso.estado === e
                  return (
                    <button
                      key={e}
                      onClick={() => onEstadoChange(caso.id, e)}
                      disabled={isActive || actualizando}
                      style={{
                        background: isActive ? c.bg : 'rgba(15,23,42,0.8)',
                        border: `1px solid ${isActive ? c.color + '60' : '#1e293b'}`,
                        borderRadius: '8px', padding: '0.55rem 0.5rem',
                        color: isActive ? c.color : '#334155',
                        cursor: isActive ? 'default' : 'pointer',
                        fontSize: '0.78rem', fontWeight: isActive ? 700 : 400,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.35rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {actualizando && !isActive
                        ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <c.Icon size={12} strokeWidth={2.5} />
                      }
                      {c.label}
                      {isActive && <CircleCheck size={11} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: NOTAS */}
        {tabActiva === 'notas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Header notas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={13} color="#6366f1" />
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                  Historial de actividad
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {cargandoNotas && <Loader2 size={11} color="#6366f1" style={{ animation: 'spin 0.8s linear infinite' }} />}
                <span style={{
                  background: historial.length > 0 ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.5)',
                  color: historial.length > 0 ? '#a5b4fc' : '#334155',
                  borderRadius: '20px', padding: '0.15rem 0.6rem',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>
                  {historial.length} nota{historial.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Tracker de notas */}
            {historial.length === 0 && !cargandoNotas ? (
              <div style={{
                padding: '2rem', textAlign: 'center',
                background: 'rgba(15,23,42,0.4)', borderRadius: '10px',
                border: '1px dashed #1e293b',
              }}>
                <NotebookPen size={24} color="#1e293b" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, color: '#334155', fontSize: '0.82rem' }}>
                  Sin notas todavía
                </p>
                <p style={{ margin: '0.25rem 0 0', color: '#1e293b', fontSize: '0.75rem' }}>
                  Añade la primera nota de gestión
                </p>
              </div>
            ) : (
              <div
                ref={historialRef}
                style={{
                  background: 'rgba(10,15,25,0.6)',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '1rem 1rem 0.5rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#1e293b transparent',
                }}
              >
                {historial.map((nota, i) => (
                  <NotaItem
                    key={nota.id}
                    nota={nota}
                    isLast={i === historial.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Input nueva nota */}
            <div style={{
              background: 'rgba(15,23,42,0.6)',
              border: `1px solid ${notas.trim() ? 'rgba(99,102,241,0.35)' : '#1e293b'}`,
              borderRadius: '10px',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              <textarea
                ref={textareaRef}
                value={notas}
                onChange={e => setNotas(e.target.value)}
                onKeyDown={e => {
                  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); guardarNota() }
                }}
                placeholder="Escribe una nota de gestión... (Ctrl+Enter para guardar)"
                rows={3}
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', padding: '0.75rem',
                  color: '#f1f5f9', fontSize: '0.83rem',
                  resize: 'none', outline: 'none',
                  boxSizing: 'border-box', lineHeight: 1.55,
                  fontFamily: 'system-ui, sans-serif',
                }}
              />
              {/* Barra inferior del textarea */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.75rem',
                borderTop: '1px solid #1e293b',
                background: 'rgba(10,15,25,0.4)',
              }}>
                <span style={{ fontSize: '0.65rem', color: '#334155' }}>
                  {notas.length > 0 ? `${notas.length} caracteres` : 'Ctrl+Enter para guardar'}
                </span>
                <button
                  onClick={guardarNota}
                  disabled={guardandoNota || !notas.trim()}
                  style={{
                    background: notaGuardada
                      ? 'rgba(52,211,153,0.15)'
                      : notas.trim()
                        ? 'rgba(99,102,241,0.2)'
                        : 'rgba(30,41,59,0.3)',
                    border: `1px solid ${
                      notaGuardada ? 'rgba(52,211,153,0.35)'
                      : notas.trim() ? 'rgba(99,102,241,0.35)'
                      : '#1e293b'
                    }`,
                    borderRadius: '6px',
                    padding: '0.3rem 0.75rem',
                    color: notaGuardada ? '#34d399' : notas.trim() ? '#a5b4fc' : '#334155',
                    cursor: (guardandoNota || !notas.trim()) ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {guardandoNota
                    ? <><Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando</>
                    : notaGuardada
                      ? <><CircleCheck size={11} /> Guardado</>
                      : <><Plus size={11} /> Añadir nota</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CHAT */}
        {tabActiva === 'chat' && (
          <div style={{
            padding: '2rem', textAlign: 'center',
            background: 'rgba(15,23,42,0.4)', borderRadius: '10px',
            border: '1px dashed #1e293b',
          }}>
            <MessageSquare size={24} color="#1e293b" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, color: '#334155', fontSize: '0.82rem' }}>
              Historial del chat
            </p>
            <p style={{ margin: '0.25rem 0 0', color: '#1e293b', fontSize: '0.75rem' }}>
              Próximamente disponible
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function AdminPage() {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([])
  const [stats,         setStats]         = useState<Stats>({ total: 0, pendientes: 0, urgentes: 0, resueltos: 0 })
  const [filtro,        setFiltro]        = useState('todos')
  const [seleccionada,  setSeleccionada]  = useState<Reclamacion | null>(null)
  const [cargando,      setCargando]      = useState(true)
  const [actualizando,  setActualizando]  = useState(false)
  const [busqueda,      setBusqueda]      = useState('')
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)

  // ── Carga de datos ───────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/reclamaciones`, { headers: HEADERS }),
        fetch(`${API_BASE}/estadisticas`,  { headers: HEADERS }),
      ])
      const rData = await rRes.json()
      const sData = await sRes.json()
      setReclamaciones(Array.isArray(rData) ? rData : rData.reclamaciones || [])
      setStats({
        total:      sData.total      || 0,
        pendientes: sData.pendientes || 0,
        urgentes:   sData.urgentes   || 0,
        resueltos:  sData.resueltos  || 0,
      })
      setUltimaActualizacion(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    const interval = setInterval(cargarDatos, 60_000)
    return () => clearInterval(interval)
  }, [cargarDatos])

  // ── Cambiar estado ───────────────────────────────────
  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setActualizando(true)
    try {
      await fetch(`${API_BASE}/reclamaciones/${id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      await cargarDatos()
      if (seleccionada?.id === id) {
        setSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado } : null)
      }
    } finally {
      setActualizando(false)
    }
  }

  // ── Filtrado ─────────────────────────────────────────
  const recFiltradas = reclamaciones.filter(r => {
    const matchFiltro   = filtro === 'todos' || r.estado === filtro
    const matchBusqueda = !busqueda ||
      r.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.categoria?.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  const formatFecha = (f: string) => {
    if (!f) return '—'
    return new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 60%, #0d0820 100%)',
      fontFamily: 'system-ui, sans-serif',
      color: '#f1f5f9',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        background: 'rgba(6,11,24,0.98)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        padding: '0 2rem',
        height: '60px',
        display: 'flex', alignItems: 'center', gap: '1rem',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={16} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              IracheBot <span style={{ color: '#6366f1' }}>Admin</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.6rem', color: '#334155' }}>
              Panel de Gestión · Navarra
            </p>
          </div>
        </div>

        {/* Separador */}
        <div style={{ width: '1px', height: '24px', background: '#1e293b' }} />

        {/* Indicador live */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#34d399',
            boxShadow: '0 0 6px rgba(52,211,153,0.6)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '0.7rem', color: '#334155' }}>
            {ultimaActualizacion
              ? `Actualizado ${ultimaActualizacion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
              : 'Conectando...'}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, email, categoría..."
            style={{
              background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b',
              borderRadius: '8px', padding: '0.45rem 1rem 0.45rem 2.2rem',
              color: '#f1f5f9', fontSize: '0.82rem', width: '280px', outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <Filter size={13} color="#334155" style={{
            position: 'absolute', left: '0.7rem', top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none',
          }} />
        </div>

        {/* Botón actualizar */}
        <button
          onClick={cargarDatos} disabled={cargando}
          style={{
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '8px', padding: '0.45rem 0.875rem', color: '#6366f1',
            cursor: 'pointer', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.2s',
          }}
        >
          {cargando
            ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <RefreshCw size={13} />
          }
          Actualizar
        </button>

        {/* Volver */}
        <a href="/" style={{
          color: '#334155', fontSize: '0.8rem', textDecoration: 'none',
          border: '1px solid #1e293b', borderRadius: '8px',
          padding: '0.45rem 0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          transition: 'color 0.2s',
        }}>
          <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Inicio
        </a>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto' }}>

        {/* ── KPI CARDS ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem', marginBottom: '1.5rem',
        }}>
          {KPI_CONFIG.map(({ key, label, Icon, color, bg, border }) => (
            <div key={key} style={{
              background: bg, border: `1px solid ${border}`,
              borderRadius: '16px', padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${color}20`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={20} color={color} strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color, lineHeight: 1 }}>
                    {stats[key as keyof Stats]}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#475569' }}>
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
          gridTemplateColumns: seleccionada ? '1fr 380px' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}>

          {/* ── TABLA ── */}
          <div style={{
            background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(10px)',
          }}>
            {/* Filtros */}
            <div style={{
              padding: '0.875rem 1.5rem',
              borderBottom: '1px solid rgba(30,41,59,0.8)',
              display: 'flex', gap: '0.4rem', alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: '#334155', fontSize: '0.75rem', marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Filter size={11} /> Filtrar:
              </span>
              {['todos', ...ESTADOS].map(e => {
                const cfg = ESTADO_CONFIG[e]
                const isActive = filtro === e
                const activeColor = e === 'todos' ? '#6366f1' : cfg?.color
                return (
                  <button
                    key={e}
                    onClick={() => setFiltro(e)}
                    style={{
                      background: isActive ? `${activeColor}18` : 'transparent',
                      border: `1px solid ${isActive ? activeColor + '50' : '#1e293b'}`,
                      borderRadius: '20px', padding: '0.25rem 0.75rem',
                      color: isActive ? activeColor : '#334155',
                      cursor: 'pointer', fontSize: '0.75rem',
                      fontWeight: isActive ? 600 : 400,
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    {e === 'todos'
                      ? <><BarChart3 size={11} /> Todos</>
                      : <><cfg.Icon size={11} /> {cfg.label}</>
                    }
                  </button>
                )
              })}
              <span style={{ marginLeft: 'auto', color: '#334155', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Hash size={10} />
                {recFiltradas.length} resultado{recFiltradas.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading bar */}
            {(cargando || actualizando) && (
              <div style={{
                padding: '0.4rem 1.5rem',
                background: 'rgba(99,102,241,0.06)',
                borderBottom: '1px solid rgba(99,102,241,0.1)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <Loader2 size={11} color="#6366f1" style={{ animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#6366f1', fontSize: '0.75rem' }}>
                  {actualizando ? 'Guardando cambios...' : 'Cargando datos...'}
                </span>
              </div>
            )}

            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                    {['Fecha', 'Nombre', 'Categoría', 'Urgencia', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{
                        padding: '0.75rem 1.25rem', textAlign: 'left',
                        fontSize: '0.68rem', color: '#334155', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <Inbox size={32} color="#1e293b" />
                          <span style={{ color: '#1e293b', fontSize: '0.875rem' }}>
                            {cargando ? 'Cargando reclamaciones...' : 'No hay reclamaciones'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : recFiltradas.map((r, i) => {
                    const urg = URGENCIA_CONFIG[r.urgencia] || URGENCIA_CONFIG.normal
                    const isSelected = seleccionada?.id === r.id
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSeleccionada(isSelected ? null : r)}
                        style={{
                          borderBottom: '1px solid rgba(30,41,59,0.5)',
                          background: isSelected
                            ? 'rgba(99,102,241,0.07)'
                            : 'transparent',
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Fecha */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.78rem' }}>
                            <Calendar size={12} />
                            {formatFecha(r.created_at)}
                          </div>
                        </td>

                        {/* Nombre */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '8px',
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <User size={13} color="#6366f1" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.nombre || '—'}</div>
                              <div style={{ fontSize: '0.72rem', color: '#334155' }}>{r.email || ''}</div>
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <CategoriaBadge categoria={r.categoria} />
                        </td>

                        {/* Urgencia */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{
                            color: urg.color, fontSize: '0.82rem', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          }}>
                            <urg.Icon size={12} fill={urg.color} strokeWidth={0} />
                            {urg.label}
                          </span>
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <EstadoBadge estado={r.estado} />
                        </td>

                        {/* Acción */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <button
                            onClick={e => { e.stopPropagation(); setSeleccionada(isSelected ? null : r) }}
                            style={{
                              background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)',
                              border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.15)'}`,
                              borderRadius: '7px', padding: '0.3rem 0.75rem',
                              color: isSelected ? '#a5b4fc' : '#6366f1',
                              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isSelected
                              ? <><EyeOff size={12} /> Cerrar</>
                              : <><Eye size={12} /> Ver</>
                            }
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── PANEL DETALLE ── */}
          {seleccionada && (
            <PanelDetalle
              caso={seleccionada}
              onClose={() => setSeleccionada(null)}
              onEstadoChange={cambiarEstado}
              actualizando={actualizando}
            />
          )}
        </div>
      </div>

      {/* ── ESTILOS GLOBALES ── */}
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes pulse-dot   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        tr:hover td            { background: rgba(99,102,241,0.03) !important; }
        input::placeholder     { color: #334155; }
        textarea::placeholder  { color: #334155; }
        ::-webkit-scrollbar         { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track   { background: transparent; }
        ::-webkit-scrollbar-thumb   { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  )
}


