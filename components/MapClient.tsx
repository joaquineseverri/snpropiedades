'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Propiedad } from '@/lib/types'

/* ── Colores exactos del prototipo ───────────────────────────────────────── */
const COLORS: Record<string, string> = {
  Casa: '#2e7d32',
  Dpto: '#1565c0',
  Lote: '#e65100',
  Otro: '#6a1b9a',
}

/* ── Polígono del Centro (idéntico al prototipo) ─────────────────────────── */
const CENTRO_POLY: [number, number][] = [
  [-33.34700, -60.22130],  // SW
  [-33.33806, -60.23424],  // NW
  [-33.32282, -60.21918],  // NE
  [-33.33148, -60.20585],  // SE
]

function pointInPoly(lat: number, lng: number, poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j]
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function shortAddr(addr: string) {
  return addr.split(',')[0].replace(/\s+san nicol.*/i, '').trim()
}
function fmtPrecio(p: number | null) {
  if (!p) return 'Precio a consultar'
  return `USD ${p.toLocaleString('es-AR')}`
}
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface Props {
  propiedades: Propiedad[]
  showEscuelas?: boolean
  showHospitales?: boolean
  onSelectProp?: (prop: Propiedad) => void
  onHoverProp?:  (prop: Propiedad) => void
  onUnhoverProp?: () => void
}

