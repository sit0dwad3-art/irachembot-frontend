// frontend/components/RealtimeStatus.tsx
'use client'

type Props = {
  conectado: boolean
}

export function RealtimeStatus({ conectado }: Props) {
  return (
    <div style={{
      display:    'inline-flex',
      alignItems: 'center',
      gap:        '0.45rem',
      background: conectado ? '#022c22' : '#1c0a0a',
      border:     `1px solid ${conectado ? '#065f46' : '#7f1d1d'}`,
      borderRadius: '20px',
      padding:    '0.28rem 0.75rem',
    }}>
      <span style={{
        width:        '6px',
        height:       '6px',
        borderRadius: '50%',
        background:   conectado ? '#34d399' : '#f87171',
        boxShadow:    conectado
          ? '0 0 6px rgba(52,211,153,0.7)'
          : '0 0 6px rgba(248,113,113,0.7)',
        display:      'inline-block',
        animation:    conectado ? 'rtPulse 2s ease-in-out infinite' : 'none',
      }} />
      <span style={{
        fontSize:   '0.72rem',
        fontWeight: 600,
        color:      conectado ? '#34d399' : '#f87171',
      }}>
        {conectado ? 'Tiempo real activo' : 'Reconectando...'}
      </span>
      <style>{`
        @keyframes rtPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(52,211,153,0.7); }
          50%       { opacity: 0.5; box-shadow: none; }
        }
      `}</style>
    </div>
  )
}

