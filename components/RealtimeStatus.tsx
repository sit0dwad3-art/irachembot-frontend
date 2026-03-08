// frontend/components/RealtimeStatus.tsx
'use client'

type Props = {
  conectado: boolean
}

export function RealtimeStatus({ conectado }: Props) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`
          w-2 h-2 rounded-full 
          ${conectado
            ? 'bg-green-400 animate-pulse'
            : 'bg-red-400'
          }
        `}
      />
      <span className={conectado ? 'text-green-400' : 'text-red-400'}>
        {conectado ? 'Tiempo real activo' : 'Reconectando...'}
      </span>
    </div>
  )
}
