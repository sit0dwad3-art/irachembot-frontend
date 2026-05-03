'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  MessageSquare, Shield, Zap, Clock,
  ChevronRight, Star, TrendingUp, Users, Award, MapPin, Compass
} from 'lucide-react'
import FloatingComplaints from '@/components/FloatingComplaints'

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --indigo:   #6366f1;
    --violet:   #7c3aed;
    --emerald:  #10b981;
    --teal:     #059669;
    --slate-50: #f8fafc;
    --slate-400:#94a3b8;
    --slate-500:#64748b;
    --slate-600:#475569;
    --slate-700:#334155;
    --slate-800:#1e293b;
    --slate-900:#0f172a;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #060b18;
    color: #f1f5f9;
    overflow-x: hidden;
  }

  ::selection { background: rgba(99,102,241,0.35); color: #fff; }

  /* ── Robot animations ── */
  @keyframes tilt-left  { 0%,100%{transform:rotate(0deg)}  50%{transform:rotate(-12deg)} }
  @keyframes tilt-right { 0%,100%{transform:rotate(0deg)}  50%{transform:rotate(12deg)}  }
  @keyframes nod {
    0%,100%{transform:translateY(0)}
    40%    {transform:translateY(-12px)}
    70%    {transform:translateY(5px)}
  }
  @keyframes blink {
    0%,88%,100%{ filter: drop-shadow(0 0 32px rgba(99,102,241,.7)) brightness(1);   }
    94%        { filter: drop-shadow(0 0 32px rgba(99,102,241,.7)) brightness(0.05);}
  }
  @keyframes robot-float {
    0%,100%{ transform: translateY(0px);   }
    50%    { transform: translateY(-8px);  }
  }
  @keyframes sway {
    0%  { transform: rotate(-6deg) translateY(0);    }
    25% { transform: rotate(6deg)  translateY(-6px); }
    50% { transform: rotate(-4deg) translateY(0);    }
    75% { transform: rotate(4deg)  translateY(-4px); }
    100%{ transform: rotate(-6deg) translateY(0);    }
  }
  @keyframes pop-in {
    0%  { opacity:0; transform:scale(0.3) translateY(30px); }
    65% { transform:scale(1.08); }
    100%{ opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes pulse-dot {
    0%,100%{ opacity:1; box-shadow:0 0 0 0 rgba(34,197,94,0.5); }
    50%    { opacity:.6; box-shadow:0 0 0 6px rgba(34,197,94,0); }
  }
  @keyframes shimmer {
    0%  { background-position: -200% center; }
    100%{ background-position:  200% center; }
  }
  @keyframes fade-up {
    from{ opacity:0; transform:translateY(24px); }
    to  { opacity:1; transform:translateY(0);    }
  }
  @keyframes glow-pulse {
    0%,100%{ opacity:.5; }
    50%    { opacity:1;  }
  }
  @keyframes spin-slow {
    from{ transform:rotate(0deg);   }
    to  { transform:rotate(360deg); }
  }

  .rg-tilt-left  { animation: tilt-left  .65s ease !important; }
  .rg-tilt-right { animation: tilt-right .65s ease !important; }
  .rg-nod        { animation: nod        .65s ease !important; }
  .rg-blink      { animation: blink      .45s ease !important; }
  .rg-float      { animation: robot-float 3.5s ease-in-out infinite; }
  .rg-sway       { animation: sway 2.8s ease-in-out infinite !important; }
  .rg-popin      { animation: pop-in .5s cubic-bezier(.34,1.56,.64,1) forwards; }

  .fade-up       { animation: fade-up .7s ease both; }
  .fade-up-1     { animation: fade-up .7s .1s ease both; }
  .fade-up-2     { animation: fade-up .7s .2s ease both; }
  .fade-up-3     { animation: fade-up .7s .3s ease both; }
  .fade-up-4     { animation: fade-up .7s .4s ease both; }

  .shimmer-text {
    background: linear-gradient(90deg, #6366f1 0%, #a78bfa 40%, #6366f1 60%, #a78bfa 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  .card-hover {
    transition: transform .3s cubic-bezier(.4,0,.2,1),
                box-shadow .3s ease,
                border-color .3s ease;
  }
  .card-hover:hover {
    transform: translateY(-5px);
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #060b18; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,.4); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,.7); }
`

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLES
// ─────────────────────────────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    const COLORS = ['#4f46e5','#7c3aed','#6366f1','#a78bfa','#818cf8','#38bdf8']
    const pts = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.6 + .3,
      a: Math.random() * .45 + .08,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 130) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(99,102,241,${.07*(1-d/130)})`
            ctx.lineWidth = .5
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = p.c + Math.floor(p.a*255).toString(16).padStart(2,'0')
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix='' }: { target:number; suffix?:string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      let s = 0
      const step = target / 60
      const t = setInterval(() => {
        s += step
        if (s >= target) { setCount(target); clearInterval(t) }
        else setCount(Math.floor(s))
      }, 16)
      obs.disconnect()
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name:'María G.',  sector:'Telefonía', stars:5, text:'Resolví mi reclamación en 48h. Increíble servicio.' },
  { name:'Carlos M.', sector:'Banca',     stars:5, text:'Me devolvieron 340€ que creía perdidos para siempre.' },
  { name:'Ana R.',    sector:'Energía',   stars:5, text:'El proceso fue guiado, claro y muy sencillo.' },
  { name:'Javier P.', sector:'Turismo',   stars:5, text:'Recuperé mi reserva cancelada sin ningún esfuerzo.' },
]
const SECTORS = [
  { emoji:'📱', label:'Telefonía',  color:'#7c3aed' },
  { emoji:'🏦', label:'Banca',      color:'#2563eb' },
  { emoji:'⚡', label:'Energía',    color:'#d97706' },
  { emoji:'✈️', label:'Transporte', color:'#059669' },
  { emoji:'🛡️', label:'Seguros',    color:'#dc2626' },
  { emoji:'🎵', label:'Música',     color:'#db2777' },
  { emoji:'🎨', label:'Arte',       color:'#9333ea' },
  { emoji:'🏨', label:'Turismo',    color:'#16a34a' },
  { emoji:'📦', label:'E-commerce', color:'#0891b2' },
]

// ─────────────────────────────────────────────────────────────────────────────
// ROBOT HEAD  ← vive en el flujo del DOM, sin flotar encima del texto
// ─────────────────────────────────────────────────────────────────────────────
function RobotHead() {
  const robotRef = useRef<HTMLDivElement>(null)
  const [gesture,  setGesture]  = useState('')
  const [rotation, setRotation] = useState({ x:0, y:0 })
  const [scrolled, setScrolled] = useState(false)

  // SCROLL
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 160)
    window.addEventListener('scroll', fn, { passive:true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // CURSOR 3D (solo en hero)
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (scrolled || !robotRef.current) return
      const r  = robotRef.current.getBoundingClientRect()
      const cx = r.left + r.width  / 2
      const cy = r.top  + r.height / 2
      setRotation({
        x: ((e.clientY - cy) / window.innerHeight) * 18,
        y: ((e.clientX - cx) / window.innerWidth)  * -18,
      })
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [scrolled])

  // GESTOS cada 5s
  useEffect(() => {
    const list = ['tilt-left','tilt-right','nod','blink']
    const id = setInterval(() => {
      if (scrolled) return
      const g = list[Math.floor(Math.random() * list.length)]
      setGesture(g)
      setTimeout(() => setGesture(''), 750)
    }, 5000)
    return () => clearInterval(id)
  }, [scrolled])

  return (
    <>
      {/* ── HERO MODE: en el flujo, entre badge y título ── */}
      {!scrolled && (
        <div
          ref={robotRef}
          className={`rg-float${gesture ? ` rg-${gesture}` : ''}`}
          style={{
            width: '130px', height: '130px',
            margin: '0.5rem 0 1.75rem',
            flexShrink: 0,
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            filter: 'drop-shadow(0 0 36px rgba(99,102,241,0.65)) drop-shadow(0 0 12px rgba(167,139,250,0.4))',
            transition: 'transform .08s ease',
            cursor: 'default',
            perspective: '600px',
          }}
        >
          {/* Anillo de luz giratorio detrás del robot */}
          <div style={{
            position: 'absolute', inset: '-18px',
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.25)',
            animation: 'spin-slow 12s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', top: '4px', left: '50%',
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#6366f1',
              boxShadow: '0 0 8px #6366f1',
              transform: 'translateX(-50%)',
            }} />
          </div>
          {/* Segundo anillo */}
          <div style={{
            position: 'absolute', inset: '-10px',
            borderRadius: '50%',
            border: '1px solid rgba(167,139,250,0.15)',
            animation: 'spin-slow 8s linear infinite reverse',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', bottom: '2px', left: '50%',
              width: '4px', height: '4px', borderRadius: '50%',
              background: '#a78bfa',
              boxShadow: '0 0 6px #a78bfa',
              transform: 'translateX(-50%)',
            }} />
          </div>
          <img
            src="/bot-icon-new.png"
            alt="IracheBot"
            style={{ width:'100%', height:'100%', objectFit:'contain', pointerEvents:'none', position:'relative', zIndex:1 }}
          />
        </div>
      )}

      {/* ── SCROLL MODE: fixed esquina inferior derecha ── */}
      {scrolled && (
        <div
          className="rg-sway rg-popin"
          style={{
            position: 'fixed', bottom:'24px', right:'24px',
            width:'72px', height:'72px', zIndex:9999,
            filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.7))',
            cursor: 'pointer',
            transition: 'transform .2s ease',
          }}
          onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.18)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          title="Volver arriba"
        >
          {/* Tooltip */}
          <div style={{
            position: 'absolute', bottom:'calc(100% + 10px)', right:0,
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '8px', padding: '5px 10px',
            fontSize: '0.7rem', fontFamily:'Inter,sans-serif',
            color: '#a5b4fc', whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            ↑ Volver arriba
          </div>
          <img
            src="/bot-icon-new.png"
            alt="IracheBot"
            style={{ width:'100%', height:'100%', objectFit:'contain', pointerEvents:'none' }}
          />
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER helper
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, highlight, sub }: { title:string; highlight:string; sub:string }) {
  return (
    <div style={{ textAlign:'center', marginBottom:'3rem' }}>
      <h2 style={{ fontSize:'clamp(1.6rem,3vw,2rem)', fontWeight:800, letterSpacing:'-0.03em', marginBottom:'.5rem' }}>
        {title} <span className="shimmer-text">{highlight}</span>
      </h2>
      <p style={{ color:'#475569', fontSize:'.95rem', maxWidth:'480px', margin:'0 auto' }}>{sub}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#060b18 0%,#080d1c 50%,#0c0818 100%)',
        color: '#f1f5f9', overflowX: 'hidden', position: 'relative',
      }}>
        <Particles />

        {/* Orbes ambientales */}
        <div style={{
          position:'fixed', top:'-220px', left:'-220px',
          width:'700px', height:'700px', borderRadius:'50%',
          background:'radial-gradient(circle,rgba(79,70,229,0.1) 0%,transparent 70%)',
          pointerEvents:'none', zIndex:0, animation:'glow-pulse 6s ease-in-out infinite',
        }}/>
        <div style={{
          position:'fixed', bottom:'-180px', right:'-180px',
          width:'600px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(circle,rgba(5,150,105,0.07) 0%,transparent 70%)',
          pointerEvents:'none', zIndex:0, animation:'glow-pulse 8s ease-in-out infinite reverse',
        }}/>
        <div style={{
          position:'fixed', top:'40%', left:'-100px',
          width:'400px', height:'400px', borderRadius:'50%',
          background:'radial-gradient(circle,rgba(124,58,237,0.05) 0%,transparent 70%)',
          pointerEvents:'none', zIndex:0,
        }}/>

        <FloatingComplaints />

        {/* ── Contenido principal ── */}
        <div style={{
          position:'relative', zIndex:1,
          display:'flex', flexDirection:'column', alignItems:'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity .9s ease, transform .9s ease',
        }}>

          {/* ════════════════════════════════════════
              HERO
          ════════════════════════════════════════ */}
          <section style={{
            minHeight:'100vh',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'2rem', textAlign:'center',
            maxWidth:'780px', margin:'0 auto', width:'100%',
          }}>

            {/* Badge */}
            <div className="fade-up" style={{
              display:'inline-flex', alignItems:'center', gap:'8px',
              background:'rgba(79,70,229,0.12)',
              border:'1px solid rgba(99,102,241,0.28)',
              borderRadius:'100px', padding:'7px 18px',
              marginBottom:'1.25rem', fontSize:'.75rem',
              color:'#a5b4fc', letterSpacing:'.07em', fontWeight:700,
              backdropFilter:'blur(8px)',
            }}>
              <span style={{
                width:'7px', height:'7px', borderRadius:'50%',
                background:'#22c55e', display:'inline-block',
                animation:'pulse-dot 2s infinite',
              }}/>
              SERVICIO DE CONSUMO DE NAVARRA · EN LÍNEA
            </div>

            {/* ── ROBOT — en el flujo, entre badge y título ── */}
            <RobotHead />

            {/* Título */}
            <h1 className="fade-up-1" style={{
              margin:'0 0 1.1rem',
              fontSize:'clamp(3rem,7vw,4.5rem)',
              fontWeight:900, letterSpacing:'-0.05em', lineHeight:1,
            }}>
              Irache<span style={{
                background:'linear-gradient(135deg,#6366f1,#a78bfa,#818cf8)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>Bot</span>
            </h1>

            {/* Subtítulo */}
            <p className="fade-up-2" style={{
              margin:'0 0 0.6rem',
              fontSize:'clamp(1rem,2.5vw,1.18rem)',
              color:'#64748b', lineHeight:1.75, maxWidth:'500px',
            }}>
              Tu asistente inteligente para gestionar{' '}
              <span style={{ color:'#94a3b8', fontWeight:600 }}>reclamaciones</span>{' '}
              y descubrir{' '}
              <span style={{ color:'#94a3b8', fontWeight:600 }}>Navarra</span>.
            </p>
            <p className="fade-up-2" style={{ margin:'0 0 1.75rem', fontSize:'.95rem', color:'#475569' }}>
              Rápido, gratuito y disponible 24/7.
            </p>

            {/* Estrellas */}
            <div className="fade-up-3" style={{
              display:'flex', alignItems:'center', gap:'6px', marginBottom:'2.5rem',
              background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.15)',
              borderRadius:'100px', padding:'6px 16px',
            }}>
              {[...Array(5)].map((_,i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24"/>)}
              <span style={{ color:'#78716c', fontSize:'.8rem', marginLeft:'4px' }}>
                +1.200 reclamaciones resueltas
              </span>
            </div>

            {/* CTA buttons */}
            <div className="fade-up-4" style={{
              display:'flex', gap:'14px', flexWrap:'wrap',
              justifyContent:'center', marginBottom:'1.25rem',
            }}>
              <HeroButton
                label="Iniciar Reclamación"
                icon={<MessageSquare size={18}/>}
                gradient="linear-gradient(135deg,#4f46e5,#7c3aed)"
                hoverGradient="linear-gradient(135deg,#4338ca,#6d28d9)"
                shadow="rgba(99,102,241,0.4)"
                onClick={() => router.push('/chat')}
              />
              <HeroButton
                label="Descubrir viajando"
                icon={<Compass size={18}/>}
                gradient="linear-gradient(135deg,#059669,#10b981)"
                hoverGradient="linear-gradient(135deg,#047857,#059669)"
                shadow="rgba(5,150,105,0.4)"
                onClick={() => router.push('/turismo')}
              />
            </div>

            {/* Labels */}
            <div style={{ display:'flex', gap:'20px', flexWrap:'wrap', justifyContent:'center', marginBottom:'1.5rem' }}>
              {[
                { dot:'#ef4444', text:'Reclamaciones de consumo' },
                { dot:'#22c55e', text:'Turismo, ocio y actividades' },
              ].map(({ dot, text }) => (
                <span key={text} style={{ color:'#334155', fontSize:'.75rem', display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:dot, display:'inline-block' }}/>
                  {text}
                </span>
              ))}
            </div>

            <button
              onClick={() => router.push('/admin')}
              style={{
                background:'transparent', border:'none',
                color:'#1e293b', fontSize:'.78rem', cursor:'pointer',
                transition:'color .2s', fontFamily:'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
              onMouseLeave={e => (e.currentTarget.style.color = '#1e293b')}
            >
              Acceso administrador →
            </button>
          </section>

          {/* ════════════════════════════════════════
              MÓDULOS
          ════════════════════════════════════════ */}
          <section style={{ width:'100%', maxWidth:'960px', padding:'0 2rem 6rem' }}>
            <SectionHeader
              title="¿Qué puedo hacer"
              highlight="con IracheBot?"
              sub="Dos servicios en uno. Elige lo que necesitas ahora mismo."
            />
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',
              gap:'1.5rem',
            }}>
              <ModuleCard
                onClick={() => router.push('/chat')}
                accentColor="#6366f1"
                icon={<MessageSquare size={26} color="white"/>}
                iconBg="linear-gradient(135deg,#4f46e5,#7c3aed)"
                iconShadow="rgba(79,70,229,0.4)"
                title="🔴 Reclamaciones"
                desc="Gestiona tu reclamación como consumidor en Navarra. Telefonía, energía, banca, turismo y más."
                tags={['📱 Telefonía','⚡ Energía','🏦 Banca','✈️ Transporte']}
                tagColor="#a5b4fc"
                tagBg="rgba(79,70,229,0.12)"
                tagBorder="rgba(99,102,241,0.2)"
              />
              <ModuleCard
                onClick={() => router.push('/turismo')}
                accentColor="#10b981"
                icon={<Compass size={26} color="white"/>}
                iconBg="linear-gradient(135deg,#059669,#10b981)"
                iconShadow="rgba(5,150,105,0.4)"
                title="🟢 Turismo & Ocio"
                desc="Descubre Navarra con un plan personalizado. Destinos, actividades, hospedaje y gastronomía."
                tags={['🏔️ Pirineo','🍷 Ribera','🌿 Irati','🛤️ Camino']}
                tagColor="#6ee7b7"
                tagBg="rgba(5,150,105,0.12)"
                tagBorder="rgba(5,150,105,0.2)"
              />
            </div>
          </section>

          {/* ════════════════════════════════════════
              STATS
          ════════════════════════════════════════ */}
          <section style={{ width:'100%', maxWidth:'960px', padding:'0 2rem 6rem' }}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',
              gap:'1.25rem',
            }}>
              {[
                { Icon:Users,      color:'#6366f1', value:1247, suffix:'+', label:'Usuarios atendidos'     },
                { Icon:TrendingUp, color:'#22c55e', value:94,   suffix:'%', label:'Tasa de resolución'     },
                { Icon:Clock,      color:'#60a5fa', value:48,   suffix:'h', label:'Tiempo medio respuesta' },
                { Icon:MapPin,     color:'#10b981', value:5,    suffix:'',  label:'Destinos en Navarra'    },
              ].map(({ Icon, color, value, suffix, label }) => (
                <div key={label} className="card-hover" style={{
                  background:'rgba(10,15,30,0.8)',
                  border:`1px solid rgba(30,41,59,0.8)`,
                  borderRadius:'20px', padding:'1.75rem 1.5rem',
                  textAlign:'center', backdropFilter:'blur(20px)',
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = `${color}44`
                    el.style.boxShadow = `0 20px 60px ${color}18, inset 0 1px 0 rgba(255,255,255,0.04)`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'rgba(30,41,59,0.8)'
                    el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}
                >
                  <div style={{
                    width:'50px', height:'50px', borderRadius:'15px',
                    background:`${color}14`, border:`1px solid ${color}28`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 1rem',
                  }}>
                    <Icon size={22} color={color}/>
                  </div>
                  <p style={{ margin:'0 0 .3rem', fontSize:'2.2rem', fontWeight:900, color:'#f1f5f9', letterSpacing:'-0.04em', lineHeight:1 }}>
                    <AnimatedCounter target={value} suffix={suffix}/>
                  </p>
                  <p style={{ margin:0, color:'#334155', fontSize:'.8rem', fontWeight:500 }}>{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════
              FEATURES
          ════════════════════════════════════════ */}
          <section style={{ width:'100%', maxWidth:'960px', padding:'0 2rem 6rem' }}>
            <SectionHeader
              title="¿Por qué"
              highlight="IracheBot?"
              sub="Diseñado para que cualquier ciudadano de Navarra pueda reclamar y explorar sin complicaciones."
            />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:'1.25rem' }}>
              {[
                { Icon:Zap,           color:'#fbbf24', title:'Proceso en 2 minutos',   desc:'Guiado paso a paso. Sin formularios complejos ni burocracia.' },
                { Icon:Shield,        color:'#34d399', title:'Datos 100% protegidos',  desc:'Cifrado de extremo a extremo. Tu información nunca se comparte.' },
                { Icon:Clock,         color:'#60a5fa', title:'Disponible 24/7',        desc:'Reclama o planifica cuando quieras, desde cualquier dispositivo.' },
                { Icon:MessageSquare, color:'#a78bfa', title:'Respuesta inteligente',  desc:'IA entrenada en normativa de consumo y turismo de Navarra.' },
                { Icon:Compass,       color:'#10b981', title:'Planes de viaje en PDF', desc:'Recibe tu plan personalizado por email con destinos y rutas.' },
                { Icon:Award,         color:'#fb923c', title:'Totalmente gratuito',    desc:'Sin costes ocultos. El servicio es público y accesible.' },
              ].map(({ Icon, color, title, desc }) => (
                <div key={title} className="card-hover" style={{
                  background:'rgba(10,15,30,0.7)',
                  border:'1px solid rgba(30,41,59,0.7)',
                  borderRadius:'18px', padding:'1.6rem',
                  backdropFilter:'blur(16px)',
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = `${color}33`
                    el.style.boxShadow = `0 16px 48px ${color}12, inset 0 1px 0 rgba(255,255,255,0.05)`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'rgba(30,41,59,0.7)'
                    el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{
                    width:'46px', height:'46px', borderRadius:'14px',
                    background:`${color}14`, border:`1px solid ${color}28`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    marginBottom:'1rem',
                  }}>
                    <Icon size={20} color={color}/>
                  </div>
                  <p style={{ margin:'0 0 .4rem', fontWeight:700, fontSize:'.95rem', color:'#e2e8f0' }}>{title}</p>
                  <p style={{ margin:0, color:'#334155', fontSize:'.82rem', lineHeight:1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════
              SECTORES
          ════════════════════════════════════════ */}
          <section style={{ width:'100%', maxWidth:'960px', padding:'0 2rem 6rem', textAlign:'center' }}>
            <SectionHeader
              title="Sectores que"
              highlight="cubrimos"
              sub="Desde telefonía hasta turismo — si tienes una reclamación, estamos aquí."
            />
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'.75rem' }}>
              {SECTORS.map(({ emoji, label, color }) => (
                <div key={label} style={{
                  display:'flex', alignItems:'center', gap:'7px',
                  background:`${color}0e`, border:`1px solid ${color}2a`,
                  borderRadius:'100px', padding:'8px 18px',
                  fontSize:'.84rem', fontWeight:600, color:'#94a3b8',
                  transition:'transform .2s, background .2s, color .2s, box-shadow .2s',
                  cursor:'default',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'scale(1.07) translateY(-2px)'
                    el.style.background = `${color}1e`
                    el.style.color = '#e2e8f0'
                    el.style.boxShadow = `0 8px 24px ${color}20`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'scale(1) translateY(0)'
                    el.style.background = `${color}0e`
                    el.style.color = '#94a3b8'
                    el.style.boxShadow = 'none'
                  }}
                >
                  <span>{emoji}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════
              TESTIMONIOS
          ════════════════════════════════════════ */}
          <section style={{ width:'100%', maxWidth:'960px', padding:'0 2rem 6rem' }}>
            <SectionHeader
              title="Lo que dicen nuestros"
              highlight="usuarios"
              sub="Casos reales resueltos con IracheBot."
            />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'1.25rem' }}>
              {TESTIMONIALS.map(({ name, sector, stars, text }) => (
                <div key={name} style={{
                  background:'rgba(10,15,30,0.8)',
                  border:'1px solid rgba(30,41,59,0.8)',
                  borderRadius:'20px', padding:'1.6rem',
                  backdropFilter:'blur(16px)',
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,0.04)',
                  transition:'transform .3s, border-color .3s',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-4px)'
                    el.style.borderColor = 'rgba(99,102,241,0.3)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.borderColor = 'rgba(30,41,59,0.8)'
                  }}
                >
                  {/* Quote mark */}
                  <div style={{ fontSize:'2rem', lineHeight:1, color:'rgba(99,102,241,0.3)', marginBottom:'.5rem', fontFamily:'Georgia,serif' }}>"</div>
                  <div style={{ display:'flex', gap:'2px', marginBottom:'.75rem' }}>
                    {[...Array(stars)].map((_,i) => <Star key={i} size={12} fill="#fbbf24" color="#fbbf24"/>)}
                  </div>
                  <p style={{ margin:'0 0 1.25rem', color:'#94a3b8', fontSize:'.875rem', lineHeight:1.7, fontStyle:'italic' }}>
                    {text}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{
                      width:'34px', height:'34px', borderRadius:'50%',
                      background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'.82rem', fontWeight:800, color:'white',
                      flexShrink:0,
                    }}>
                      {name[0]}
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'.82rem', fontWeight:700, color:'#e2e8f0' }}>{name}</p>
                      <p style={{ margin:0, fontSize:'.72rem', color:'#334155' }}>{sector}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════
              CTA FINAL
          ════════════════════════════════════════ */}
          <section style={{ width:'100%', maxWidth:'960px', padding:'0 2rem 7rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1.5rem' }}>
              <CTACard
                gradient="linear-gradient(135deg,rgba(79,70,229,0.18),rgba(124,58,237,0.1))"
                border="rgba(99,102,241,0.25)"
                hoverBorder="rgba(99,102,241,0.5)"
                hoverShadow="rgba(79,70,229,0.15)"
                icon={<MessageSquare size={28} color="white"/>}
                iconBg="linear-gradient(135deg,#4f46e5,#7c3aed)"
                iconGlow="rgba(99,102,241,0.45)"
                title="¿Tienes una reclamación?"
                desc="En menos de 2 minutos registramos tu caso y empezamos a trabajar en él."
                btnLabel="Empezar — es gratis"
                btnBg="linear-gradient(135deg,#4f46e5,#7c3aed)"
                btnShadow="rgba(99,102,241,0.4)"
                btnHoverShadow="rgba(99,102,241,0.6)"
                onClick={() => router.push('/chat')}
              />
              <CTACard
                gradient="linear-gradient(135deg,rgba(5,150,105,0.18),rgba(16,185,129,0.08))"
                border="rgba(5,150,105,0.25)"
                hoverBorder="rgba(5,150,105,0.5)"
                hoverShadow="rgba(5,150,105,0.15)"
                icon={<Compass size={28} color="white"/>}
                iconBg="linear-gradient(135deg,#059669,#10b981)"
                iconGlow="rgba(5,150,105,0.45)"
                title="¿Quieres planificar tu viaje?"
                desc="Diseñamos tu plan personalizado: destino, actividades, hospedaje y gastronomía."
                btnLabel="Planificar viaje"
                btnBg="linear-gradient(135deg,#059669,#10b981)"
                btnShadow="rgba(5,150,105,0.4)"
                btnHoverShadow="rgba(5,150,105,0.6)"
                onClick={() => router.push('/turismo')}
              />
            </div>
          </section>

          {/* ════════════════════════════════════════
              FOOTER
          ════════════════════════════════════════ */}
          <footer style={{
            width:'100%',
            borderTop:'1px solid rgba(15,23,42,0.9)',
            padding:'2.5rem 2rem',
            textAlign:'center',
          }}>
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', marginBottom:'.6rem' }}>
              <div style={{
                width:'24px', height:'24px',
                background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <MessageSquare size={13} color="white"/>
              </div>
              <span style={{ fontWeight:700, fontSize:'.85rem', color:'#1e293b' }}>IracheBot</span>
            </div>
            <p style={{ margin:'0 0 .4rem', color:'#1e293b', fontSize:'.75rem' }}>
              © 2026 IracheBot · Servicio de Consumo de Navarra
            </p>
            <p style={{ margin:0, color:'#0f172a', fontSize:'.7rem' }}>
              Tus datos están protegidos · Evita compartir NIFs, cuentas bancarias o contraseñas
            </p>
          </footer>

        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function HeroButton({ label, icon, gradient, hoverGradient, shadow, onClick }: {
  label:string; icon:React.ReactNode
  gradient:string; hoverGradient:string; shadow:string
  onClick:()=>void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? hoverGradient : gradient,
        border:'none', borderRadius:'16px',
        padding:'1.05rem 2rem', color:'white',
        fontSize:'.97rem', fontWeight:700, cursor:'pointer',
        display:'flex', alignItems:'center', gap:'.55rem',
        fontFamily:'inherit',
        boxShadow: hov ? `0 20px 56px ${shadow}` : `0 8px 32px ${shadow}`,
        transform: hov ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
        transition:'all .25s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {icon}
      {label}
      <ChevronRight size={16} style={{
        transform: hov ? 'translateX(4px)' : 'translateX(0)',
        transition:'transform .25s',
      }}/>
    </button>
  )
}

function ModuleCard({ onClick, accentColor, icon, iconBg, iconShadow, title, desc, tags, tagColor, tagBg, tagBorder }: {
  onClick:()=>void; accentColor:string
  icon:React.ReactNode; iconBg:string; iconShadow:string
  title:string; desc:string; tags:string[]
  tagColor:string; tagBg:string; tagBorder:string
}) {
  return (
    <div
      onClick={onClick}
      className="card-hover"
      style={{
        background:`linear-gradient(145deg,rgba(10,15,30,0.9),rgba(15,20,40,0.7))`,
        border:`1px solid rgba(30,41,59,0.7)`,
        borderRadius:'24px', padding:'2.2rem',
        cursor:'pointer',
        backdropFilter:'blur(20px)',
        boxShadow:'inset 0 1px 0 rgba(255,255,255,0.04)',
        transition:'transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s, border-color .3s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${accentColor}44`
        el.style.boxShadow = `0 24px 72px ${accentColor}18, inset 0 1px 0 rgba(255,255,255,0.06)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(30,41,59,0.7)'
        el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.04)'
      }}
    >
      <div style={{
        width:'56px', height:'56px', borderRadius:'17px',
        background:iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:'1.4rem',
        boxShadow:`0 10px 30px ${iconShadow}`,
      }}>
        {icon}
      </div>
      <h3 style={{ margin:'0 0 .6rem', fontSize:'1.15rem', fontWeight:800, color:'#f1f5f9' }}>{title}</h3>
      <p style={{ margin:'0 0 1.4rem', color:'#334155', fontSize:'.875rem', lineHeight:1.7 }}>{desc}</p>
      <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
        {tags.map(tag => (
          <span key={tag} style={{
            background:tagBg, border:`1px solid ${tagBorder}`,
            borderRadius:'20px', padding:'3px 11px',
            fontSize:'.71rem', fontWeight:600, color:tagColor,
          }}>{tag}</span>
        ))}
      </div>
    </div>
  )
}

function CTACard({ gradient, border, hoverBorder, hoverShadow, icon, iconBg, iconGlow, title, desc, btnLabel, btnBg, btnShadow, btnHoverShadow, onClick }: {
  gradient:string; border:string; hoverBorder:string; hoverShadow:string
  icon:React.ReactNode; iconBg:string; iconGlow:string
  title:string; desc:string; btnLabel:string
  btnBg:string; btnShadow:string; btnHoverShadow:string
  onClick:()=>void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        background:gradient,
        border:`1px solid ${hov ? hoverBorder : border}`,
        borderRadius:'28px', padding:'2.75rem 2.25rem',
        textAlign:'center', backdropFilter:'blur(20px)',
        boxShadow: hov ? `0 32px 80px ${hoverShadow}` : 'none',
        transition:'border-color .3s, box-shadow .3s, transform .3s',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        width:'60px', height:'60px', borderRadius:'18px',
        background:iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 1.5rem',
        boxShadow:`0 0 40px ${iconGlow}`,
        transition:'box-shadow .3s',
      }}>
        {icon}
      </div>
      <h2 style={{ fontSize:'1.25rem', fontWeight:800, margin:'0 0 .7rem', letterSpacing:'-0.02em', color:'#f1f5f9' }}>
        {title}
      </h2>
      <p style={{ color:'#334155', marginBottom:'2rem', fontSize:'.875rem', lineHeight:1.75 }}>
        {desc}
      </p>
      <button
        onClick={onClick}
        style={{
          background:btnBg,
          border:'none', borderRadius:'14px',
          padding:'.9rem 2.2rem', color:'white',
          fontSize:'.95rem', fontWeight:700, cursor:'pointer',
          display:'inline-flex', alignItems:'center', gap:'.5rem',
          fontFamily:'inherit',
          boxShadow: hov ? `0 20px 56px ${btnHoverShadow}` : `0 8px 32px ${btnShadow}`,
          transform: hov ? 'scale(1.03)' : 'scale(1)',
          transition:'all .25s',
        }}
      >
        {btnLabel}
        <ChevronRight size={15}/>
      </button>
    </div>
  )
}
