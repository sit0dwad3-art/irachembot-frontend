'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, ChevronUp, Send, Route } from 'lucide-react'
import MapaPinCard, { type LugarMapa, TIPO_CONFIG } from './MapaPinCard'

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════════════════

interface MapaInteractivoProps {
  planTexto:    string
  destino:      string
  onCerrar:     () => void
  onEnviarChat: (msg: string) => void
  cargandoChat: boolean
}

// ══════════════════════════════════════════════════════════════════════════════
// BASE DE DATOS DE PAÍSES — detección por keywords
// ══════════════════════════════════════════════════════════════════════════════

interface PaisConfig {
  code:     string   // ISO 3166-1 alpha-2 para Nominatim
  nombre:   string   // nombre en español para añadir al query
  keywords: RegExp
}

const PAISES: PaisConfig[] = [
  {
    code: 'es', nombre: 'España',
    keywords: /\b(navarra|pamplona|pirineo|pirineos|bardenas|olite|tudela|estella|irati|roncal|baztan|roncesvalles|madrid|barcelona|sevilla|valencia|bilbao|san sebasti[aá]n|donostia|m[aá]laga|granada|c[oó]rdoba|toledo|zaragoza|santiago de compostela|salamanca|burgos|logro[nñ]o|vitoria|gasteiz|alicante|murcia|palma|mallorca|ibiza|tenerife|gran canaria|c[aá]diz|huelva|ja[eé]n|albacete|ciudad real|cuenca|guadalajara|segovia|[aá]vila|soria|palencia|valladolid|zamora|le[oó]n|oviedo|gij[oó]n|santander|bilbao|logrono|pamplona|espa[nñ]a|spain)\b/i,
  },
  {
    code: 'fr', nombre: 'Francia',
    keywords: /\b(paris|par[ií]s|lyon|niza|nice|burdeos|bordeaux|marsella|marseille|toulouse|estrasburgo|strasbourg|nantes|montpellier|lille|rennes|reims|le havre|saint[- ][eé]tienne|toulon|grenoble|dijon|angers|brest|le mans|aix[- ]en[- ]provence|clermont[- ]ferrand|amiens|limoges|tours|metz|besan[cç]on|caen|orl[eé]ans|rouen|mulhouse|perpignan|nancy|fran[cç]ia|france)\b/i,
  },
  {
    code: 'pt', nombre: 'Portugal',
    keywords: /\b(lisboa|lisbon|oporto|porto|braga|coimbra|faro|setúbal|setubal|funchal|madeira|a[cç]ores|azores|sintra|[eé]vora|evora|aveiro|viseu|guimar[aã]es|guimaraes|portugal)\b/i,
  },
  {
    code: 'it', nombre: 'Italia',
    keywords: /\b(roma|rome|mil[aá]n|milan|milano|venecia|venice|venezia|florencia|florence|firenze|n[aá]poles|naples|napoli|turín|turin|torino|bolonia|bologna|palermo|g[eé]nova|genova|genoa|bari|catania|verona|padua|padova|trieste|brescia|parma|m[oó]dena|modena|reggio|perugia|livorno|ravenna|cagliari|italia|italy)\b/i,
  },
  {
    code: 'de', nombre: 'Alemania',
    keywords: /\b(berl[ií]n|berlin|m[uú]nich|munich|m[uü]nchen|hamburgo|hamburg|colonia|cologne|k[oö]ln|fr[aá]ncfort|frankfurt|stuttgart|d[uü]sseldorf|dortmund|essen|bremen|hannover|leipzig|dresde|dresden|n[uú]remberg|nuremberg|duisburg|bochum|wuppertal|bielefeld|bonn|mannheim|karlsruhe|augsburg|wiesbaden|m[uü]nster|alemania|germany|deutschland)\b/i,
  },
  {
    code: 'gb', nombre: 'Reino Unido',
    keywords: /\b(londres|london|manchester|birmingham|glasgow|liverpool|edinburgo|edinburgh|bristol|leeds|sheffield|bradford|cardiff|belfast|nottingham|leicester|coventry|hull|stoke|wolverhampton|sunderland|derby|plymouth|southampton|portsmouth|oxford|cambridge|york|exeter|bath|brighton|reino unido|uk|england|scotland|wales|ireland)\b/i,
  },
  {
    code: 'us', nombre: 'Estados Unidos',
    keywords: /\b(nueva york|new york|los [aá]ngeles|los angeles|chicago|houston|phoenix|filadelfia|philadelphia|san antonio|san diego|dallas|san jose|austin|jacksonville|fort worth|columbus|charlotte|indianapolis|san francisco|seattle|denver|nashville|oklahoma|el paso|washington|boston|miami|atlanta|minneapolis|estados unidos|usa|united states)\b/i,
  },
  {
    code: 'mx', nombre: 'México',
    keywords: /\b(ciudad de m[eé]xico|mexico city|guadalajara|monterrey|puebla|tijuana|le[oó]n|juárez|juarez|zapopan|nezahualc[oó]yotl|m[eé]rida|san luis potos[ií]|aguascalientes|herm[oó]sillo|saltillo|mexicali|culiac[aá]n|acapulco|cancún|cancun|m[eé]xico|mexico)\b/i,
  },
  {
    code: 'jp', nombre: 'Japón',
    keywords: /\b(tokio|tokyo|osaka|kioto|kyoto|yokohama|nagoya|sapporo|fukuoka|kobe|kawasaki|hiroshima|sendai|chiba|kitakyushu|sakai|niigata|hamamatsu|kumamoto|jap[oó]n|japan)\b/i,
  },
  {
    code: 'th', nombre: 'Tailandia',
    keywords: /\b(bangkok|chiang mai|phuket|pattaya|krabi|koh samui|ayutthaya|tailandia|thailand)\b/i,
  },
  {
    code: 'ma', nombre: 'Marruecos',
    keywords: /\b(marrakech|casablanca|fez|fès|rabat|tánger|tanger|agadir|meknes|ouarzazate|marruecos|morocco)\b/i,
  },
  {
    code: 'ar', nombre: 'Argentina',
    keywords: /\b(buenos aires|c[oó]rdoba|rosario|mendoza|la plata|san miguel|mar del plata|salta|santa fe|san juan|argentina)\b/i,
  },
  {
    code: 'co', nombre: 'Colombia',
    keywords: /\b(bogot[aá]|bogota|medell[ií]n|medellin|cali|barranquilla|cartagena|c[uú]cuta|bucaramanga|pereira|colombia)\b/i,
  },
  {
    code: 'br', nombre: 'Brasil',
    keywords: /\b(s[aã]o paulo|sao paulo|r[ií]o de janeiro|rio de janeiro|brasilia|salvador|fortaleza|belo horizonte|manaus|curitiba|recife|porto alegre|bel[eé]m|goiania|brasil|brazil)\b/i,
  },
  {
    code: 'ae', nombre: 'Emiratos Árabes',
    keywords: /\b(dubai|abu dhabi|sharjah|ajman|emiratos|uae|united arab emirates)\b/i,
  },
  {
    code: 'gr', nombre: 'Grecia',
    keywords: /\b(atenas|athens|athinai|sal[oó]nica|thessaloniki|patras|heraklion|creta|crete|santorini|mykonos|rodas|rhodes|corfu|grecia|greece)\b/i,
  },
  {
    code: 'nl', nombre: 'Países Bajos',
    keywords: /\b(amsterdam|rotterdam|la haya|den haag|utrecht|eindhoven|tilburg|groningen|almere|breda|pa[ií]ses bajos|netherlands|holland)\b/i,
  },
  {
    code: 'be', nombre: 'Bélgica',
    keywords: /\b(bruselas|brussels|bruxelles|amberes|antwerp|gante|ghent|brujas|bruges|lieja|liege|b[eé]lgica|belgium)\b/i,
  },
  {
    code: 'ch', nombre: 'Suiza',
    keywords: /\b(zurich|z[uü]rich|ginebra|geneva|gen[eè]ve|berna|bern|basilea|basel|lausana|lausanne|suiza|switzerland)\b/i,
  },
  {
    code: 'at', nombre: 'Austria',
    keywords: /\b(viena|vienna|wien|salzburgo|salzburg|innsbruck|graz|linz|austria)\b/i,
  },
  {
    code: 'tr', nombre: 'Turquía',
    keywords: /\b(estambul|istanbul|ankara|izmir|bursa|antalya|adana|konya|capadocia|cappadocia|turqu[ií]a|turkey)\b/i,
  },
  {
    code: 'eg', nombre: 'Egipto',
    keywords: /\b(el cairo|cairo|alejandría|alexandria|luxor|aswan|hurghada|sharm el sheikh|egipto|egypt)\b/i,
  },
  {
    code: 'id', nombre: 'Indonesia',
    keywords: /\b(bali|jakarta|yogyakarta|surabaya|bandung|lombok|komodo|indonesia)\b/i,
  },
  {
    code: 'cu', nombre: 'Cuba',
    keywords: /\b(la habana|havana|santiago de cuba|varadero|trinidad|cuba)\b/i,
  },
  {
    code: 'pe', nombre: 'Perú',
    keywords: /\b(lima|cusco|cuzco|machu picchu|arequipa|trujillo|per[uú]|peru)\b/i,
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// DETECTOR DE PAÍS INTELIGENTE
// ══════════════════════════════════════════════════════════════════════════════

interface PaisDetectado {
  code:   string
  nombre: string
}

function detectarPais(textos: string[]): PaisDetectado {
  const textoCompleto = textos.join(' ').toLowerCase()

  // Puntuación por país: más keywords encontradas = más probable
  let mejorPais: PaisConfig | null = null
  let mejorScore = 0

  for (const pais of PAISES) {
    const matches = textoCompleto.match(new RegExp(pais.keywords.source, 'gi'))
    const score   = matches ? matches.length : 0
    if (score > mejorScore) {
      mejorScore = score
      mejorPais  = pais
    }
  }

  // Default: España (la mayoría de planes son España)
  return mejorPais
    ? { code: mejorPais.code, nombre: mejorPais.nombre }
    : { code: 'es', nombre: 'España' }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTRACTOR DE CIUDAD DEL PLAN
// ══════════════════════════════════════════════════════════════════════════════

function extraerCiudadDelPlan(planTexto: string, destinoProp: string): string {
  // 1. Buscar en la sección ## DESTINO del plan (más fiable)
  const mDestino = planTexto.match(
    /##[^#\n]*(?:DESTINO|DESTINATION)[^\n]*\n+([^\n#]{3,80})/i
  )
  if (mDestino) {
    // "Pamplona, Navarra, España" → "Pamplona"
    // "Valencia (España)" → "Valencia"
    const ciudad = mDestino[1]
      .replace(/[*_#\[\]()]/g, '')
      .split(/[,.(]/)[0]
      .trim()
    if (ciudad.length > 2 && ciudad.length < 50) return ciudad
  }

  // 2. Buscar patrón "Plan de viaje a/en [Ciudad]"
  const mPlan = planTexto.match(/(?:viaje\s+(?:a|en|por)|visitar|destino[:\s]+)\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{2,30})/i)
  if (mPlan) {
    const ciudad = mPlan[1].trim()
    if (ciudad.length > 2) return ciudad
  }

  // 3. Usar el prop destino (puede venir de datos.destino_deseado)
  if (destinoProp && destinoProp.length > 2) {
    return destinoProp.split(',')[0].trim()
  }

  return ''
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTRACTOR DE LUGARES DEL PLAN
// ══════════════════════════════════════════════════════════════════════════════

function extraerLugares(
  planTexto: string,
  destinoProp: string
): Omit<LugarMapa, 'lat' | 'lng' | 'geocoded'>[] {
  const lugares: Omit<LugarMapa, 'lat' | 'lng' | 'geocoded'>[] = []
  let id = 1

  // ── Detectar ciudad y país ──────────────────────────────────────────────
  const ciudadBase = extraerCiudadDelPlan(planTexto, destinoProp)
  const pais       = detectarPais([planTexto, destinoProp, ciudadBase])

  // Sufijo de geocodificación: "Pamplona, España" / "Paris, Francia"
  const sufijo = ciudadBase
    ? `, ${ciudadBase}, ${pais.nombre}`
    : `, ${pais.nombre}`

  // ── Helpers ─────────────────────────────────────────────────────────────
  const detectarTipo = (texto: string): LugarMapa['tipo'] => {
    const t = texto.toLowerCase()
    if (/playa|beach|piscina|lago|r[ií]o|parque|jard[ií]n|naturaleza|bosque|monta[nñ]a|senderismo|trail|hiking|waterfall|cascada|national park|parque nacional/.test(t)) return 'playa'
    if (/restaurante|restaurant|bar\b|caf[eé]|cafeter[ií]a|tapas|pintxos|bodega|taberna|comida|cena|almuerzo|desayuno|gastro|bistro|brasserie|trattoria|osteria|izakaya|ramen|sushi/.test(t)) return 'gastronomia'
    if (/museo|museum|catedral|cathedral|iglesia|church|castillo|castle|palacio|palace|monumento|monument|historia|cultura|arte|art|teatro|theatre|plaza|square|tower|torre|basílica|basilica/.test(t)) return 'cultura'
    if (/hotel|hostal|albergue|hostel|apartamento|apartment|casa rural|camping|glamping|alojamiento|accommodation|resort|inn|lodge/.test(t)) return 'alojamiento'
    if (/discoteca|club|pub|nocturna|copas|fiesta|noche|nightclub|bar nocturno|cocktail|cocteler/.test(t)) return 'nocturno'
    if (/aeropuerto|airport|estaci[oó]n|station|bus|tren|train|metro|subway|taxi|transporte|transport|ferry|puerto|port/.test(t)) return 'transporte'
    return 'otro'
  }

  const detectarDia = (ctx: string): string => {
    const m = ctx.match(/[Dd][ií]a\s*(\d+)/i)
    if (m) return `Día ${m[1]}`
    const mDay = ctx.match(/\b(day|jornada)\s*(\d+)/i)
    if (mDay) return `Día ${mDay[2]}`
    return 'General'
  }

  const detectarPrecio = (ctx: string): string => {
    const m = ctx.match(/(\d+[-–]\d+\s*[€$£¥]|\d+\s*[€$£¥]|gratis|gratuito|libre|free)/i)
    if (m) return m[1].replace(/gratuito|libre|free/i, 'Gratis')
    return ''
  }

  // ── Parsear tablas Markdown ──────────────────────────────────────────────
  const lineas = planTexto.split('\n')
  lineas.forEach((linea, idx) => {
    // Saltar líneas separadoras de tabla
    if (/^\|[-:\s|]+\|$/.test(linea.trim())) return

    const mTabla = linea.match(/\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|/)
    if (mTabla) {
      const [, col1, col2, col3, col4] = mTabla.map(s => s?.trim() ?? '')

      // Saltar cabeceras
      if (/hora|actividad|lugar|precio|momento|time|activity|place|location/i.test(col1)) return

      const nombreLugar = col3.replace(/\*\*/g, '').replace(/[_*`]/g, '').trim()

      if (nombreLugar.length > 3 && !/^[-–—]$/.test(nombreLugar)) {
        const ctx = linea + ' ' + (lineas[idx - 2] ?? '') + ' ' + (lineas[idx - 3] ?? '')

        // Evitar añadir sufijo si el lugar ya incluye ciudad/país
        const yaIncluye = new RegExp(ciudadBase || pais.nombre, 'i').test(nombreLugar)
        const nombreFinal = yaIncluye ? nombreLugar : `${nombreLugar}${sufijo}`

        lugares.push({
          id:     id++,
          nombre: nombreFinal,
          tipo:   detectarTipo(col2 + ' ' + col3),
          dia:    detectarDia(ctx),
          hora:   col1.replace(/\*\*/g, '').trim(),
          precio: col4.replace(/\*\*/g, '').trim() || detectarPrecio(linea),
        })
      }
    }
  })

  // ── Parsear bullet points con dirección entre paréntesis ────────────────
  // Ej: "• Bar Gaucho (Espoz y Mina, 7)"
  const regexBullet = /[•·\-*]\s+\*{0,2}([^()\n*]{4,60})\*{0,2}\s*\(([^)]{4,80})\)/g
  let match
  while ((match = regexBullet.exec(planTexto)) !== null) {
    const nombre    = match[1].replace(/\*\*/g, '').trim()
    const direccion = match[2].trim()
    if (nombre.length > 2) {
      // Si la dirección ya incluye ciudad, no duplicar
      const yaIncluye = new RegExp(ciudadBase || pais.nombre, 'i').test(direccion)
      const nombreFinal = yaIncluye
        ? `${nombre}, ${direccion}`
        : `${nombre}, ${direccion}${sufijo}`

      lugares.push({
        id:     id++,
        nombre: nombreFinal,
        tipo:   detectarTipo(nombre),
        dia:    'General',
        hora:   '',
        precio: detectarPrecio(match[0]),
      })
    }
  }

  // ── Parsear bullet points simples con nombre reconocible ────────────────
  // Ej: "• Museo del Prado → arte clásico"
  const regexSimple = /[•·]\s+\*{0,2}([A-ZÁÉÍÓÚÑ][^•·\n*]{3,50}?)\*{0,2}\s*(?:→|–|-|:)/g
  while ((match = regexSimple.exec(planTexto)) !== null) {
    const nombre = match[1].replace(/\*\*/g, '').trim()
    // Solo si parece un lugar real (no una instrucción)
    if (
      nombre.length > 4 &&
      !lugares.some(l => l.nombre.toLowerCase().startsWith(nombre.toLowerCase().slice(0, 15)))
    ) {
      const yaIncluye = new RegExp(ciudadBase || pais.nombre, 'i').test(nombre)
      lugares.push({
        id:     id++,
        nombre: yaIncluye ? nombre : `${nombre}${sufijo}`,
        tipo:   detectarTipo(nombre),
        dia:    'General',
        hora:   '',
        precio: '',
      })
    }
  }

  // ── Deduplicar por los primeros 20 chars del nombre ─────────────────────
  const vistos = new Set<string>()
  return lugares
    .filter(l => {
      const key = l.nombre.substring(0, 20).toLowerCase().replace(/\s+/g, ' ')
      if (vistos.has(key)) return false
      vistos.add(key)
      return true
    })
    .slice(0, 14)  // máx 14 lugares
}

// ══════════════════════════════════════════════════════════════════════════════
// GEOCODIFICACIÓN INTELIGENTE — 4 intentos con estrategia progresiva
// ══════════════════════════════════════════════════════════════════════════════

async function geocodificar(
  nombre:      string,
  destinoProp: string,
  planTexto:   string
): Promise<{ lat: number; lng: number } | null> {

  // Detectar país usando nombre del lugar + destino + plan
  const pais = detectarPais([nombre, destinoProp, planTexto.slice(0, 500)])
  const ciudadBase = extraerCiudadDelPlan(planTexto, destinoProp)

  const buildUrl = (query: string, countrycodes: string, limit = 1) => {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&accept-language=es`
    if (countrycodes) url += `&countrycodes=${countrycodes}`
    return url
  }

  const fetchCoords = async (url: string, timeout = 7000): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res  = await fetch(url, {
        headers: { 'Accept-Language': 'es', 'User-Agent': 'IracheBot/1.0 (travel planner)' },
        signal:  AbortSignal.timeout(timeout),
      })
      const data = await res.json()
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch { /* continúa */ }
    return null
  }

  // Extraer partes del nombre: "Bar Gaucho, Calle Espoz y Mina, Pamplona, España"
  const partes      = nombre.split(',').map(p => p.trim())
  const nombreSolo  = partes[0]   // "Bar Gaucho"
  const calleODir   = partes[1]   // "Calle Espoz y Mina" (si existe)
  const ciudadEnNombre = partes.find((p, i) => i > 0 && p.length > 2 && !/españa|france|italia|germany|portugal/i.test(p))

  // ── Intento 1: nombre completo + país ────────────────────────────────────
  const r1 = await fetchCoords(buildUrl(nombre, pais.code))
  if (r1) return r1

  // ── Intento 2: nombre + ciudad extraída del plan ─────────────────────────
  if (ciudadBase && !nombre.toLowerCase().includes(ciudadBase.toLowerCase())) {
    const query2 = `${nombreSolo}, ${ciudadBase}, ${pais.nombre}`
    const r2 = await fetchCoords(buildUrl(query2, pais.code))
    if (r2) return r2
  }

  // ── Intento 3: nombre solo + ciudad en el nombre (si existe) ─────────────
  if (ciudadEnNombre) {
    const query3 = `${nombreSolo}, ${ciudadEnNombre}`
    const r3 = await fetchCoords(buildUrl(query3, pais.code))
    if (r3) return r3
  }

  // ── Intento 4: solo nombre del lugar + código de país ────────────────────
  // (sin ciudad — para monumentos y lugares muy conocidos)
  if (nombreSolo !== nombre) {
    const r4 = await fetchCoords(buildUrl(nombreSolo, pais.code, 3), 5000)
    if (r4) return r4
  }

  // ── Intento 5: nombre + calle (si hay dirección) ─────────────────────────
  if (calleODir && calleODir.length > 3) {
    const query5 = `${nombreSolo}, ${calleODir}, ${pais.nombre}`
    const r5 = await fetchCoords(buildUrl(query5, pais.code), 5000)
    if (r5) return r5
  }

  // ── SIN fallback mundial — nunca buscar sin restricción de país ──────────
  // Esto evita que "Discoteca Reverb" aparezca en Nueva York
  return null
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE MAPA LEAFLET (solo cliente)
// ══════════════════════════════════════════════════════════════════════════════

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
  const mapRef         = useRef<HTMLDivElement>(null)
  const leafletRef     = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef     = useRef<any[]>([])
  const polylineRef    = useRef<any>(null)

  // Inicializar mapa una sola vez
  useEffect(() => {
    import('leaflet').then(L => {
      leafletRef.current = L

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center:      centroInicial,
        zoom:        13,
        zoomControl: true,
      })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
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

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    polylineRef.current?.remove()

    if (lugaresFiltrados.length === 0) return

    // Polyline de ruta
    if (rutaCoords.length >= 2) {
      polylineRef.current = L.polyline(rutaCoords, {
        color:     '#10b981',
        weight:    2.5,
        opacity:   0.6,
        dashArray: '6, 8',
      }).addTo(map)
    }

    // Markers con SVG personalizado
    lugaresFiltrados.forEach(lugar => {
      if (!lugar.lat || !lugar.lng) return
      const cfg      = TIPO_CONFIG[lugar.tipo]
      const activo   = lugarActivo?.id === lugar.id
      const size     = activo ? 40 : 32
      const fontSize = activo ? 14 : 12

      const svgIcon = L.divIcon({
        html: `
          <svg width="${size}" height="${size + 10}" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow${lugar.id}" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="3"
                  flood-color="${cfg.color}" flood-opacity="${activo ? 0.7 : 0.4}"/>
              </filter>
            </defs>
            <path d="M20 2 C11.2 2 4 9.2 4 18 C4 27.5 20 48 20 48 C20 48 36 27.5 36 18 C36 9.2 28.8 2 20 2 Z"
              fill="${cfg.color}"
              filter="url(#shadow${lugar.id})"
              stroke="${activo ? 'white' : 'rgba(255,255,255,0.5)'}"
              stroke-width="${activo ? 2.5 : 1.5}"/>
            <text x="20" y="22" text-anchor="middle" dominant-baseline="middle"
              font-family="Inter,system-ui,sans-serif"
              font-size="${fontSize}" font-weight="800" fill="white"
              letter-spacing="-0.5">${lugar.id}</text>
          </svg>`,
        className:  '',
        iconSize:   [size, size + 10],
        iconAnchor: [size / 2, size + 10],
      })

      const nombreCorto = lugar.nombre.split(',')[0].trim()

      const marker = L.marker([lugar.lat, lugar.lng], { icon: svgIcon })
        .addTo(map)
        .bindTooltip(`${cfg.emoji} ${nombreCorto}`, {
          direction: 'top',
          offset:    [0, -(size + 10)],
          opacity:   0.97,
          permanent: false,
        })
        .on('click', () => {
          setLugarActivo(activo ? null : lugar)
          map.flyTo([lugar.lat!, lugar.lng!], Math.max(map.getZoom(), 15), {
            animate:  true,
            duration: 0.6,
          })
        })

      markersRef.current.push(marker)
    })

    // Ajustar vista a todos los markers
    const coordsValidas = lugaresFiltrados
      .filter(l => l.lat && l.lng)
      .map(l => [l.lat!, l.lng!] as [number, number])

    if (coordsValidas.length > 0) {
      const bounds = L.latLngBounds(coordsValidas)
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugaresFiltrados, lugarActivo])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function MapaInteractivo({
  planTexto,
  destino,
  onCerrar,
  onEnviarChat,
  cargandoChat,
}: MapaInteractivoProps) {
  const [lugares,     setLugares]     = useState<LugarMapa[]>([])
  const [lugarActivo, setLugarActivo] = useState<LugarMapa | null>(null)
  const [filtroDia,   setFiltroDia]   = useState<string>('Todo')
  const [dias,        setDias]        = useState<string[]>([])
  const [chatVisible, setChatVisible] = useState(true)
  const [inputChat,   setInputChat]   = useState('')
  const [isMounted,   setIsMounted]   = useState(false)

  // Montar Leaflet CSS solo en cliente
  useEffect(() => {
    setIsMounted(true)
    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link')
      link.id     = 'leaflet-css'
      link.rel    = 'stylesheet'
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
  }, [])

  // Extraer lugares del plan
  useEffect(() => {
    const extraidos  = extraerLugares(planTexto, destino)
    const iniciales: LugarMapa[] = extraidos.map(l => ({ ...l, geocoded: false }))
    setLugares(iniciales)
    const diasUnicos = ['Todo', ...new Set(iniciales.map(l => l.dia).filter(d => d !== 'General'))]
    setDias(diasUnicos)
  }, [planTexto, destino])

  // Geocodificación escalonada — respeta rate limit de Nominatim (1 req/s)
  useEffect(() => {
    const pendientes = lugares.filter(l => !l.geocoded)
    if (pendientes.length === 0) return

    const timers: ReturnType<typeof setTimeout>[] = []

    pendientes.forEach((lugar, index) => {
      const timer = setTimeout(async () => {
        const coords = await geocodificar(lugar.nombre, destino, planTexto)
        setLugares(prev => prev.map(l =>
          l.id === lugar.id
            ? { ...l, lat: coords?.lat, lng: coords?.lng, geocoded: true }
            : l
        ))
      }, index * 900)  // 900ms entre requests → seguro para Nominatim
      timers.push(timer)
    })

    return () => timers.forEach(t => clearTimeout(t))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugares.length])

  // Lugares geocodificados y filtrados por día
  const lugaresFiltrados = lugares.filter(l =>
    (filtroDia === 'Todo' || l.dia === filtroDia || l.dia === 'General') &&
    l.geocoded && l.lat && l.lng
  )

  const rutaCoords = lugaresFiltrados
    .filter(l => l.lat && l.lng)
    .map(l => [l.lat!, l.lng!] as [number, number])

  const centroInicial: [number, number] = lugaresFiltrados[0]
    ? [lugaresFiltrados[0].lat!, lugaresFiltrados[0].lng!]
    : [40.4168, -3.7038]  // Madrid como centro por defecto

  const pendientesGeocode = lugares.filter(l => !l.geocoded).length

  // Abrir ruta completa en Google Maps
  const abrirRutaCompleta = () => {
    const puntos = lugaresFiltrados.filter(l => l.lat && l.lng)
    if (puntos.length === 0) return
    if (puntos.length === 1) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${puntos[0].lat},${puntos[0].lng}`,
        '_blank'
      )
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
        @keyframes geocoding-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes spin-mapa { to { transform: rotate(360deg); } }
        .leaflet-container { background: #0f172a !important; }
        .leaflet-tile      { filter: brightness(0.88) saturate(0.85) !important; }
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
          background: rgba(8,12,24,0.96) !important;
          border: 1px solid rgba(16,185,129,0.35) !important;
          color: #f1f5f9 !important;
          font-size: 12px !important;
          border-radius: 8px !important;
          padding: 5px 11px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
          font-weight: 500 !important;
        }
        .leaflet-tooltip-top::before {
          border-top-color: rgba(16,185,129,0.35) !important;
        }
      `}</style>

      {/* Overlay oscuro */}
      <div
        onClick={onCerrar}
        style={{
          position:       'fixed',
          inset:          0,
          background:     'rgba(0,0,0,0.72)',
          zIndex:         200,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel principal */}
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
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   dias.length > 1 ? '10px' : 0,
          }}>
            {/* Título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width:           '28px',
                height:          '28px',
                borderRadius:    '8px',
                background:      'linear-gradient(135deg,#059669,#10b981)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontSize:        '14px',
              }}>🗺️</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                  Mapa del Plan
                  {destino && (
                    <span style={{ color: '#10b981', marginLeft: '6px' }}>
                      · {destino}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
                  {pendientesGeocode > 0 ? (
                    <span style={{ animation: 'geocoding-pulse 1s infinite' }}>
                      📡 Localizando {lugares.length - pendientesGeocode}/{lugares.length} lugares...
                    </span>
                  ) : (
                    `✅ ${lugaresFiltrados.length} lugares en el mapa`
                  )}
                </div>
              </div>
            </div>

            {/* Botones header */}
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
                  width:          '32px',
                  height:         '32px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  cursor:         'pointer',
                  color:          '#64748b',
                  transition:     'all .2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(51,65,85,0.8)'
                  e.currentTarget.style.color      = '#f1f5f9'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(30,41,59,0.6)'
                  e.currentTarget.style.color      = '#64748b'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filtros por día */}
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
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '100%',
              gap:            '12px',
              color:          '#334155',
            }}>
              <div style={{
                width:       '40px',
                height:      '40px',
                borderRadius:'50%',
                border:      '3px solid transparent',
                borderTop:   '3px solid #10b981',
                animation:   'spin-mapa 0.9s linear infinite',
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
                    width:          '34px',
                    height:         '34px',
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
