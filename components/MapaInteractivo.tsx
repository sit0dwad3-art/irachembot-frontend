'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, ChevronUp, Send, Route } from 'lucide-react'
import MapaPinCard, { type LugarMapa, TIPO_CONFIG } from './MapaPinCard'

// ── Tipos props ───────────────────────────────────────────────────────────────
interface MapaInteractivoProps {
  planTexto:    string
  destino:      string
  onCerrar:     () => void
  onEnviarChat: (msg: string) => void
  cargandoChat: boolean
}

// ── Extractor de lugares ──────────────────────────────────────────────────────
function extraerLugares(planTexto: string, destino: string): Omit<LugarMapa, 'lat' | 'lng' | 'geocoded'>[] {
  const lugares: Omit<LugarMapa, 'lat' | 'lng' | 'geocoded'>[] = []
  let id = 1

  const detectarTipo = (texto: string): LugarMapa['tipo'] => {
    const t = texto.toLowerCase()
    if (/playa|beach|piscina|lago|río|parque|jardín|naturaleza|bosque|montaña|senderismo/.test(t)) return 'playa'
    if (/restaurante|bar|café|cafetería|tapas|pintxos|bodega|taberna|comida|cena|almuerzo|desayuno|gastro/.test(t)) return 'gastronomia'
    if (/museo|catedral|iglesia|castillo|palacio|monumento|historia|cultura|arte|teatro|plaza/.test(t)) return 'cultura'
    if (/hotel|hostal|albergue|apartamento|casa rural|camping|glamping|alojamiento/.test(t)) return 'alojamiento'
    if (/discoteca|club|pub|nocturna|copas|fiesta|noche/.test(t)) return 'nocturno'
    if (/aeropuerto|estación|bus|tren|metro|taxi|transporte/.test(t)) return 'transporte'
    return 'otro'
  }

  const detectarDia = (ctx: string): string => {
    const m = ctx.match(/[Dd]ía\s*(\d+)/i)
    if (m) return `Día ${m[1]}`
    return 'General'
  }

  const detectarPrecio = (ctx: string): string => {
    const m = ctx.match(/(\d+[-–]\d+\s*€|\d+\s*€|gratis|gratuito|libre)/i)
    if (m) return m[1].replace(/gratuito|libre/i, 'Gratis')
    return ''
  }

  const lineas = planTexto.split('\n')
  lineas.forEach((linea, idx) => {
    if (/^\|[-:\s|]+\|$/.test(linea.trim())) return
    const mTabla = linea.match(/\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|/)
    if (mTabla) {
      const [, col1, col2, col3, col4] = mTabla.map(s => s?.trim() ?? '')
      if (/hora|actividad|lugar|precio|momento/i.test(col1)) return
      const nombreLugar = col3.replace(/\*\*/g, '').trim()
      if (nombreLugar.length > 3 && !/^[-–]$/.test(nombreLugar)) {
        const ctx = linea + ' ' + (lineas[idx - 2] ?? '')
        lugares.push({
          id: id++,
          nombre: `${nombreLugar}${destino ? `, ${destino}, España` : ', España'}`,
          tipo:   detectarTipo(col2 + ' ' + col3),
          dia:    detectarDia(ctx),
          hora:   col1.replace(/\*\*/g, '').trim(),
          precio: col4.replace(/\*\*/g, '').trim() || detectarPrecio(linea),
        })
      }
    }
  })

  // Bullet points con dirección
  const regexBullet = /[•·\-*]\s+([^()\n]{4,60})\s*\(([^)]{4,80})\)/g
  let match
  while ((match = regexBullet.exec(planTexto)) !== null) {
    const nombre    = match[1].replace(/\*\*/g, '').trim()
    const direccion = match[2].trim()
    if (nombre.length > 2) {
      lugares.push({
        id: id++,
        nombre: `${nombre}, ${direccion}${destino ? `, ${destino}, España` : ', España'}`,
        tipo:   detectarTipo(nombre),
        dia:    'General',
        hora:   '',
        precio: detectarPrecio(match[0]),
      })
    }
  }

  // Deduplicar
  const vistos = new Set<string>()
  return lugares.filter(l => {
    const key = l.nombre.substring(0, 20).toLowerCase()
    if (vistos.has(key)) return false
    vistos.add(key)
    return true
  }).slice(0, 12)
}

