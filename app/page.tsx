'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  MessageSquare, Shield, Zap, Clock,
  ChevronRight, Star, TrendingUp, Users, Award, MapPin, Compass
} from 'lucide-react'
import FloatingComplaints from '@/components/FloatingComplaints'


// ── Partículas de fondo ───────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number; y: number; vx: number; vy: number
      r: number; alpha: number; color: string
    }[] = []

    const COLORS = ['#4f46e5', '#7c3aed', '#6366f1', '#a78bfa', '#818cf8']

    for (let i = 0; i < 80; i++) {
      particles.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    (Math.random() - 0.5) * 0.4,
        vy:    (Math.random() - 0.5) * 0.4,
        r:     Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.5 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
  )
}

// ── Contador animado ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      let start = 0
      const step  = target / 60
      const timer = setInterval(() => {
        start += step
        if (start >= target) { setCount(target); clearInterval(timer) }
        else setCount(Math.floor(start))
      }, 16)
      observer.disconnect()
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ── Datos ─────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'María G.',  sector: 'Telefonía', stars: 5, text: 'Resolví mi reclamación en 48h. Increíble.' },
  { name: 'Carlos M.', sector: 'Banca',     stars: 5, text: 'Me devolvieron 340€ que creía perdidos.' },
  { name: 'Ana R.',    sector: 'Energía',   stars: 5, text: 'El proceso fue guiado y muy sencillo.' },
  { name: 'Javier P.', sector: 'Turismo',   stars: 5, text: 'Recuperé mi reserva cancelada sin esfuerzo.' },
]

