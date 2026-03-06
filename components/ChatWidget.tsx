'use client'
import { useState, useRef, useEffect } from 'react'
import { enviarMensaje } from '@/lib/api'
import { BotResponse, Mensaje } from '@/lib/types'

export default function ChatWidget() {
  const [abierto, setAbierto]       = useState(false)
  const [mensajes, setMensajes]     = useState<Mensaje[]>([])
  const [input, setInput]           = useState('')
  const [cargando, setCargando]     = useState(false)
  const [paso, setPaso]             = useState('bienvenida')
  const [sesionId, setSesionId]     = useState('')
  const [datosSesion, setDatosSesion] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mensaje inicial al abrir
  useEffect(() => {
    if (abierto && mensajes.length === 0) iniciarChat()
  }, [abierto])

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const iniciarChat = async () => {
    setCargando(true)
    const id = crypto.randomUUID()
    setSesionId(id)
    try {
      const res: BotResponse = await enviarMensaje({
        sesion_id: id,
        mensaje: '',
        paso: 'bienvenida',
        datos_sesion: {}
      })
      agregarMensaje('bot', res.respuesta)
      setPaso(res.siguiente_paso)
    } finally {
      setCargando(false)
    }
  }

  const agregarMensaje = (rol: 'usuario' | 'bot', contenido: string) => {
    setMensajes(prev => [...prev, { rol, contenido }])
  }

  const enviar = async () => {
    if (!input.trim() || cargando || paso === 'fin') return

    const texto = input.trim()
    setInput('')
    agregarMensaje('usuario', texto)
    setCargando(true)

    // Guardar datos de sesión según el paso actual
    let nuevosDatos = { ...datosSesion }
    if (paso === 'bienvenida')      nuevosDatos.nombre = texto
    if (paso === 'recoger_email')   nuevosDatos.email  = texto

    setDatosSesion(nuevosDatos)

    try {
      const res: BotResponse = await enviarMensaje({
        sesion_id: sesionId,
        mensaje: texto,
        paso,
        datos_sesion: nuevosDatos
      })
      agregarMensaje('bot', res.respuesta)
      setPaso(res.siguiente_paso)
    } catch {
      agregarMensaje('bot', '❌ Error de conexión. Por favor, inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      {/* Burbuja flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg
                   flex items-center justify-center text-2xl transition-transform
                   hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #1a56db, #0e9f6e)' }}
        aria-label="Abrir chat"
      >
        {abierto ? '✕' : '💬'}
      </button>

      {/* Ventana del chat */}
      {abierto && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl
                     shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '520px', background: '#fff', border: '1px solid #e5e7eb' }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1a56db, #0e9f6e)' }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <p className="text-white font-semibold text-sm">IracheBot</p>
              <p className="text-white/70 text-xs">Asistente de reclamaciones</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ background: '#f9fafb' }}>
            {mensajes.map((msg, i) => (
              <div key={i}
                className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={msg.rol === 'usuario'
                    ? { background: '#1a56db', color: '#fff', borderBottomRightRadius: '4px' }
                    : { background: '#fff', color: '#111', border: '1px solid #e5e7eb', borderBottomLeftRadius: '4px' }
                  }
                >
                  {msg.contenido}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-sm">
                  <span className="animate-pulse">✍️ Escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              placeholder={paso === 'fin' ? 'Caso registrado ✅' : 'Escribe aquí...'}
              disabled={cargando || paso === 'fin'}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm
                         focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
            />
            <button
              onClick={enviar}
              disabled={cargando || paso === 'fin' || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center
                         disabled:opacity-40 transition-opacity"
              style={{ background: '#1a56db' }}
            >
              <span className="text-white text-sm">→</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
