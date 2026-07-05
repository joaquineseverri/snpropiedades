'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Propiedad } from '@/lib/types'
import MapClientDynamic from './MapClientDynamic'

/* ── Paleta del prototipo ─────────────────────────────────────────────────── */
const TIPO_STYLE: Record<string, { bg: string; color: string; activeBg: string }> = {
  Casa: { bg: '#e8f5e9', color: '#2e7d32', activeBg: '#2e7d32' },
  Dpto: { bg: '#e3f2fd', color: '#1565c0', activeBg: '#1565c0' },
  Lote: { bg: '#fff3e0', color: '#e65100', activeBg: '#e65100' },
  Otro: { bg: '#f3e5f5', color: '#6a1b9a', activeBg: '#6a1b9a' },
}
const BADGE: Record<string, { bg: string; color: string }> = {
  Casa: { bg: '#e8f5e9', color: '#2e7d32' },
  Dpto: { bg: '#e3f2fd', color: '#1565c0' },
  Lote: { bg: '#fff3e0', color: '#e65100' },
  Otro: { bg: '#f3e5f5', color: '#6a1b9a' },
}
const TIPOS = ['Casa', 'Dpto', 'Lote', 'Otro']
const PRECIO_MAX = 600000

function fmtPrecio(p: number | null) {
  if (!p) return 'A consultar'
  return `USD ${p.toLocaleString('es-AR')}`
}
function dist2(a: Propiedad, lat: number, lng: number) {
  return (a.lat! - lat) ** 2 + (a.lng! - lng) ** 2
}

