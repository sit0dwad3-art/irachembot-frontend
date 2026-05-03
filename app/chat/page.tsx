'use client'

import { useState, useRef, useEffect } from 'react'

interface Mensaje {
  rol: 'usuario' | 'bot'
  contenido: string
  opciones?: string[]
  esArchivo?: boolean
  nombreArchivo?: string
}

interface EstadoSesion {
  paso: string
  datos: Record<string, string>
}

const ADVERTENCIA_ARCHIVOS = `⚠️ Aviso de privacidad al adjuntar documentos:
• ✅ Puedes adjuntar: facturas, contratos, capturas de pantalla
• ❌ Evita incluir: NIFs, números de cuenta bancaria, contraseñas, direcciones completas
• 🔒 Tus archivos se procesan de forma segura y confidencial`

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [sesionId] = useState(() => `sesion_${Date.now()}`)
  const [sesion, setSesion] = useState<EstadoSesion>({ paso: 'bienvenida', datos: {} })
  const [archivosAdjuntos, setArchivosAdjuntos] = useState<File[]>([])
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iniciado = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  useEffect(() => {
    if (iniciado.current) return
    iniciado.current = true
    iniciarConversacion()
  }, [])

  const limpiarMarkdown = (t: string) =>
    t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')

  const iniciarConversacion = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend-production.up.railway.app'}/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion_id: sesionId, mensaje: '', paso: 'bienvenida', datos_sesion: {} }),
      })
      const data = await res.json()
      setMensajes([{
        rol: 'bot',
        contenido: limpiarMarkdown(data.respuesta),
        opciones: data.opciones || []
      }])
      setSesion(prev => ({ paso: data.siguiente_paso, datos: prev.datos }))
    } catch {
      setMensajes([{ rol: 'bot', contenido: '⚠️ No puedo conectar con el servidor.' }])
    } finally {
      setCargando(false)
    }
  }

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || cargando) return
    setInput('')

    setMensajes(prev => [...prev, { rol: 'usuario', contenido: texto }])
    setCargando(true)

    const nuevosDatos = { ...sesion.datos }
    if (sesion.paso === 'recoger_email') nuevosDatos.nombre = texto
    else if (sesion.paso === 'recoger_problema') nuevosDatos.email = texto

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://irachembot-backend-production.up.railway.app'}/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id: sesionId,
          mensaje: texto,
          paso: sesion.paso,
          datos_sesion: nuevosDatos
        }),
      })
      const data = await res.json()
      setMensajes(prev => [...prev, {
        rol: 'bot',
        contenido: limpiarMarkdown(data.respuesta),
        opciones: data.opciones || []
      }])
      setSesion({ paso: data.siguiente_paso, datos: nuevosDatos })
    } catch {
      setMensajes(prev => [...prev, {
        rol: 'bot',
        contenido: '⚠️ Error de conexión.'
      }])
    } finally {
      setCargando(false)
    }
  }

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setMostrarAviso(true)
    setArchivosAdjuntos(prev => [...prev, ...files])

    // Mostrar aviso en el chat
    setMensajes(prev => [...prev, {
      rol: 'bot',
      contenido: ADVERTENCIA_ARCHIVOS,
    }])

    // Mostrar archivos adjuntados
    files.forEach(file => {
      setMensajes(prev => [...prev, {
        rol: 'usuario',
        contenido: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        esArchivo: true,
        nombreArchivo: file.name,
      }])
    })

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const eliminarArchivo = (nombre: string) => {
    setArchivosAdjuntos(prev => prev.filter(f => f.name !== nombre))
  }

  const pasos = ['bienvenida', 'recoger_email', 'recoger_problema', 'procesar', 'fin']
  const progreso = Math.round((pasos.indexOf(sesion.paso) / (pasos.length - 1)) * 100)

  const placeholderTexto =
    sesion.paso === 'recoger_email' ? '¿Cómo te llamas?' :
    sesion.paso === 'recoger_problema' ? 'Tu email de contacto...' :
    sesion.paso === 'procesar' ? 'Describe tu problema en detalle...' :
    'Escribe aquí...'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1a1040 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: '720px',
        padding: '1rem 1.5rem 0',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}>
          {/* Icono SVG personalizado */}
          <img src="/bot-icon-new.png" alt="IracheBot" width={40} height={40}
            style={{ borderRadius: '10px' }} />
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#f1f5f9', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
              IracheBot
            </h1>
            <p style={{ color: '#22c55e', fontSize: '0.7rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              En línea · Servicio de Consumo de Navarra
            </p>
          </div>
          <a href="/" style={{
            color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none',
            border: '1px solid #334155', borderRadius: '8px', padding: '0.3rem 0.8rem',
            transition: 'all 0.2s',
          }}>← Volver</a>
        </div>

        {/* Barra de progreso */}
        <div style={{ height: '3px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progreso}%`,
            background: 'linear-gradient(90deg, #4f46e5, #a855f7)',
            borderRadius: '2px',
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.3rem 0 0.5rem' }}>
          {pasos.slice(0, -1).map((p, i) => (
            <span key={p} style={{
              fontSize: '0.65rem',
              color: pasos.indexOf(sesion.paso) > i ? '#a855f7' : '#334155',
              fontWeight: pasos.indexOf(sesion.paso) === i + 1 ? 700 : 400,
            }}>
              {['Inicio', 'Nombre', 'Email', 'Problema'][i]}
            </span>
          ))}
          <span style={{ fontSize: '0.65rem', color: sesion.paso === 'fin' ? '#22c55e' : '#334155' }}>
            ✅ Enviado
          </span>
        </div>
      </div>

      {/* ── MENSAJES ───────────────────────────────────── */}
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '720px',
        padding: '0.5rem 1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        minHeight: 'calc(100vh - 180px)',
        maxHeight: 'calc(100vh - 180px)',
      }}>
        {mensajes.map((msg, i) => (
          <div key={i}>
            <div style={{
              display: 'flex',
              justifyContent: msg.rol === 'usuario' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: '0.5rem',
            }}>
              {msg.rol === 'bot' && (
                <img src="/bot-icon-new.png" alt="bot" width={28} height={28}
                  style={{ borderRadius: '8px', flexShrink: 0 }} />
              )}
              <div style={{
                maxWidth: '78%',
                padding: '0.75rem 1rem',
                borderRadius: msg.rol === 'usuario' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.esArchivo
                  ? 'rgba(79,70,229,0.15)'
                  : msg.rol === 'usuario'
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : 'rgba(30,41,59,0.9)',
                border: msg.esArchivo ? '1px dashed #4f46e5' : 'none',
                color: '#f1f5f9',
                fontSize: '0.9rem',
                lineHeight: 1.65,
                whiteSpace: 'pre-line',
                backdropFilter: 'blur(10px)',
              }}>
                {msg.contenido}
                {msg.esArchivo && (
                  <button
                    onClick={() => eliminarArchivo(msg.nombreArchivo || '')}
                    style={{
                      display: 'block',
                      marginTop: '0.4rem',
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >✕ Eliminar adjunto</button>
                )}
              </div>
            </div>

            {/* Opciones seleccionables */}
            {msg.rol === 'bot' && msg.opciones && msg.opciones.length > 0 && i === mensajes.length - 1 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '0.6rem',
                marginLeft: '2.25rem',
              }}>
                {msg.opciones.map((op, j) => (
                  <button
                    key={j}
                    onClick={() => enviarMensaje(op)}
                    disabled={cargando}
                    style={{
                      background: 'rgba(79,70,229,0.15)',
                      border: '1px solid rgba(99,102,241,0.5)',
                      borderRadius: '20px',
                      padding: '0.4rem 1rem',
                      color: '#a5b4fc',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLButtonElement).style.background = 'rgba(79,70,229,0.35)'
                      ;(e.target as HTMLButtonElement).style.color = '#fff'
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLButtonElement).style.background = 'rgba(79,70,229,0.15)'
                      ;(e.target as HTMLButtonElement).style.color = '#a5b4fc'
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {cargando && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <img src="/bot-icon-new.png" alt="bot" width={28} height={28} style={{ borderRadius: '8px' }} />
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '16px 16px 16px 4px',
              background: 'rgba(30,41,59,0.9)',
              display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(n => (
                <div key={n} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#6366f1',
                  animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── ARCHIVOS ADJUNTOS PENDIENTES ───────────────── */}
      {archivosAdjuntos.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '720px',
          padding: '0.5rem 1.5rem 0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          {archivosAdjuntos.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(79,70,229,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: '8px',
              padding: '0.3rem 0.75rem',
              color: '#a5b4fc',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              📎 {f.name}
              <button onClick={() => eliminarArchivo(f.name)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── INPUT ──────────────────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: '720px',
        padding: '0.75rem 1.5rem 1.5rem',
        borderTop: '1px solid rgba(51,65,85,0.5)',
      }}>
        {sesion.paso === 'fin' ? (
          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white', border: 'none', borderRadius: '12px',
              padding: '0.875rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            }}
          >🔄 Nueva Reclamación</button>
        ) : (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>

            {/* Botón adjuntar */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={manejarArchivo}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar documento (evita datos sensibles)"
              style={{
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.75rem',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.1rem',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
            >
              📎
            </button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje(input)}
              placeholder={placeholderTexto}
              disabled={cargando}
              style={{
                flex: 1,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#f1f5f9',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#334155')}
            />

            <button
              onClick={() => enviarMensaje(input)}
              disabled={cargando || !input.trim()}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white', border: 'none', borderRadius: '10px',
                padding: '0.75rem 1.1rem', fontSize: '1.1rem',
                cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: cargando || !input.trim() ? 0.5 : 1,
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >➤</button>
          </div>
        )}

        {/* Aviso privacidad */}
        <p style={{
          color: '#475569', fontSize: '0.65rem',
          textAlign: 'center', margin: '0.5rem 0 0',
        }}>
          🔒 Tus datos están protegidos · Evita compartir NIFs, cuentas bancarias o contraseñas
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

