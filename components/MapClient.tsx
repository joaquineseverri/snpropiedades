'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Propiedad } from '@/lib/types'

// Colores por tipo de propiedad
const COLORS: Record<string, string> = {
  Casa: '#2e7d32',
  Dpto: '#4a7fcb',
  Lote: '#e65100',
  Otro: '#7b1fa2',
}

// Polígono del Centro
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
  if (!p) return 'Precio a consultar'
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

    // Importar Leaflet en el cliente (no existe en servidor)
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    const map = L.map(containerRef.current, {
      center: [-33.335, -60.215],
      zoom: 14,
      zoomControl: true,
    })
    mapRef.current = map

    // Tiles CARTO
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    // Polígono del Centro
    L.polygon(CENTRO_POLY, {
      color: '#4a7fcb',
      weight: 1.5,
      opacity: 0.4,
      fillOpacity: 0.04,
      dashArray: '5 4',
    }).addTo(map)

    // Agregar markers
    propiedades.forEach(p => {
      if (!p.lat || !p.lng) return

      const color = COLORS[p.tipo] ?? '#666'

      const icon = L.divIcon({
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:${color};border:2px solid #fff;
          box-shadow:0 1px 5px rgba(0,0,0,.4);
        "></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
        className: '',
      })

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<div style="font-size:12px;font-weight:700">${shortAddr(p.direccion)}</div>
           <div style="font-size:11px;color:#4a7fcb">${fmtPrecio(p.precio_usd)}</div>`,
          { direction: 'top', offset: [0, -8] }
        )

      marker.on('click', () => {
        onSelectProp?.(p)
      })

      markersRef.current[p.id] = marker
    })
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