export default function MapPageClient({ propiedades }: { propiedades: Propiedad[] }) {
  const [tiposActivos, setTipos]  = useState<Set<string>>(new Set(TIPOS))
  const [precioMax,    setPrecio] = useState(PRECIO_MAX)
  const [selected,     setSelected] = useState<string | null>(null)
  const [hoveredProp,  setHovered]  = useState<Propiedad | null>(null)
  const [showEsc,      setShowEsc]  = useState(false)
  const [showHosp,     setShowHosp] = useState(false)

  function toggleTipo(t: string) {
    setTipos(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next.size === 0 ? new Set(TIPOS) : next
    })
  }

  /* Props filtradas por tipo/precio (con coords, dentro del centro) */
  const filtered = useMemo(() =>
    propiedades.filter(p => tiposActivos.has(p.tipo) &&
      (p.precio_usd == null || p.precio_usd <= precioMax)),
    [propiedades, tiposActivos, precioMax]
  )

  /* Sidebar ordenada: si hay hover, la más cercana primero; si no, orden original */
  const sidebarOrdered = useMemo(() => {
    if (!hoveredProp?.lat || !hoveredProp?.lng) return filtered
    return [...filtered].sort((a, b) =>
      dist2(a, hoveredProp.lat!, hoveredProp.lng!) -
      dist2(b, hoveredProp.lat!, hoveredProp.lng!)
    )
  }, [filtered, hoveredProp])

  const onHover   = useCallback((p: Propiedad) => setHovered(p), [])
  const onUnhover = useCallback(() => setHovered(null), [])

  return (
    <div style={{
      fontFamily: "'Segoe UI',system-ui,sans-serif",
      height: '100vh', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: '#f5f5f0', color: '#1a1a1a',
    }}>

      {/* ── Header ── */}
      <header style={{
        background: '#1a1a2e', color: '#fff', padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.3)',
      }}>
        <a href="/" style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, textDecoration: 'none' }}>← Inicio</a>
        <div style={{ fontWeight: 700, fontSize: 17 }}>
          SN <span style={{ color: '#7eb8f7' }}>Propiedades</span>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{filtered.length} en mapa</span>
      </header>

      {/* ── Filter bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e5e5',
        padding: '8px 16px', display: 'flex', gap: 10,
        alignItems: 'center', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Tipo pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIPOS.map(t => {
            const s = TIPO_STYLE[t]
            const active = tiposActivos.has(t)
            return (
              <button key={t} onClick={() => toggleTipo(t)} style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                fontWeight: 500, border: '1.5px solid transparent', transition: 'all .15s',
                background: active ? s.activeBg : s.bg,
                color:      active ? '#fff' : s.color,
                borderColor: active ? s.activeBg : 'transparent',
              }}>{t}</button>
            )
          })}
        </div>

        {/* Precio slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>
            Hasta <strong style={{ color: '#1a1a2e' }}>
              {precioMax >= PRECIO_MAX ? '∞' : `USD ${precioMax.toLocaleString('es-AR')}`}
            </strong>
          </span>
          <input type="range" min={0} max={PRECIO_MAX} step={5000} value={precioMax}
            onChange={e => setPrecio(Number(e.target.value))}
            style={{ accentColor: '#4a7fcb', width: 90 }}
          />
        </div>

        {/* POI toggles */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <button onClick={() => setShowEsc(v => !v)} style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
            fontWeight: 500, border: '1.5px solid transparent', transition: 'all .15s',
            background: showEsc ? '#f5a623' : '#fff7e6',
            color:      showEsc ? '#fff'    : '#a05a00',
            borderColor: showEsc ? '#f5a623' : 'transparent',
          }}>🏫 Escuelas</button>
          <button onClick={() => setShowHosp(v => !v)} style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
            fontWeight: 500, border: '1.5px solid transparent', transition: 'all .15s',
            background: showHosp ? '#e74c3c' : '#fde8e8',
            color:      showHosp ? '#fff'    : '#a00',
            borderColor: showHosp ? '#e74c3c' : 'transparent',
          }}>🏥 Hospitales</button>
        </div>

        <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
          {filtered.length} propiedades
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 340, flexShrink: 0, overflowY: 'auto', minHeight: 0,
          background: '#f5f5f0', borderRight: '1px solid #e2e2dc',
          display: 'flex', flexDirection: 'column',
        }}>
          {hoveredProp && (
            <div style={{
              padding: '6px 14px', background: '#e8f0fe', borderBottom: '1px solid #c5d8f7',
              fontSize: 11, color: '#1a3a7a', fontWeight: 600,
            }}>
              Propiedades cerca de <em>{hoveredProp.direccion.split(',')[0]}</em>
            </div>
          )}

          {sidebarOrdered.map((p, idx) => {
            const s = BADGE[p.tipo] ?? BADGE.Otro
            const isActive = selected === p.id
            const isFirst  = hoveredProp && idx === 0
            return (
              <div key={p.id}
                onClick={() => setSelected(isActive ? null : p.id)}
                style={{
                  background: '#fff', margin: 8, borderRadius: 10, overflow: 'hidden',
                  cursor: 'pointer', flexShrink: 0,
                  border: `2px solid ${isFirst ? '#e65100' : isActive ? '#4a7fcb' : 'transparent'}`,
                  boxShadow: isActive
                    ? '0 4px 16px rgba(74,127,203,.25)'
                    : '0 1px 4px rgba(0,0,0,.06)',
                  transition: 'border-color .15s, box-shadow .15s',
                }}
              >
                {/* Head */}
                <div style={{ padding: '11px 13px 8px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: '.4px', flexShrink: 0,
                    background: s.bg, color: s.color,
                  }}>{p.tipo}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>
                    {p.direccion.split(',')[0]}
                  </div>
                  {isFirst && <span style={{
                    fontSize: 9, fontWeight: 700, color: '#fff', background: '#e65100',
                    padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                  }}>Más cerca</span>}
                </div>

                <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', padding: '0 13px 4px' }}>
                  {fmtPrecio(p.precio_usd)}
                </div>

                {p.descripcion && (
                  <div style={{
                    padding: '0 13px 8px', fontSize: 12, color: '#666', lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.descripcion}</div>
                )}

                <div style={{
                  padding: '7px 13px 10px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', borderTop: '1px solid #f3f3f3', gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: '#aaa', flex: 1 }}>{p.inmobiliaria ?? ''}</span>
                  <a href={`/propiedades/${p.slug ?? p.id}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: 11, fontWeight: 700, color: '#4a7fcb',
                      padding: '4px 11px', border: '1.5px solid #4a7fcb',
                      borderRadius: 20, textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>
                    Ver más →
                  </a>
                </div>
              </div>
            )
          })}
        </aside>

        {/* ── Mapa ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapClientDynamic
            propiedades={filtered}
            showEscuelas={showEsc}
            showHospitales={showHosp}
            onSelectProp={p => setSelected(p.id)}
            onHoverProp={onHover}
            onUnhoverProp={onUnhover}
          />
        </div>
      </div>
    </div>
  )
}
