'use client'

import { useEffect, useRef, useState } from 'react'

// ── Datos ────────────────────────────────────────────────────────────────────
const COMPLAINTS = [
  { text: 'Me están cobrando por algo que nunca contraté', sector: 'Telefonía',  emoji: '📱', color: '#7c3aed' },
  { text: '¿Cómo evito la multa por permanencia?',         sector: 'Telefonía',  emoji: '📱', color: '#7c3aed' },
  { text: 'Cargo duplicado en mi cuenta bancaria',         sector: 'Banca',      emoji: '🏦', color: '#2563eb' },
  { text: 'El banco me cobró comisiones abusivas',         sector: 'Banca',      emoji: '🏦', color: '#2563eb' },
  { text: 'Me estafaron en la factura del gas',            sector: 'Energía',    emoji: '⚡', color: '#d97706' },
  { text: 'Corte de luz sin previo aviso',                 sector: 'Energía',    emoji: '⚡', color: '#d97706' },
  { text: 'Cancelaron mi vuelo sin devolución',            sector: 'Transporte', emoji: '✈️', color: '#059669' },
  { text: 'El seguro se niega a cubrir mi siniestro',      sector: 'Seguros',    emoji: '🛡️', color: '#dc2626' },
  { text: 'Producto roto y no aceptan devolución',         sector: 'E-commerce', emoji: '📦', color: '#0891b2' },
  { text: 'Quiero apuntarme al evento musical',            sector: 'Música',     emoji: '🎵', color: '#db2777' },
  { text: 'No encuentro entradas para el concierto',       sector: 'Música',     emoji: '🎵', color: '#db2777' },
  { text: 'Me cobraron la reserva y cancelaron la expo',   sector: 'Arte',       emoji: '🎨', color: '#9333ea' },
  { text: 'El hotel no respeta las condiciones pactadas',  sector: 'Turismo',    emoji: '🏨', color: '#16a34a' },
  { text: '¿Cómo reclamar al alojamiento turístico?',      sector: 'Turismo',    emoji: '🏨', color: '#16a34a' },
  { text: 'Me cobraron tasas ocultas en la reserva',       sector: 'Turismo',    emoji: '🏨', color: '#16a34a' },
]

// ── Tipos ────────────────────────────────────────────────────────────────────
interface CardData {
  id: number
  item: typeof COMPLAINTS[0]
  visible: boolean
  animating: 'in' | 'out' | 'idle'
}

// ── Componente tarjeta individual ────────────────────────────────────────────
function Card({ card }: { card: CardData }) {
  const { item, animating } = card

  const base: React.CSSProperties = {
    width: '220px',
    background: 'rgba(15, 23, 42, 0.85)',
    border: `1px solid ${item.color}55`,
    borderRadius: '14px',
    padding: '12px 14px',
    backdropFilter: 'blur(12px)',
    boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${item.color}22`,
    transition: 'all 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    // Efecto persiana: entra desde arriba, sale hacia abajo
    maxHeight: animating === 'in' ? '120px' : animating === 'out' ? '0px' : '120px',
    opacity:   animating === 'in' ? 1        : animating === 'out' ? 0       : 1,
    marginBottom: animating === 'out' ? '-8px' : '0px',
    transform: animating === 'in'
      ? 'translateY(0) scale(1)'
      : animating === 'out'
        ? 'translateY(-8px) scale(0.97)'
        : 'translateY(0) scale(1)',
  }

  return (
    <div style={base}>
      {/* Badge sector */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: `${item.color}22`,
        border: `1px solid ${item.color}44`,
        borderRadius: '20px',
        padding: '2px 8px',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '11px' }}>{item.emoji}</span>
        <span style={{ fontSize: '10px', color: item.color, fontWeight: 600, letterSpacing: '0.03em' }}>
          {item.sector}
        </span>
      </div>

      {/* Texto */}
      <p style={{
        color: 'rgba(241,245,249,0.88)',
        fontSize: '12.5px',
        lineHeight: 1.5,
        margin: 0,
        fontStyle: 'italic',
      }}>
        "{item.text}"
      </p>
    </div>
  )
}

// ── Columna ──────────────────────────────────────────────────────────────────
function Column({
  side,
  cards,
}: {
  side: 'left' | 'right'
  cards: CardData[]
}) {
  const style: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    [side]: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 10,
    pointerEvents: 'none',
    width: '220px',
  }

  return (
    <div style={style}>
      {cards.map(card => (
        <Card key={card.id} card={card} />
      ))}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function FloatingComplaints() {
  const [leftCards,  setLeftCards]  = useState<CardData[]>([])
  const [rightCards, setRightCards] = useState<CardData[]>([])
  const counterRef = useRef(0)
  const indexRef   = useRef(0)

  // Añade una tarjeta con animación de entrada → idle → salida
  const addCard = (side: 'left' | 'right') => {
    const id   = counterRef.current++
    const item = COMPLAINTS[indexRef.current % COMPLAINTS.length]
    indexRef.current++

    const setter = side === 'left' ? setLeftCards : setRightCards

    // 1. Entra (persiana abre)
    setter(prev => [...prev.slice(-2), { id, item, visible: true, animating: 'in' }])

    // 2. Queda idle
    setTimeout(() => {
      setter(prev => prev.map(c => c.id === id ? { ...c, animating: 'idle' } : c))
    }, 80)

    // 3. Sale (persiana cierra) después de 4s
    setTimeout(() => {
      setter(prev => prev.map(c => c.id === id ? { ...c, animating: 'out' } : c))
    }, 4200)

    // 4. Elimina del DOM
    setTimeout(() => {
      setter(prev => prev.filter(c => c.id !== id))
    }, 4800)
  }

  useEffect(() => {
    // Tarjetas iniciales
    setTimeout(() => addCard('left'),   300)
    setTimeout(() => addCard('right'),  1500)
    setTimeout(() => addCard('left'),   2800)

    // Loop alternado
    const interval = setInterval(() => {
      const side: 'left' | 'right' = counterRef.current % 2 === 0 ? 'left' : 'right'
      addCard(side)
    }, 3200)

    return () => clearInterval(interval)
  }, [])

  // Solo mostrar en pantallas anchas
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const check = () => setWide(window.innerWidth >= 1280)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!wide) return null

  return (
    <>
      <Column side="left"  cards={leftCards}  />
      <Column side="right" cards={rightCards} />
    </>
  )
}