export default function MapClient({
  propiedades,
  showEscuelas  = false,
  showHospitales = false,
  onSelectProp,
  onHoverProp,
  onUnhoverProp,
}: Props) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const markersRef      = useRef<Record<string, any>>({})
  const schoolLayerRef  = useRef<any>(null)
  const hospitalLayerRef= useRef<any>(null)
  const LRef            = useRef<any>(null)

  /* ── Inicializar mapa ───────────────────────────────────────────────────── */
  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return

    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    LRef.current = L

    const map = L.map(containerRef.current, {
      center: [-33.334, -60.217],
      zoom: 14,
      zoomControl: true,
    })
    mapRef.current = map

    /* Tiles CARTO Voyager */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    /* ── Polígono del Centro ── */
    L.polygon(CENTRO_POLY, {
      color: '#4a7fcb', weight: 2, opacity: 0.5,
      fillOpacity: 0.05, dashArray: '6 4',
    }).addTo(map).bindTooltip('Zona Centro', { sticky: false, direction: 'center' })

    /* ── Círculo Plaza Mitre ── */
    L.circle([-33.32762, -60.21701], {
      radius: 300,
      color: '#e65c00', weight: 2, dashArray: '5 4',
      fillColor: '#e65c00', fillOpacity: 0.08,
    }).addTo(map)

    L.divIcon({
      html: '<div style="width:14px;height:14px;background:#e65c00;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7], className: '',
    })
    L.marker([-33.32762, -60.21701], {
      icon: L.divIcon({
        html: '<div style="width:14px;height:14px;background:#e65c00;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7], className: '',
      }),
    }).addTo(map).bindTooltip('Plaza Mitre', { direction: 'top', permanent: false })

    /* ── Leyenda ── */
    const legend = (L as any).control({ position: 'bottomright' })
    legend.onAdd = () => {
      const d = L.DomUtil.create('div')
      d.innerHTML = `
        <div style="background:rgba(255,255,255,.92);border-radius:8px;padding:10px 12px;
                    font-size:11px;line-height:1.9;box-shadow:0 1px 6px rgba(0,0,0,.15);
                    backdrop-filter:blur(4px)">
          <div style="font-weight:700;font-size:12px;color:#333;margin-bottom:5px">Tipos</div>
          ${Object.entries(COLORS).map(([tipo, color]) => `
            <div style="display:flex;align-items:center;gap:6px;color:#555">
              <span style="width:10px;height:10px;border-radius:50%;background:${color};
                           display:inline-block;border:1.5px solid #fff;
                           box-shadow:0 0 0 1px ${color}40;flex-shrink:0"></span>
              ${tipo}
            </div>`).join('')}
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;font-size:10px;color:#aaa">
            <span style="background:#e65c00;border-radius:50%;width:8px;height:8px;display:inline-block;margin-right:4px"></span>Plaza Mitre
          </div>
        </div>`
      return d
    }
    legend.addTo(map)

    /* ── Markers (círculos, igual al prototipo) ── */
    propiedades.forEach(p => {
      if (!p.lat || !p.lng) return
      if (!pointInPoly(p.lat, p.lng, CENTRO_POLY)) return

      const color = COLORS[p.tipo] ?? '#666'

      const m = L.circleMarker([p.lat, p.lng], {
        radius: 7,
        fillColor: color,
        color: '#fff',
        weight: 1.5,
        fillOpacity: 0.88,
      })
      .addTo(map)
      .bindTooltip(`
        <div style="min-width:130px;max-width:200px;font-family:'Segoe UI',system-ui,sans-serif">
          <div style="font-weight:700;font-size:13px;color:#1a1a2e">${shortAddr(p.direccion)}</div>
          <div style="font-size:11px;color:${color};font-weight:600;margin-top:2px">${p.tipo}</div>
          ${p.precio_usd ? `<div style="font-size:12px;font-weight:700;color:#333;margin-top:2px">${fmtPrecio(p.precio_usd)}</div>` : ''}
          ${p.inmobiliaria ? `<div style="font-size:10px;color:#888;margin-top:1px">${p.inmobiliaria}</div>` : ''}
        </div>
      `, { sticky: true, direction: 'auto', opacity: 1,
           className: 'snp-tooltip' })
      .bindPopup(`
        <div style="min-width:180px;font-family:'Segoe UI',system-ui,sans-serif">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${color};margin-bottom:4px">${p.tipo}</div>
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:3px">${shortAddr(p.direccion)}</div>
          <div style="font-size:16px;font-weight:800;color:#1a1a2e">${fmtPrecio(p.precio_usd)}</div>
          ${p.caracteristicas ? `<div style="font-size:11px;color:#888;margin-top:3px">${p.caracteristicas}</div>` : ''}
          ${p.inmobiliaria ? `<div style="font-size:11px;color:#888;margin-top:2px">${p.inmobiliaria}</div>` : ''}
          <a href="/propiedades/${p.slug ?? p.id}"
             style="display:inline-block;margin-top:8px;font-size:11px;color:#4a7fcb;
                    text-decoration:none;font-weight:600;
                    border:1.5px solid #4a7fcb;padding:3px 10px;border-radius:20px;">
            Ver propiedad →
          </a>
        </div>
      `, { maxWidth: 240 })

      m.on('mouseover', () => {
        m.setStyle({ radius: 10, weight: 2.5 })
        onHoverProp?.(p)
      })
      m.on('mouseout', () => {
        m.setStyle({ radius: 7, weight: 1.5 })
        onUnhoverProp?.()
      })
      m.on('click', () => {
        onSelectProp ? onSelectProp(p) : (window.location.href = `/propiedades/${p.slug ?? p.id}`)
      })

      markersRef.current[p.id] = m
    })

    /* ── POI layers (se cargan, pero se muestran solo cuando el toggle lo pide) ── */
    schoolLayerRef.current   = L.layerGroup()
    hospitalLayerRef.current = L.layerGroup()

    loadOverpassPOIs(L, map)

  }, [propiedades, onSelectProp, onHoverProp, onUnhoverProp])

  /* ── Overpass API: escuelas y hospitales ── */
  async function loadOverpassPOIs(L: any, map: any) {
    const bbox = '-33.36,-60.25,-33.31,-60.19'
    const query = `[out:json][timeout:20];(
      node["amenity"="school"](${bbox});
      way["amenity"="school"](${bbox});
      node["amenity"="hospital"](${bbox});
      node["amenity"="clinic"](${bbox});
      node["healthcare"="hospital"](${bbox});
    );out center;`

    try {
      const res  = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      const data = await res.json()

      for (const el of data.elements ?? []) {
        const lat = el.lat ?? el.center?.lat
        const lng = el.lon ?? el.center?.lon
        if (!lat || !lng) continue

        const name    = el.tags?.name ?? el.tags?.amenity ?? 'Sin nombre'
        const amenity = el.tags?.amenity ?? el.tags?.healthcare ?? ''
        const isSchool = amenity === 'school'
        const color   = isSchool ? '#f5a623' : '#e74c3c'
        const icon_   = isSchool ? '🏫' : '🏥'
        const group   = isSchool ? schoolLayerRef.current : hospitalLayerRef.current

        const mk = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div style="width:34px;height:34px;background:${color};border-radius:50%;
                               border:3px solid #fff;box-shadow:0 0 0 2px ${color},0 4px 14px ${color}88;
                               display:flex;align-items:center;justify-content:center;font-size:18px">
                     ${icon_}
                   </div>`,
            iconSize: [34, 34], iconAnchor: [17, 17], className: '',
          }),
        }).bindTooltip(name, { permanent: false, direction: 'top' })

        if (isSchool) {
          L.circle([lat, lng], {
            radius: 300,
            color, weight: 2, dashArray: '5 3',
            fillColor: color, fillOpacity: 0.1,
          }).addTo(group)
        }
        mk.addTo(group)
      }
    } catch { /* sin POIs si falla la red */ }
  }

  /* ── Reaccionar a cambios de visibilidad POI ── */
  useEffect(() => {
    const map = mapRef.current
    const sl  = schoolLayerRef.current
    const hl  = hospitalLayerRef.current
    if (!map || !sl || !hl) return
    if (showEscuelas)    sl.addTo(map); else map.removeLayer(sl)
    if (showHospitales)  hl.addTo(map); else map.removeLayer(hl)
  }, [showEscuelas, showHospitales])

  /* ── Montar / desmontar ── */
  useEffect(() => {
    initMap()
    return () => {
      mapRef.current?.remove()
      mapRef.current       = null
      markersRef.current   = {}
      schoolLayerRef.current   = null
      hospitalLayerRef.current = null
    }
  }, [initMap])

  /* ── Resaltar marker seleccionado ── */
  useEffect(() => {
    // no-op placeholder (se puede expandir)
  }, [])

  return (
    <>
      <style>{`
        .snp-tooltip {
          background: #fff !important;
          border: none !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 18px rgba(0,0,0,.18) !important;
          padding: 8px 12px !important;
          pointer-events: none !important;
        }
        .snp-tooltip::before { display: none !important; }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
    </>
  )
}
