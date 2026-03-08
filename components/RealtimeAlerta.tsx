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
    color: 'border-blue-500 bg-blue-500/10',
  },
  UPDATE: {
    emoji: '✏️',
    titulo: 'Reclamación actualizada',
    color: 'border-yellow-500 bg-yellow-500/10',
  },
  DELETE: {
    emoji: '🗑️',
    titulo: 'Reclamación eliminada',
    color: 'border-red-500 bg-red-500/10',
  },
}

export function RealtimeAlerta({ alerta }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (alerta) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 3800)
      return () => clearTimeout(timer)
    }
  }, [alerta])

  if (!visible || !alerta) return null

  const config = CONFIG[alerta.type]

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 
        border-l-4 rounded-lg p-4 
        shadow-2xl backdrop-blur-sm
        animate-slide-in
        ${config.color}
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.emoji}</span>
        <div>
          <p className="font-bold text-white text-sm">{config.titulo}</p>
          {alerta.reclamacion?.nombre && (
            <p className="text-gray-300 text-xs mt-1">
              👤 {alerta.reclamacion.nombre}
            </p>
          )}
          {alerta.reclamacion?.categoria && (
            <p className="text-gray-300 text-xs">
              📂 {alerta.reclamacion.categoria}
            </p>
          )}
          {alerta.reclamacion?.urgencia && (
            <p className="text-gray-300 text-xs">
              ⚡ {alerta.reclamacion.urgencia}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
