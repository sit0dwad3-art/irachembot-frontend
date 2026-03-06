'use client';

import { useEffect, useState } from 'react';

const complaints = [
  { text: "Me estafaron en la última factura del gas 😤", company: "Energía" },
  { text: "Me están cobrando intereses abusivos", company: "Banca" },
  { text: "Llevan 3 meses sin resolver mi reclamación", company: "Telefonía" },
  { text: "Me cancelaron el vuelo y no me devuelven el dinero", company: "Transporte" },
  { text: "El seguro se niega a cubrir mi siniestro", company: "Seguros" },
  { text: "Me cobran una tarifa que nunca contraté", company: "Internet" },
  { text: "Cargo duplicado en mi cuenta bancaria", company: "Banca" },
  { text: "Producto que llegó roto y no aceptan devolución", company: "E-commerce" },
];

const sectorColors: Record<string, string> = {
  Energía:     'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  Banca:       'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  Telefonía:   'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  Transporte:  'from-green-500/20 to-green-600/10 border-green-500/30',
  Seguros:     'from-red-500/20 to-red-600/10 border-red-500/30',
  Internet:    'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  'E-commerce':'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
};

interface Card {
  id: number;
  complaint: typeof complaints[0];
  side: 'left' | 'right';
  delay: number;
}

export default function FloatingComplaints() {
  const [cards, setCards] = useState<Card[]>([]);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // Inicializa con 2 tarjetas
    setCards([
      { id: 0, complaint: complaints[0], side: 'left',  delay: 0 },
      { id: 1, complaint: complaints[1], side: 'right', delay: 1500 },
    ]);
    setCounter(2);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        // Elimina tarjetas viejas (más de 2 por lado)
        const lefts  = prev.filter(c => c.side === 'left');
        const rights = prev.filter(c => c.side === 'right');
        const filtered = [
          ...lefts.slice(-2),
          ...rights.slice(-2),
        ];
        return filtered;
      });

      setCounter(prev => {
        const newId = prev;
        const side: 'left' | 'right' = newId % 2 === 0 ? 'left' : 'right';
        const complaint = complaints[newId % complaints.length];
        setCards(c => [...c, { id: newId, complaint, side, delay: 0 }]);
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const renderColumn = (side: 'left' | 'right') =>
    cards
      .filter(c => c.side === side)
      .slice(-3)
      .map((card, i) => (
        <div
          key={card.id}
          className={`
            floating-card
            bg-gradient-to-br ${sectorColors[card.complaint.company] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30'}
            border backdrop-blur-sm rounded-xl p-4 w-64 shadow-xl
            ${i === 0 ? 'card-exit' : i === 1 ? 'card-middle' : 'card-enter'}
          `}
        >
          <div className="flex items-start gap-2">
            <span className="text-red-400 text-lg mt-0.5">⚠️</span>
            <div>
              <p className="text-white/90 text-sm font-medium leading-snug">
                "{card.complaint.text}"
              </p>
              <span className="text-white/40 text-xs mt-1 block">
                Sector: {card.complaint.company}
              </span>
            </div>
          </div>
        </div>
      ));

  return (
    <>
      {/* Columna izquierda */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 pointer-events-none">
        {renderColumn('left')}
      </div>

      {/* Columna derecha */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 pointer-events-none">
        {renderColumn('right')}
      </div>
    </>
  );
}