// ── Geocoding con fallback ────────────────────────────────────────────────────
async function geocodificar(
  nombre: string,
  destino: string
): Promise<{ lat: number; lng: number } | null> {

  // Detectar país según el destino para restringir la búsqueda
  const esPaisEspana = /navarra|pamplona|pirineo|bardenas|olite|tudela|estella|irati|roncal|baztan|españa|spain/i.test(destino)
  const esPaisFrancia = /paris|lyon|niza|burdeos|france|francia/i.test(destino)
  const esPaisPortugal = /lisboa|oporto|porto|portugal/i.test(destino)
  const esPaisItalia = /roma|milan|venecia|italia|italy/i.test(destino)

  const countrycodes =
    esPaisEspana   ? 'es' :
    esPaisFrancia  ? 'fr' :
    esPaisPortugal ? 'pt' :
    esPaisItalia   ? 'it' :
    ''   // sin restricción para destinos internacionales desconocidos

  const buildUrl = (query: string, codes: string) => {
    const base = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=es`
    return codes ? `${base}&countrycodes=${codes}` : base
  }

  // Intento 1: nombre completo + restricción de país
  try {
    const url = buildUrl(nombre, countrycodes)
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'es', 'User-Agent': 'IracheBot/1.0' },
      signal:  AbortSignal.timeout(7000),
    })
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { /* continúa */ }

  // Intento 2: nombre simplificado (antes de la primera coma) + restricción
  const nombreSimple = nombre.split(',')[0].trim()
  if (nombreSimple !== nombre) {
    try {
      const url = buildUrl(nombreSimple, countrycodes)
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'es', 'User-Agent': 'IracheBot/1.0' },
        signal:  AbortSignal.timeout(5000),
      })
      const data = await res.json()
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch { /* sin coordenadas */ }
  }

  // Intento 3: sin restricción de país (último recurso)
  if (countrycodes) {
    try {
      const url = buildUrl(nombre, '')
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'es', 'User-Agent': 'IracheBot/1.0' },
        signal:  AbortSignal.timeout(5000),
      })
      const data = await res.json()
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch { /* sin coordenadas */ }
  }

  return null
}



// ── Componente interno del mapa (solo se renderiza en cliente) ────────────────
function MapaLeaflet({
  lugaresFiltrados,
  lugarActivo,
  setLugarActivo,
  rutaCoords,
  centroInicial,
}: {
  lugaresFiltrados: LugarMapa[]
  lugarActivo:      LugarMapa | null
  setLugarActivo:   (l: LugarMapa | null) => void
  rutaCoords:       [number, number][]
  centroInicial:    [number, number]
}) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)

  useEffect(() => {
    // Importar Leaflet solo en cliente
    import('leaflet').then(L => {
      leafletRef.current = L

      // Fix icono por defecto de Leaflet con webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current || mapInstanceRef.current) return

      // Crear mapa
      const map = L.map(mapRef.current, {
        center:      centroInicial,
        zoom:        14,
        zoomControl: true,
      })
      mapInstanceRef.current = map

      // Tiles OSM
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Actualizar markers cuando cambian los lugares
  useEffect(() => {
    const L   = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    // Limpiar markers anteriores
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    polylineRef.current?.remove()

    if (lugaresFiltrados.length === 0) return

    // Añadir polyline
    if (rutaCoords.length >= 2) {
      polylineRef.current = L.polyline(rutaCoords, {
        color:     '#10b981',
        weight:    2.5,
        opacity:   0.6,
        dashArray: '6, 8',
      }).addTo(map)
    }

    // Añadir markers
    lugaresFiltrados.forEach(lugar => {
      if (!lugar.lat || !lugar.lng) return
      const cfg  = TIPO_CONFIG[lugar.tipo]
      const size = lugarActivo?.id === lugar.id ? 38 : 32

      const svgIcon = L.divIcon({
        html: `
          <svg width="${size}" height="${size + 8}" viewBox="0 0 38 46" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="sh${lugar.id}">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${cfg.color}" flood-opacity="0.5"/>
              </filter>
            </defs>
            <path d="M19 2 C10.7 2 4 8.7 4 17 C4 25.3 19 44 19 44 C19 44 34 25.3 34 17 C34 8.7 27.3 2 19 2 Z"
              fill="${cfg.color}" filter="url(#sh${lugar.id})"
              stroke="${lugarActivo?.id === lugar.id ? 'white' : 'rgba(255,255,255,0.4)'}"
              stroke-width="${lugarActivo?.id === lugar.id ? 2 : 1}"/>
            <text x="19" y="21" text-anchor="middle" dominant-baseline="middle"
              font-family="Inter,system-ui,sans-serif"
              font-size="13" font-weight="700" fill="white">${lugar.id}</text>
          </svg>`,
        className:  '',
        iconSize:   [size, size + 8],
        iconAnchor: [size / 2, size + 8],
      })

      const marker = L.marker([lugar.lat, lugar.lng], { icon: svgIcon })
        .addTo(map)
        .bindTooltip(`${cfg.emoji} ${lugar.nombre.split(',')[0]}`, {
          direction: 'top',
          offset:    [0, -10],
          opacity:   0.95,
        })
        .on('click', () => {
          setLugarActivo(lugarActivo?.id === lugar.id ? null : lugar)
          map.flyTo([lugar.lat!, lugar.lng!], map.getZoom(), { animate: true, duration: 0.5 })
        })

      markersRef.current.push(marker)
    })

    // Ajustar bounds
    if (lugaresFiltrados.length > 0) {
      const bounds = L.latLngBounds(
        lugaresFiltrados
          .filter(l => l.lat && l.lng)
          .map(l => [l.lat!, l.lng!] as [number, number])
      )
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugaresFiltrados, lugarActivo])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function MapaInteractivo({
  planTexto,
  destino,
  onCerrar,
  onEnviarChat,
  cargandoChat,
}: MapaInteractivoProps) {
  const [lugares,      setLugares]      = useState<LugarMapa[]>([])
  const [lugarActivo,  setLugarActivo]  = useState<LugarMapa | null>(null)
  const [filtroDia,    setFiltroDia]    = useState<string>('Todo')
  const [dias,         setDias]         = useState<string[]>([])
  const [chatVisible,  setChatVisible]  = useState(true)
  const [inputChat,    setInputChat]    = useState('')
  const [isMounted,    setIsMounted]    = useState(false)

  // Solo renderizar en cliente
  useEffect(() => {
    setIsMounted(true)
    // Inyectar CSS de Leaflet
    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link')
      link.id     = 'leaflet-css'
      link.rel    = 'stylesheet'
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
  }, [])

  // Extraer lugares
  useEffect(() => {
    const extraidos = extraerLugares(planTexto, destino)
    const iniciales: LugarMapa[] = extraidos.map(l => ({ ...l, geocoded: false }))
    setLugares(iniciales)
    const diasUnicos = ['Todo', ...new Set(iniciales.map(l => l.dia).filter(d => d !== 'General'))]
    setDias(diasUnicos)
  }, [planTexto, destino])

// ── Geocoding PARALELO — todos a la vez con delay escalonado ─────────────────
useEffect(() => {
  const pendientes = lugares.filter(l => !l.geocoded)
  if (pendientes.length === 0) return

  // Lanzar todos en paralelo con un pequeño delay escalonado
  // para no saturar Nominatim (máx ~1 req/seg recomendado)
  const controllers: AbortController[] = []

  pendientes.forEach((lugar, index) => {
    const timer = setTimeout(async () => {
      const coords = await geocodificar(lugar.nombre, destino)
      setLugares(prev => prev.map(l =>
        l.id === lugar.id
          ? { ...l, lat: coords?.lat, lng: coords?.lng, geocoded: true }
          : l
      ))
    }, index * 800)   // 800ms entre cada uno → respeta rate limit

    // Guardamos el timer para limpieza
    controllers.push({ abort: () => clearTimeout(timer) } as any)
  })

  return () => {
    controllers.forEach(c => c.abort())
  }
// Solo se ejecuta cuando cambia la lista de lugares (no en cada update)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [lugares.length, lugares.filter(l => !l.geocoded).length])


  const lugaresFiltrados = lugares.filter(l =>
    (filtroDia === 'Todo' || l.dia === filtroDia || l.dia === 'General') &&
    l.geocoded && l.lat && l.lng
  )

  const rutaCoords = lugaresFiltrados
    .filter(l => l.lat && l.lng)
    .map(l => [l.lat!, l.lng!] as [number, number])

  const centroInicial: [number, number] = lugaresFiltrados[0]
    ? [lugaresFiltrados[0].lat!, lugaresFiltrados[0].lng!]
    : [42.8, -1.6]

  const pendientesGeocode = lugares.filter(l => !l.geocoded).length

  const abrirRutaCompleta = () => {
    const puntos = lugaresFiltrados.filter(l => l.lat && l.lng)
    if (puntos.length === 0) return
    if (puntos.length === 1) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${puntos[0].lat},${puntos[0].lng}`, '_blank')
      return
    }
    const origen  = `${puntos[0].lat},${puntos[0].lng}`
    const destFin = `${puntos[puntos.length - 1].lat},${puntos[puntos.length - 1].lng}`
    const waypts  = puntos.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|')
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destFin}${waypts ? `&waypoints=${waypts}` : ''}&travelmode=walking`,
      '_blank'
    )
  }

  return (
    <>
      <style>{`
        @keyframes mapa-slide-up {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes geocoding-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes spin-mapa { to { transform: rotate(360deg); } }
        .leaflet-container { background: #0f172a !important; }
        .leaflet-tile      { filter: brightness(0.85) saturate(0.9) !important; }
        .leaflet-control-zoom a {
          background: rgba(8,12,24,0.95) !important;
          color: #94a3b8 !important;
          border-color: rgba(30,41,59,0.8) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(30,41,59,0.95) !important;
          color: #f1f5f9 !important;
        }
        .leaflet-control-attribution {
          background: rgba(8,12,24,0.7) !important;
          color: #334155 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: #475569 !important; }
        .leaflet-tooltip {
          background: rgba(8,12,24,0.95) !important;
          border: 1px solid rgba(16,185,129,0.3) !important;
          color: #f1f5f9 !important;
          font-size: 12px !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }
        .leaflet-tooltip-top::before { border-top-color: rgba(16,185,129,0.3) !important; }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onCerrar}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position:      'fixed',
        bottom:        0, left: 0, right: 0,
        height:        '92vh',
        zIndex:        201,
        background:    '#060b18',
        borderRadius:  '20px 20px 0 0',
        border:        '1px solid rgba(16,185,129,0.2)',
        boxShadow:     '0 -16px 64px rgba(0,0,0,0.8)',
        animation:     'mapa-slide-up .35s cubic-bezier(0.16,1,0.3,1) both',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          padding:        '12px 16px 10px',
          borderBottom:   '1px solid rgba(30,41,59,0.8)',
          background:     'rgba(6,11,24,0.98)',
          backdropFilter: 'blur(20px)',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: dias.length > 1 ? '10px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg,#059669,#10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}>🗺️</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                  Mapa del Plan
                  {destino && <span style={{ color: '#10b981', marginLeft: '6px' }}>· {destino}</span>}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
                  {pendientesGeocode > 0
                    ? <span style={{ animation: 'geocoding-pulse 1s infinite' }}>
                        📡 Localizando {lugares.length - pendientesGeocode}/{lugares.length} lugares...
                      </span>
                    : `✅ ${lugaresFiltrados.length} lugares en el mapa`
                  }
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {lugaresFiltrados.length >= 2 && (
                <button
                  onClick={abrirRutaCompleta}
                  style={{
                    background:   'rgba(16,185,129,0.1)',
                    border:       '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    padding:      '5px 10px',
                    cursor:       'pointer',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '5px',
                    fontSize:     '11px',
                    fontWeight:   600,
                    color:        '#10b981',
                    transition:   'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
                >
                  <Route size={12} />
                  Ruta completa
                </button>
              )}
              <button
                onClick={onCerrar}
                style={{
                  background:     'rgba(30,41,59,0.6)',
                  border:         '1px solid rgba(51,65,85,0.4)',
                  borderRadius:   '10px',
                  width:          '32px', height: '32px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  cursor:         'pointer',
                  color:          '#64748b',
                  transition:     'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.8)'; e.currentTarget.style.color = '#f1f5f9' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#64748b' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filtros día */}
          {dias.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {dias.map(dia => (
                <button
                  key={dia}
                  onClick={() => { setFiltroDia(dia); setLugarActivo(null) }}
                  style={{
                    background:   filtroDia === dia ? 'rgba(16,185,129,0.2)' : 'rgba(15,23,42,0.6)',
                    border:       `1px solid ${filtroDia === dia ? 'rgba(16,185,129,0.5)' : 'rgba(30,41,59,0.6)'}`,
                    borderRadius: '20px',
                    padding:      '4px 12px',
                    cursor:       'pointer',
                    fontSize:     '11px',
                    fontWeight:   filtroDia === dia ? 700 : 500,
                    color:        filtroDia === dia ? '#10b981' : '#64748b',
                    transition:   'all .2s',
                  }}
                >
                  {dia}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── MAPA ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {isMounted ? (
            <>
              <MapaLeaflet
                lugaresFiltrados={lugaresFiltrados}
                lugarActivo={lugarActivo}
                setLugarActivo={setLugarActivo}
                rutaCoords={rutaCoords}
                centroInicial={centroInicial}
              />
              {lugarActivo && (
                <MapaPinCard
                  lugar={lugarActivo}
                  onCerrar={() => setLugarActivo(null)}
                />
              )}
            </>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: '12px', color: '#334155',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '3px solid transparent',
                borderTop: '3px solid #10b981',
                animation: 'spin-mapa 0.9s linear infinite',
              }}/>
              <p style={{ fontSize: '13px' }}>Cargando mapa...</p>
            </div>
          )}
        </div>

        {/* ── CHAT FLOTANTE ── */}
        <div style={{
          borderTop:      '1px solid rgba(30,41,59,0.8)',
          background:     'rgba(6,11,24,0.98)',
          backdropFilter: 'blur(20px)',
          flexShrink:     0,
        }}>
          <button
            onClick={() => setChatVisible(v => !v)}
            style={{
              width:          '100%',
              background:     'transparent',
              border:         'none',
              padding:        '8px 16px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              cursor:         'pointer',
              color:          '#475569',
              fontSize:       '11px',
              fontWeight:     600,
              letterSpacing:  '.04em',
            }}
          >
            <span>💬 SEGUIR HABLANDO CON IRACHE</span>
            {chatVisible ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {chatVisible && (
            <div style={{ padding: '0 12px 16px' }}>
              <div style={{
                display:      'flex',
                gap:          '8px',
                alignItems:   'center',
                background:   'rgba(15,23,42,0.8)',
                borderRadius: '14px',
                padding:      '8px 8px 8px 14px',
                border:       '1px solid rgba(51,65,85,0.5)',
              }}>
                <input
                  value={inputChat}
                  onChange={e => setInputChat(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && inputChat.trim()) {
                      onEnviarChat(inputChat)
                      setInputChat('')
                    }
                  }}
                  placeholder="Pregunta algo sobre el plan o cambia algo..."
                  disabled={cargandoChat}
                  style={{
                    flex:       1,
                    background: 'none',
                    border:     'none',
                    color:      '#f1f5f9',
                    fontSize:   '13px',
                    outline:    'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={() => {
                    if (inputChat.trim()) {
                      onEnviarChat(inputChat)
                      setInputChat('')
                    }
                  }}
                  disabled={!inputChat.trim() || cargandoChat}
                  style={{
                    background:     inputChat.trim() && !cargandoChat
                      ? 'linear-gradient(135deg,#059669,#10b981)'
                      : 'rgba(30,41,59,0.5)',
                    border:         'none',
                    borderRadius:   '10px',
                    width:          '34px', height: '34px',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    cursor:         inputChat.trim() && !cargandoChat ? 'pointer' : 'not-allowed',
                    transition:     'all .2s',
                    flexShrink:     0,
                  }}
                >
                  <Send size={13} color={inputChat.trim() && !cargandoChat ? 'white' : '#334155'} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}