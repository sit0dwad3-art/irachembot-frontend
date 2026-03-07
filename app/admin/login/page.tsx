// frontend/app/admin/login/page.tsx
'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

// ── Componente INTERNO que usa useSearchParams ──
function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') || '/admin'

  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ password }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Contraseña incorrecta')
      }

      const { token, expires_in } = await res.json()

      const expires = new Date(Date.now() + expires_in * 1000)
      document.cookie = [
        `admin_session=${token}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        'SameSite=Strict',
      ].join('; ')

      router.push(from)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 60%, #0d0820 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(30,41,59,0.9)',
        borderRadius: '24px', padding: '2.5rem',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{
            margin: '0 0 0.25rem', fontSize: '1.5rem',
            fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em',
          }}>
            Acceso Admin
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem' }}>
            IracheBot · Panel de control
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block', fontSize: '0.8rem',
              color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600,
            }}>
              CONTRASEÑA
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)',
              }}>
                <Lock size={16} color="#475569" />
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Introduce la contraseña"
                autoFocus
                style={{
                  width: '100%', padding: '0.85rem 3rem 0.85rem 2.75rem',
                  background: 'rgba(30,41,59,0.6)',
                  border: `1px solid ${error ? '#ef4444' : 'rgba(51,65,85,0.8)'}`,
                  borderRadius: '12px', color: '#f1f5f9',
                  fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={e  => e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(51,65,85,0.8)'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {showPwd ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#fca5a5', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              width: '100%', padding: '0.95rem',
              background: loading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              border: 'none', borderRadius: '14px',
              color: 'white', fontSize: '1rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}
          >
            {loading ? '⏳ Verificando...' : '🔓 Entrar al panel'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '1.5rem',
          color: '#1e293b', fontSize: '0.75rem',
        }}>
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </div>
  )
}

// ── Export DEFAULT con Suspense wrapper ──
export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 60%, #0d0820 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#475569', fontFamily: 'system-ui, sans-serif',
      }}>
        Cargando...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
