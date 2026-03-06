'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, Clock, AlertTriangle, CheckCircle2,
  Smartphone, Landmark, Zap, Shield, Bus, FileText,
  RefreshCw, Loader2, Settings, Lock, Eye, EyeOff,
  Calendar, ChevronRight, Inbox, X, NotebookPen,
  CircleDot, CircleCheck, Circle
} from 'lucide-react'

interface Reclamacion {
  id: string
  nombre: string
  email: string
  categoria: string
  urgencia: string
  estado: string
  mensaje_original: string
  created_at: string
}

interface Stats {
  total: number
  pendientes: number
  urgentes: number
  resueltos: number
}

const ESTADOS = ['pendiente', 'en_proceso', 'resuelto', 'cerrado']

const ESTADO_CONFIG: Record<string, {
  color: string
  bg: string
  border: string
  Icon: React.ElementType
  label: string
}> = {
  pendiente:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  Icon: Clock,         label: 'Pendiente'   },
  en_proceso: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  Icon: Settings,      label: 'En proceso'  },
  resuelto:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  Icon: CheckCircle2,  label: 'Resuelto'    },
  cerrado:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', Icon: Lock,          label: 'Cerrado'     },
}

const URGENCIA_CONFIG: Record<string, { color: string; Icon: React.ElementType; label: string }> = {
  alta:   { color: '#f87171', Icon: CircleDot,   label: 'Alta'   },
  normal: { color: '#60a5fa', Icon: Circle,       label: 'Normal' },
  baja:   { color: '#94a3b8', Icon: Circle,       label: 'Baja'   },
}

const CATEGORIA_CONFIG: Record<string, { Icon: React.ElementType; label: string }> = {
  telefonia:  { Icon: Smartphone, label: 'Telefonía'   },
  banca:      { Icon: Landmark,   label: 'Banca'       },
  energia:    { Icon: Zap,        label: 'Energía'     },
  seguros:    { Icon: Shield,     label: 'Seguros'     },
  transporte: { Icon: Bus,        label: 'Transporte'  },
  otro:       { Icon: FileText,   label: 'Otro'        },
}

const KPI_CONFIG = [
  { key: 'total',      label: 'Total',      Icon: BarChart3,      color: '#6366f1', bg: 'rgba(99,102,241,0.1)',   border: 'rgba(99,102,241,0.2)'   },
  { key: 'pendientes', label: 'Pendientes', Icon: Clock,          color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)'   },
  { key: 'urgentes',   label: 'Urgentes',   Icon: AlertTriangle,  color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)'  },
  { key: 'resueltos',  label: 'Resueltos',  Icon: CheckCircle2,   color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)'   },
]

