'use client'

import { useRouter } from 'next/navigation'
import { MessageSquare, Shield, Zap, Clock, ChevronRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 60%, #0d0820 100%)',
      fontFamily: 'system-ui, sans-serif',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>

      {/* Logo */}
      <div style={{
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', marginBottom: '1.5rem',
        boxShadow: '0 0 40px rgba(99,102,241,0.3)',
      }}>
        🤖
      </div>

      {/* Título */}
      <h1 style={{
        margin: '0 0 0.5rem',
        fontSize: '2.5rem', fontWeight: 800,
        letterSpacing: '-0.03em', textAlign: 'center',
      }}>
        Irachе<span style={{ color: '#6366f1' }}>Bot</span>
      </h1>
      <p style={{
        margin: '0 0 3rem', color: '#475569',
        fontSize: '1.05rem', textAlign: 'center', maxWidth: '420px',
        lineHeight: 1.6,
      }}>
        Tu asistente para gestionar reclamaciones de telefonía, banca, energía y más.
      </p>

      {/* Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem', marginBottom: '3rem', maxWidth: '600px', width: '100%',
      }}>
        {[
          { Icon: Zap,     color: '#fbbf24', title: 'Rápido',   desc: 'Menos de 2 minutos' },
          { Icon: Shield,  color: '#34d399', title: 'Seguro',   desc: 'Datos protegidos'   },
          { Icon: Clock,   color: '#60a5fa', title: '24/7',     desc: 'Siempre disponible' },
        ].map(({ Icon, color, title, desc }) => (
          <div key={title} style={{
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', padding: '1.25rem',
            textAlign: 'center', backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: `${color}18`, border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}>
              <Icon size={18} color={color} />
            </div>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.9rem' }}>{title}</p>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.78rem' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Botón principal */}
      <button
        onClick={() => router.push('/chat')}
        style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border: 'none', borderRadius: '16px',
          padding: '1rem 2.5rem', color: 'white',
          fontSize: '1.05rem', fontWeight: 700,
          cursor: 'pointer', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(99,102,241,0.5)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(99,102,241,0.35)'
        }}
      >
        <MessageSquare size={20} />
        Iniciar Reclamación
        <ChevronRight size={18} />
      </button>

      {/* Link admin */}
      <button
        onClick={() => router.push('/admin')}
        style={{
          background: 'transparent', border: 'none',
          color: '#334155', fontSize: '0.82rem',
          cursor: 'pointer', textDecoration: 'underline',
          textDecorationColor: '#1e293b',
        }}
      >
        Acceso administrador
      </button>

    </div>
  )
}