const SECTORS = [
  { emoji: '📱', label: 'Telefonía',  color: '#7c3aed' },
  { emoji: '🏦', label: 'Banca',      color: '#2563eb' },
  { emoji: '⚡', label: 'Energía',    color: '#d97706' },
  { emoji: '✈️', label: 'Transporte', color: '#059669' },
  { emoji: '🛡️', label: 'Seguros',    color: '#dc2626' },
  { emoji: '🎵', label: 'Música',     color: '#db2777' },
  { emoji: '🎨', label: 'Arte',       color: '#9333ea' },
  { emoji: '🏨', label: 'Turismo',    color: '#16a34a' },
  { emoji: '📦', label: 'E-commerce', color: '#0891b2' },
]
// ── Robot Head Animado ────────────────────────────────────────────────────────
function RobotHead() {
  const robotRef = useRef<HTMLDivElement>(null)
  const [gesture,  setGesture]  = useState('')
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [scrolled, setScrolled] = useState(false)

  // Ajusta este valor para subir/bajar en el hero (0.0 = top, 0.5 = mitad)
  const HERO_TOP  = 0.22
  const HERO_SIZE = 120
  const MINI_SIZE = 75

  // 1️⃣ SCROLL
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 150)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 2️⃣ CURSOR — inclinación 3D (solo en hero)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (scrolled || !robotRef.current) return
      const cx = window.innerWidth  / 2
      const cy = window.innerHeight * HERO_TOP + HERO_SIZE / 2
      const ax = ((e.clientY - cy) / window.innerHeight) * 15
      const ay = ((e.clientX - cx) / window.innerWidth)  * -15
      setRotation({ x: ax, y: ay })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [scrolled])

  // 3️⃣ GESTOS cada 5s (solo en hero)
  useEffect(() => {
    const list = ['tilt-left', 'tilt-right', 'nod', 'blink']
    const id = setInterval(() => {
      if (scrolled) return
      const g = list[Math.floor(Math.random() * list.length)]
      setGesture(g)
      setTimeout(() => setGesture(''), 700)
    }, 5000)
    return () => clearInterval(id)
  }, [scrolled])

  return (
    <>
      <style>{`
        @keyframes tilt-left  { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(-10deg)} }
        @keyframes tilt-right { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(10deg)}  }
        @keyframes nod        { 0%,100%{transform:translateY(0)}  40%{transform:translateY(-10px)} 70%{transform:translateY(4px)} }
        @keyframes blink      {
          0%,89%,100% { filter: drop-shadow(0 0 28px rgba(99,102,241,.55)) brightness(1);   }
          95%         { filter: drop-shadow(0 0 28px rgba(99,102,241,.55)) brightness(0.1); }
        }
        @keyframes sway {
          0%   { transform: rotate(-5deg) translateY(0);    }
          25%  { transform: rotate(5deg)  translateY(-5px); }
          50%  { transform: rotate(-3deg) translateY(0);    }
          75%  { transform: rotate(3deg)  translateY(-3px); }
          100% { transform: rotate(-5deg) translateY(0);    }
        }
        @keyframes pop-in {
          0%   { opacity: 0; transform: scale(0.4) translateY(20px); }
          70%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .rg-tilt-left  { animation: tilt-left  .6s ease !important; }
        .rg-tilt-right { animation: tilt-right .6s ease !important; }
        .rg-nod        { animation: nod        .6s ease !important; }
        .rg-blink      { animation: blink      .4s ease !important; }
        .rg-sway       { animation: sway 2.5s ease-in-out infinite !important; }
        .rg-popin      { animation: pop-in .45s cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>

      <div
        ref={robotRef}
        className={scrolled ? 'rg-sway rg-popin' : (gesture ? `rg-${gesture}` : '')}
        onClick={scrolled ? () => window.scrollTo({ top: 0, behavior: 'smooth' }) : undefined}
        title={scrolled ? 'Volver arriba' : ''}
        style={{
          position: 'fixed',

          // ── HERO: centrado, a HERO_TOP% de la pantalla ──
          left:   scrolled ? 'auto'                              : `calc(50% - ${HERO_SIZE / 2}px)`,
          right:  scrolled ? '28px'                             : 'auto',
          top:    scrolled ? 'auto'                             : `${HERO_TOP * 100}vh`,
          bottom: scrolled ? '28px'                             : 'auto',

          width:  `${scrolled ? MINI_SIZE : HERO_SIZE}px`,
          height: `${scrolled ? MINI_SIZE : HERO_SIZE}px`,

          zIndex:  9999,
          cursor:  scrolled ? 'pointer' : 'default',
          filter:  'drop-shadow(0 0 28px rgba(99,102,241,0.55))',

          transform: !scrolled
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
            : undefined,

          transition: [
            'left    .55s cubic-bezier(.34,1.56,.64,1)',
            'right   .55s cubic-bezier(.34,1.56,.64,1)',
            'top     .55s cubic-bezier(.34,1.56,.64,1)',
            'bottom  .55s cubic-bezier(.34,1.56,.64,1)',
            'width   .4s ease',
            'height  .4s ease',
            'transform .08s ease',
          ].join(', '),

          willChange: 'left, right, top, bottom, transform',
        }}
      >
        <img
          src="/bot-icon-new.png"
          alt="IracheBot"
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
      </div>
    </>
  )
}


// ── Componente principal ──────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const [btnHoverRec, setBtnHoverRec] = useState(false)
  const [btnHoverTur, setBtnHoverTur] = useState(false)
  const [visible,     setVisible]     = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 55%, #0d0820 100%)',
      fontFamily: "'system-ui', 'Segoe UI', sans-serif",
      color: '#f1f5f9', overflowX: 'hidden', position: 'relative',
    }}>

      <Particles />

      {/* Orbes */}
      <div style={{
        position: 'fixed', top: '-200px', left: '-200px',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-150px', right: '-150px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <FloatingComplaints />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>

        {/* ══════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════ */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          maxWidth: '760px', margin: '0 auto',
          position: 'relative',   // ← necesario para el absolute del robot
        }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(79,70,229,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '100px', padding: '6px 16px',
            marginBottom: '1.5rem', fontSize: '0.78rem',
            color: '#a5b4fc', letterSpacing: '0.05em', fontWeight: 600,
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 8px #22c55e',
              display: 'inline-block', animation: 'pulse 2s infinite',
            }} />
            SERVICIO DE CONSUMO DE NAVARRA · EN LÍNEA
          </div>

          {/* ── Robot Head — aparece aquí entre badge y título ── */}
          <RobotHead />

          {/* Título */}
          <h1 style={{
            margin: '0 0 1rem',
            fontSize: 'clamp(2.8rem, 6vw, 4rem)',
            fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05,
          }}>
            Irache<span style={{
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Bot</span>
          </h1>

          {/* Subtítulo */}
          <p style={{
            margin: '0 0 0.75rem',
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#94a3b8', lineHeight: 1.7, maxWidth: '520px',
          }}>
            Tu asistente inteligente para gestionar reclamaciones y descubrir viajando.
            <br />
            <span style={{ color: '#cbd5e1' }}>Rápido, gratuito y disponible 24/7.</span>
          </p>

          {/* Estrellas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2.5rem' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />)}
            <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '4px' }}>
              +1.200 reclamaciones resueltas
            </span>
          </div>

          {/* ── DUAL CTA ── */}
          <div style={{
            display: 'flex', gap: '16px', flexWrap: 'wrap',
            justifyContent: 'center', marginBottom: '1rem',
          }}>
            <button
              onClick={() => router.push('/chat')}
              onMouseEnter={() => setBtnHoverRec(true)}
              onMouseLeave={() => setBtnHoverRec(false)}
              style={{
                background: btnHoverRec
                  ? 'linear-gradient(135deg, #4338ca, #6d28d9)'
                  : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                border: 'none', borderRadius: '18px',
                padding: '1.1rem 2.2rem', color: 'white',
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: btnHoverRec
                  ? '0 16px 48px rgba(99,102,241,0.55)'
                  : '0 8px 32px rgba(99,102,241,0.35)',
                transform: btnHoverRec ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <MessageSquare size={19} />
              Iniciar Reclamación
              <ChevronRight size={17} style={{
                transform: btnHoverRec ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 0.25s',
              }} />
            </button>

            <button
              onClick={() => router.push('/turismo')}
              onMouseEnter={() => setBtnHoverTur(true)}
              onMouseLeave={() => setBtnHoverTur(false)}
              style={{
                background: btnHoverTur
                  ? 'linear-gradient(135deg, #047857, #059669)'
                  : 'linear-gradient(135deg, #059669, #10b981)',
                border: 'none', borderRadius: '18px',
                padding: '1.1rem 2.2rem', color: 'white',
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: btnHoverTur
                  ? '0 16px 48px rgba(5,150,105,0.55)'
                  : '0 8px 32px rgba(5,150,105,0.35)',
                transform: btnHoverTur ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <Compass size={19} />
              Descubrir viajando
              <ChevronRight size={17} style={{
                transform: btnHoverTur ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 0.25s',
              }} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{ color: '#475569', fontSize: '0.75rem' }}>🔴 Reclamaciones de consumo</span>
            <span style={{ color: '#475569', fontSize: '0.75rem' }}>🟢 Turismo, ocio y actividades</span>
          </div>

          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'transparent', border: 'none',
              color: '#334155', fontSize: '0.8rem', cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            Acceso administrador →
          </button>
        </section>

        {/* ══════════════════════════════════════════════════
            MÓDULOS
        ══════════════════════════════════════════════════ */}
        <section style={{
          width: '100%', maxWidth: '900px',
          padding: '0 2rem 5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          <div
            onClick={() => router.push('/chat')}
            style={{
              background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.08))',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '24px', padding: '2rem', cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(-4px)'
              el.style.boxShadow = '0 20px 60px rgba(79,70,229,0.2)'
              el.style.borderColor = 'rgba(99,102,241,0.5)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
              el.style.borderColor = 'rgba(99,102,241,0.25)'
            }}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
            }}>
              <MessageSquare size={24} color="white" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800 }}>🔴 Reclamaciones</h3>
            <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Gestiona tu reclamación como consumidor en Navarra. Telefonía, energía, banca, turismo y más.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['📱 Telefonía', '⚡ Energía', '🏦 Banca', '✈️ Transporte'].map(tag => (
                <span key={tag} style={{
                  background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', color: '#a5b4fc',
                }}>{tag}</span>
              ))}
            </div>
          </div>

          <div
            onClick={() => router.push('/turismo')}
            style={{
              background: 'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(16,185,129,0.06))',
              border: '1px solid rgba(5,150,105,0.25)',
              borderRadius: '24px', padding: '2rem', cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(-4px)'
              el.style.boxShadow = '0 20px 60px rgba(5,150,105,0.2)'
              el.style.borderColor = 'rgba(5,150,105,0.5)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
              el.style.borderColor = 'rgba(5,150,105,0.25)'
            }}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(5,150,105,0.35)',
            }}>
              <Compass size={24} color="white" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800 }}>🟢 Turismo & Ocio</h3>
            <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Descubre Navarra con un plan personalizado. Destinos, actividades, hospedaje y gastronomía.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['🏔️ Pirineo', '🍷 Ribera', '🌿 Irati', '🛤️ Camino'].map(tag => (
                <span key={tag} style={{
                  background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.2)',
                  borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', color: '#6ee7b7',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            STATS
        ══════════════════════════════════════════════════ */}
        <section style={{
          width: '100%', maxWidth: '900px', padding: '0 2rem 5rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem',
        }}>
          {[
            { Icon: Users,      color: '#6366f1', value: 1247, suffix: '+', label: 'Usuarios atendidos'     },
            { Icon: TrendingUp, color: '#22c55e', value: 94,   suffix: '%', label: 'Tasa de resolución'     },
            { Icon: Clock,      color: '#60a5fa', value: 48,   suffix: 'h', label: 'Tiempo medio respuesta' },
            { Icon: MapPin,     color: '#10b981', value: 5,    suffix: '',  label: 'Destinos en Navarra'    },
          ].map(({ Icon, color, value, suffix, label }) => (
            <div key={label} style={{
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(30,41,59,0.9)',
              borderRadius: '20px', padding: '1.75rem 1.5rem',
              textAlign: 'center', backdropFilter: 'blur(16px)',
              transition: 'border-color 0.3s, transform 0.3s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = `${color}55`
                el.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'rgba(30,41,59,0.9)'
                el.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: `${color}18`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Icon size={22} color={color} />
              </div>
              <p style={{ margin: '0 0 0.25rem', fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                <AnimatedCounter target={value} suffix={suffix} />
              </p>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.82rem' }}>{label}</p>
            </div>
          ))}
        </section>

        {/* ══════════════════════════════════════════════════
            FEATURES
        ══════════════════════════════════════════════════ */}
        <section style={{ width: '100%', maxWidth: '900px', padding: '0 2rem 5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            ¿Por qué <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IracheBot?</span>
          </h2>
          <p style={{ textAlign: 'center', color: '#475569', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            Diseñado para que cualquier ciudadano de Navarra pueda reclamar y explorar sin complicaciones.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {[
              { Icon: Zap,           color: '#fbbf24', title: 'Proceso en 2 minutos',   desc: 'Guiado paso a paso. Sin formularios complejos ni burocracia.' },
              { Icon: Shield,        color: '#34d399', title: 'Datos 100% protegidos',  desc: 'Cifrado de extremo a extremo. Tu información nunca se comparte.' },
              { Icon: Clock,         color: '#60a5fa', title: 'Disponible 24/7',        desc: 'Reclama o planifica cuando quieras, desde cualquier dispositivo.' },
              { Icon: MessageSquare, color: '#a78bfa', title: 'Respuesta inteligente',  desc: 'IA entrenada en normativa de consumo y turismo de Navarra.' },
              { Icon: Compass,       color: '#10b981', title: 'Planes de viaje en PDF', desc: 'Recibe tu plan personalizado por email con destinos, rutas y más.' },
              { Icon: Award,         color: '#fb923c', title: 'Totalmente gratuito',    desc: 'Sin costes ocultos. El servicio es público y accesible.' },
            ].map(({ Icon, color, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)',
                borderRadius: '18px', padding: '1.5rem', backdropFilter: 'blur(12px)',
                transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s', cursor: 'default',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = `${color}44`
                  el.style.transform = 'translateY(-3px)'
                  el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(30,41,59,0.8)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '13px',
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                }}>
                  <Icon size={20} color={color} />
                </div>
                <p style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>{title}</p>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.82rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            SECTORES
        ══════════════════════════════════════════════════ */}
        <section style={{ width: '100%', maxWidth: '900px', padding: '0 2rem 5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            Sectores que <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>cubrimos</span>
          </h2>
          <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Desde telefonía hasta turismo — si tienes una reclamación, estamos aquí.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            {SECTORS.map(({ emoji, label, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: `${color}12`, border: `1px solid ${color}33`,
                borderRadius: '100px', padding: '8px 18px',
                fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1',
                transition: 'transform 0.2s, background 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'scale(1.06)'
                  el.style.background = `${color}22`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'scale(1)'
                  el.style.background = `${color}12`
                }}
              >
                <span>{emoji}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            TESTIMONIOS
        ══════════════════════════════════════════════════ */}
        <section style={{ width: '100%', maxWidth: '900px', padding: '0 2rem 5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            Lo que dicen nuestros <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>usuarios</span>
          </h2>
          <p style={{ textAlign: 'center', color: '#475569', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Casos reales resueltos con IracheBot.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {TESTIMONIALS.map(({ name, sector, stars, text }) => (
              <div key={name} style={{
                background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(30,41,59,0.9)',
                borderRadius: '18px', padding: '1.5rem', backdropFilter: 'blur(12px)',
              }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '0.75rem' }}>
                  {[...Array(stars)].map((_, i) => <Star key={i} size={13} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <p style={{ margin: '0 0 1rem', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: 'white',
                  }}>
                    {name[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>{name}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>{sector}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            CTA FINAL — DUAL
        ══════════════════════════════════════════════════ */}
        <section style={{ width: '100%', maxWidth: '900px', padding: '0 2rem 6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

            <div style={{
              background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.1))',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '28px', padding: '2.5rem 2rem',
              textAlign: 'center', backdropFilter: 'blur(16px)',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', boxShadow: '0 0 32px rgba(99,102,241,0.4)',
              }}>
                <MessageSquare size={26} color="white" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.6rem', letterSpacing: '-0.02em' }}>
                ¿Tienes una reclamación?
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.75rem', fontSize: '0.875rem', lineHeight: 1.7 }}>
                En menos de 2 minutos registramos tu caso y empezamos a trabajar en él.
              </p>
              <button
                onClick={() => router.push('/chat')}
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  border: 'none', borderRadius: '14px', padding: '0.9rem 2rem', color: 'white',
                  fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.4)', transition: 'all 0.25s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 16px 48px rgba(99,102,241,0.55)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 8px 32px rgba(99,102,241,0.4)'
                }}
              >
                <MessageSquare size={17} />
                Empezar — es gratis
                <ChevronRight size={15} />
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(5,150,105,0.15), rgba(16,185,129,0.08))',
              border: '1px solid rgba(5,150,105,0.25)',
              borderRadius: '28px', padding: '2.5rem 2rem',
              textAlign: 'center', backdropFilter: 'blur(16px)',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', boxShadow: '0 0 32px rgba(5,150,105,0.4)',
              }}>
                <Compass size={26} color="white" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.6rem', letterSpacing: '-0.02em' }}>
                ¿Quieres programar tu viaje?
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.75rem', fontSize: '0.875rem', lineHeight: 1.7 }}>
                Diseñamos tu plan de viaje personalizado: destino, actividades, hospedaje y gastronomía.
              </p>
              <button
                onClick={() => router.push('/turismo')}
                style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  border: 'none', borderRadius: '14px', padding: '0.9rem 2rem', color: 'white',
                  fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 8px 32px rgba(5,150,105,0.4)', transition: 'all 0.25s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 16px 48px rgba(5,150,105,0.55)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 8px 32px rgba(5,150,105,0.4)'
                }}
              >
                <Compass size={17} />
                Planificar viaje
                <ChevronRight size={15} />
              </button>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════ */}
        <footer style={{
          width: '100%', borderTop: '1px solid rgba(30,41,59,0.6)',
          padding: '2rem', textAlign: 'center',
          color: '#334155', fontSize: '0.78rem',
        }}>
          <p style={{ margin: '0 0 0.5rem' }}>© 2026 IracheBot · Servicio de Consumo de Navarra</p>
          <p style={{ margin: 0, color: '#1e293b' }}>
            Tus datos están protegidos · Evita compartir NIFs, cuentas bancarias o contraseñas
          </p>
        </footer>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #22c55e; }
          50%       { opacity: 0.5; box-shadow: 0 0 3px #22c55e; }
        }
      `}</style>
    </div>
  )
}
