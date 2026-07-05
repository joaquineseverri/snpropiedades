'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Propiedad } from '@/lib/types'

/* ── Colores exactos del prototipo ───────────────────────────────────────── */
const TIPO_COLOR: Record<string, string> = {
  Casa: '#2e7d32',
  Dpto: '#1565c0',
  Lote: '#e65100',
  Otro: '#6a1b9a',
}
const TIPO_BG: Record<string, string> = {
  Casa: '#e8f5e9',
  Dpto: '#e3f2fd',
  Lote: '#fff3e0',
  Otro: '#f3e5f5',
}
const TIPO_ABREV: Record<string, string> = {
  Casa: 'CA', Dpto: 'DP', Lote: 'LT', Otro: 'OT',
}

const CENTRO_POLY: [number, number][] = [
  [-33.34700, -60.22130],
  [-33.33806, -60.23424],
  [-33.32282, -60.21918],
  [-33.33148, -60.20585],
]

function shortAddr(addr: string): string {
  return addr.split(',')[0].replace(/\s+san nicol.*/i, '').trim()
}
function fmtPrecio(p: number | null): string {
  if (!p) return 'A consultar'
  return `USD ${p.toLocaleString('es-AR')}`
}

interface Props {
  propiedades: Propiedad[]
  onSelectProp?: (prop: Propiedad) => void
}

export default function MapClient({ propiedades, onSelectProp }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<Record<string, any>>({})

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return

    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    const map = L.map(containerRef.current, {
      center: [-33.335, -60.215],
      zoom: 14,
      zoomControl: true,
    })
    mapRef.current = map

    // Tiles CARTO Voyager (igual al prototipo)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    // Polígono del Centro
    L.polygon(CENTRO_POLY, {
      color: '#4a7fcb', weight: 1.5, opacity: 0.4,
      fillOpacity: 0.04, dashArray: '5 4',
    }).addTo(map)

    // Markers en forma de diamante (igual al prototipo)
    propiedades.forEach(p => {
      if (!p.lat || !p.lng) return

      const color = TIPO_COLOR[p.tipo] ?? '#666'
      const abrev = TIPO_ABREV[p.tipo] ?? 'OT'
      const tipoBg = TIPO_BG[p.tipo] ?? '#f5f5f5'

      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${color};
          border:2px solid rgba(255,255,255,.9);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,.3);
          cursor:pointer;
        ">
          <span style="transform:rotate(45deg);font-size:8px;font-weight:800;color:#fff;letter-spacing:-.3px;">
            ${abrev}
          </span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: '',
      })

      const popupContent = `
        <div style="min-width:180px;font-family:'Segoe UI',system-ui,sans-serif">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
                      color:${color};margin-bottom:4px">${p.tipo}</div>
          <div style="font-size:13px;font-weight:600;margin-bottom:3px;color:#1a1a1a">
            ${shortAddr(p.direccion)}
          </div>
          <div style="font-size:16px;font-weight:800;color:#1a1a2e">
            ${fmtPrecio(p.precio_usd)}
          </div>
          ${p.inmobiliaria ? `<div style="font-size:11px;color:#888;margin-top:3px">${p.inmobiliaria}</div>` : ''}
          <a href="/propiedades/${p.slug ?? p.id}"
             style="display:inline-block;margin-top:8px;font-size:11px;color:#4a7fcb;
                    text-decoration:none;font-weight:600;
                    border:1.5px solid #4a7fcb;padding:3px 10px;border-radius:20px;">
            Ver propiedad →
          </a>
        </div>
      `

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, { maxWidth: 240 })

      marker.on('click', () => {
        if (onSelectProp) {
          onSelectProp(p)
        }
      })

      markersRef.current[p.id] = marker
    })

    // Leyenda (igual al prototipo)
    const legend = L.control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div')
      div.innerHTML = `
        <div style="background:rgba(255,255,255,.92);border-radius:8px;padding:10px 12px;
                    font-size:11px;line-height:1.8;box-shadow:0 1px 6px rgba(0,0,0,.15);
                    backdrop-filter:blur(4px)">
          <div style="font-weight:700;font-size:12px;margin-bottom:5px;color:#333">Tipos</div>
          ${Object.entries(TIPO_COLOR).map(([tipo, color]) => `
            <div style="display:flex;align-items:center;gap:6px;color:#555">
              <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
              ${tipo}
            </div>
          `).join('')}
        </div>
      `
      return div
    }
    legend.addTo(map)

  }, [propiedades, onSelectProp])

  useEffect(() => {
    initMap()
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = {}
    }
  }, [initMap])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  )
}