export default function AdminPage() {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([])
  const [stats, setStats]                 = useState<Stats>({ total: 0, pendientes: 0, urgentes: 0, resueltos: 0 })
  const [filtro, setFiltro]               = useState('todos')
  const [seleccionada, setSeleccionada]   = useState<Reclamacion | null>(null)
  const [notas, setNotas]                 = useState('')
  const [cargando, setCargando]           = useState(true)
  const [actualizando, setActualizando]   = useState(false)
  const [busqueda, setBusqueda]           = useState('')
  const [notaGuardada, setNotaGuardada] = useState(false)

  const cargarDatos = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetch('http://localhost:8000/admin/reclamaciones', {
          headers: { Authorization: 'Bearer irachembot_admin_2026_supersecreto' }
        }),
        fetch('http://localhost:8000/admin/estadisticas', {
          headers: { Authorization: 'Bearer irachembot_admin_2026_supersecreto' }
        })
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
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setActualizando(true)
    try {
      await fetch(`http://localhost:8000/admin/reclamaciones/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer irachembot_admin_2026_supersecreto'
        },
        body: JSON.stringify({ estado: nuevoEstado, notas_internas: notas })
      })
      await cargarDatos()
      if (seleccionada?.id === id) {
        setSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado } : null)
      }
    } finally {
      setActualizando(false)
    }
  }
  const guardarSoloNotas = async (id: string) => {
    setActualizando(true)
    try {
      await fetch(`http://localhost:8000/admin/reclamaciones/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer irachembot_admin_2026_supersecreto'
        },
        body: JSON.stringify({ notas_admin: notas })
      })
      setNotaGuardada(true)
      setTimeout(() => setNotaGuardada(false), 3000) // Reset feedback
      await cargarDatos()
    } catch (e) {
      console.error('Error guardando nota:', e)
    } finally {
      setActualizando(false)
    }
  }

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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0f1e 0%, #0f172a 60%, #1a0a2e 100%)',
      fontFamily: 'system-ui, sans-serif',
      color: '#f1f5f9',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        background: 'rgba(15,23,42,0.95)',
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        padding: '0.875rem 2rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <img src="/bot-icon.svg" alt="IracheBot" width={36} height={36} style={{ borderRadius: '9px' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            IracheBot <span style={{ color: '#6366f1' }}>Admin</span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#475569' }}>
            Panel de Gestión · Servicio de Consumo de Navarra
          </p>
        </div>
        <div style={{ flex: 1 }} />

        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email..."
          style={{
            background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
            borderRadius: '8px', padding: '0.5rem 1rem',
            color: '#f1f5f9', fontSize: '0.85rem', width: '260px', outline: 'none',
          }}
        />

        <button
          onClick={cargarDatos} disabled={cargando}
          style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '8px', padding: '0.5rem 1rem', color: '#a5b4fc',
            cursor: 'pointer', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          {cargando
            ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <RefreshCw size={15} />
          }
          Actualizar
        </button>

        <a href="/" style={{
          color: '#475569', fontSize: '0.8rem', textDecoration: 'none',
          border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
        }}>
          <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Inicio
        </a>
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── KPI CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {KPI_CONFIG.map(({ key, label, Icon, color, bg, border }) => (
            <div key={key} style={{
              background: bg, border: `1px solid ${border}`,
              borderRadius: '16px', padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
              backdropFilter: 'blur(10px)',
            }}>
              {/* Icono con fondo sólido */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${color}20`,
                border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={22} color={color} strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
                  {stats[key as keyof Stats]}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1fr 380px' : '1fr', gap: '1.5rem' }}>

          {/* ── TABLA ── */}
          <div style={{
            background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)',
            borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(10px)',
          }}>
            {/* Filtros */}
            <div style={{
              padding: '1rem 1.5rem', borderBottom: '1px solid rgba(51,65,85,0.5)',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
              <span style={{ color: '#475569', fontSize: '0.8rem', marginRight: '0.5rem' }}>Filtrar:</span>
              {['todos', ...ESTADOS].map(e => {
                const cfg = ESTADO_CONFIG[e]
                const isActive = filtro === e
                const activeColor = e === 'todos' ? '#6366f1' : cfg?.color
                return (
                  <button
                    key={e}
                    onClick={() => setFiltro(e)}
                    style={{
                      background: isActive ? `${activeColor}20` : 'transparent',
                      border: `1px solid ${isActive ? activeColor : '#334155'}`,
                      borderRadius: '20px', padding: '0.3rem 0.875rem',
                      color: isActive ? activeColor : '#475569',
                      cursor: 'pointer', fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 400,
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {e === 'todos'
                      ? <><FileText size={12} /> Todos</>
                      : <><cfg.Icon size={12} /> {cfg.label}</>
                    }
                  </button>
                )
              })}
              <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '0.75rem' }}>
                {recFiltradas.length} resultado{recFiltradas.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading bar */}
            {(cargando || actualizando) && (
              <div style={{
                padding: '0.5rem 1.5rem', background: 'rgba(99,102,241,0.1)',
                borderBottom: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <Loader2 size={12} color="#6366f1" style={{ animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>
                  {actualizando ? 'Guardando cambios...' : 'Cargando datos...'}
                </span>
              </div>
            )}

            {/* Tabla */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                    {['Fecha', 'Nombre', 'Categoría', 'Urgencia', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{
                        padding: '0.875rem 1.25rem', textAlign: 'left',
                        fontSize: '0.75rem', color: '#475569', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <Inbox size={36} color="#334155" />
                          <span style={{ color: '#334155', fontSize: '0.9rem' }}>
                            {cargando ? 'Cargando...' : 'No hay reclamaciones'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : recFiltradas.map((r, i) => {
                    const cfg  = ESTADO_CONFIG[r.estado]  || ESTADO_CONFIG.pendiente
                    const urg  = URGENCIA_CONFIG[r.urgencia] || URGENCIA_CONFIG.normal
                    const cat  = CATEGORIA_CONFIG[r.categoria] || CATEGORIA_CONFIG.otro
                    const isSelected = seleccionada?.id === r.id
                    return (
                      <tr
                        key={r.id}
                        onClick={() => {
                          if (isSelected) {
                            setSeleccionada(null)
                            setNotas('')
                          } else {
                            setSeleccionada(r)
                            setNotas((r as any).notas_admin || '')  // ← Carga notas existentes
                          }
                        }}
                        style={{
                          borderBottom: '1px solid rgba(51,65,85,0.3)',
                          background: isSelected
                            ? 'rgba(99,102,241,0.08)'
                            : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                          transition: 'background 0.15s', cursor: 'pointer',
                        }}
                      >
                        {/* Fecha */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem' }}>
                            <Calendar size={13} />
                            {formatFecha(r.created_at)}
                          </div>
                        </td>

                        {/* Nombre */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.nombre || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#475569' }}>{r.email || ''}</div>
                        </td>

                        {/* Categoría */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: '6px', padding: '0.2rem 0.6rem',
                            fontSize: '0.8rem', color: '#a5b4fc',
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          }}>
                            <cat.Icon size={12} strokeWidth={2.5} />
                            {cat.label}
                          </span>
                        </td>

                        {/* Urgencia */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{
                            color: urg.color, fontSize: '0.85rem', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          }}>
                            <urg.Icon size={13} fill={urg.color} strokeWidth={0} />
                            {urg.label}
                          </span>
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <span style={{
                            background: cfg.bg, color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: '20px', padding: '0.25rem 0.75rem',
                            fontSize: '0.78rem', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          }}>
                            <cfg.Icon size={12} strokeWidth={2.5} />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Acción */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              if (isSelected) {
                                setSeleccionada(null)
                                setNotas('')
                              } else {
                                setSeleccionada(r)
                                setNotas((r as any).notas_admin || '')
                              }
                            }}
                            style={{
                              background: isSelected ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px',
                              padding: '0.35rem 0.875rem', color: '#a5b4fc',
                              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            {isSelected ? <><EyeOff size={13} /> Cerrar</> : <><Eye size={13} /> Ver</>}
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
          {seleccionada && (() => {
            const cfg = ESTADO_CONFIG[seleccionada.estado] || ESTADO_CONFIG.pendiente
            const cat = CATEGORIA_CONFIG[seleccionada.categoria] || CATEGORIA_CONFIG.otro
            return (
              <div style={{
                background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '16px', padding: '1.5rem',
                backdropFilter: 'blur(10px)', height: 'fit-content',
                position: 'sticky', top: '80px',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{seleccionada.nombre}</h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#475569' }}>{seleccionada.email}</p>
                  </div>
                  <button
                    onClick={() => setSeleccionada(null)}
                    style={{
                      background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
                      borderRadius: '8px', width: '32px', height: '32px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#475569', cursor: 'pointer',
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <span style={{
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '8px', padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem', color: '#a5b4fc',
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <cat.Icon size={13} strokeWidth={2.5} /> {cat.label}
                  </span>
                  <span style={{
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    borderRadius: '8px', padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem', color: cfg.color, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <cfg.Icon size={13} strokeWidth={2.5} /> {cfg.label}
                  </span>
                  <span style={{
                    background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
                    borderRadius: '8px', padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem', color: '#64748b',
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <Calendar size={12} /> {formatFecha(seleccionada.created_at)}
                  </span>
                </div>

                {/* Mensaje */}
                <div style={{
                  background: 'rgba(30,41,59,0.6)', border: '1px solid #334155',
                  borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem',
                }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={11} /> Descripción del problema
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#cbd5e1' }}>
                    {seleccionada.mensaje_original || 'Sin descripción'}
                  </p>
                </div>

                {/* Notas */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{
                    margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#475569',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}>
                    <NotebookPen size={11} /> Notas internas
                  </p>
                  <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Añade notas de gestión interna..."
                    rows={3}
                    style={{
                      width: '100%', background: 'rgba(30,41,59,0.6)',
                      border: '1px solid #334155', borderRadius: '10px',
                      padding: '0.75rem', color: '#f1f5f9', fontSize: '0.85rem',
                      resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  {/* ✅ NUEVO: Botón guardar nota independiente */}
                  <button
                    onClick={() => guardarSoloNotas(seleccionada.id)}
                    disabled={actualizando}
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      background: notaGuardada ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)',
                      border: `1px solid ${notaGuardada ? 'rgba(52,211,153,0.3)' : 'rgba(99,102,241,0.3)'}`,
                      borderRadius: '8px',
                      padding: '0.5rem',
                      color: notaGuardada ? '#34d399' : '#a5b4fc',
                      cursor: actualizando ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '0.4rem',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {actualizando
                      ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando...</>
                      : notaGuardada
                        ? <><CircleCheck size={13} /> Nota guardada</>
                        : <><NotebookPen size={13} /> Guardar nota</>
                    }
                  </button>
                </div>


                {/* Cambiar estado */}
                <div>
                  <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cambiar estado
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {ESTADOS.map(e => {
                      const c = ESTADO_CONFIG[e]
                      const isActive = seleccionada.estado === e
                      return (
                        <button
                          key={e}
                          onClick={() => cambiarEstado(seleccionada.id, e)}
                          disabled={isActive || actualizando}
                          style={{
                            background: isActive ? c.bg : 'rgba(30,41,59,0.6)',
                            border: `1px solid ${isActive ? c.color : '#334155'}`,
                            borderRadius: '10px', padding: '0.6rem',
                            color: isActive ? c.color : '#475569',
                            cursor: isActive ? 'default' : 'pointer',
                            fontSize: '0.8rem', fontWeight: isActive ? 700 : 400,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            transition: 'all 0.2s',
                          }}
                        >
                          {actualizando && !isActive
                            ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                            : <c.Icon size={13} strokeWidth={2.5} />
                          }
                          {c.label}
                          {isActive && <CircleCheck size={13} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tr:hover td { background: rgba(99,102,241,0.04) !important; }
        input::placeholder { color: #475569; }
        textarea::placeholder { color: #334155; }
      `}</style>
    </div>
  )
}


