'use client'

import { useState, useMemo } from 'react'
import type { Propiedad } from '@/lib/types'

/* ── Paleta exacta del prototipo ──────────────────────────────────────────── */
const TIPO_STYLE: Record<string, { bg: string; color: string; activeBg: string; label: string }> = {
  Casa: { bg: '#e8f5e9', color: '#2e7d32', activeBg: '#2e7d32', label: 'Casa'  },
  Dpto: { bg: '#e3f2fd', color: '#1565c0', activeBg: '#1565c0', label: 'Dpto'  },
  Lote: { bg: '#fff3e0', color: '#e65100', activeBg: '#e65100', label: 'Lote'  },
  Otro: { bg: '#f3e5f5', color: '#6a1b9a', activeBg: '#6a1b9a', label: 'Otro'  },
}
const TIPOS = ['Todos', 'Casa', 'Dpto', 'Lote', 'Otro']

function fmtPrecio(p: number | null) {
  if (!p) return { main: 'A consultar', tag: '' }
  return { main: `USD ${p.toLocaleString('es-AR')}`, tag: '' }
}

function parseTags(caract: string | null): string[] {
  if (!caract) return []
  return caract.split(/[|·,;\/]+/).map(t => t.trim()).filter(t => t.length > 1).slice(0, 4)
}

const POR_PAG = 24

export default function PropertyGrid({ propiedades }: { propiedades: Propiedad[] }) {
  const [tipo,      setTipo]     = useState('Todos')
  const [precioMax, setPrecioMax]= useState('')
  const [busqueda,  setBusqueda] = useState('')
  const [pagina,    setPagina]   = useState(1)

  const filtered = useMemo(() => {
    const max = parseInt(precioMax.replace(/\D/g, ''))
    const q   = busqueda.toLowerCase()
    return propiedades.filter(p => {
      if (tipo !== 'Todos' && p.tipo !== tipo) return false
      if (max > 0 && p.precio_usd && p.precio_usd > max) return false
      if (q && !p.direccion.toLowerCase().includes(q) &&
               !(p.zona ?? '').toLowerCase().includes(q) &&
               !(p.descripcion ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [propiedades, tipo, precioMax, busqueda])

  const paged   = filtered.slice(0, pagina * POR_PAG)
  const hasMore = filtered.length > pagina * POR_PAG

  function reset() { setTipo('Todos'); setPrecioMax(''); setBusqueda(''); setPagina(1) }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 80px' }}>

      {/* ── Filtros ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e5e5',
        padding: '10px 0', marginBottom: 20,
        position: 'sticky', top: 50, zIndex: 40,
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="🔍  Buscar por dirección, zona o descripción…"
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
          style={{
            width: '100%', border: '1px solid #ddd', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, marginBottom: 10,
            outline: 'none', background: '#fafafa',
          }}
        />

        {/* Pills + precio */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {TIPOS.map(t => {
            const s = TIPO_STYLE[t]
            const active = tipo === t
            return (
              <button
                key={t}
                onClick={() => { setTipo(t); setPagina(1) }}
                style={{
                  fontSize: 12, padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                  fontWeight: 600, border: '1.5px solid transparent', transition: 'all .15s',
                  background: active ? (s?.activeBg ?? '#1a1a2e') : (s?.bg ?? '#f0f2f5'),
                  color:      active ? '#fff' : (s?.color ?? '#333'),
                  borderColor: active ? (s?.activeBg ?? '#1a1a2e') : 'transparent',
                }}
              >
                {t}
              </button>
            )
          })}

          <input
            type="text"
            placeholder="Precio máx USD"
            value={precioMax}
            onChange={e => { setPrecioMax(e.target.value); setPagina(1) }}
            style={{
              marginLeft: 'auto', border: '1px solid #ddd', borderRadius: 8,
              padding: '5px 12px', fontSize: 12, width: 140,
              outline: 'none', background: '#fafafa',
            }}
          />
        </div>

        {/* Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#888' }}>
            {filtered.length.toLocaleString('es-AR')} propiedades
          </span>
          {(tipo !== 'Todos' || precioMax || busqueda) && (
            <button onClick={reset}
              style={{ fontSize: 12, color: '#4a7fcb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {paged.map(p => {
          const s = TIPO_STYLE[p.tipo] ?? TIPO_STYLE.Otro
          const { main } = fmtPrecio(p.precio_usd)
          const tags = parseTags(p.caracteristicas)
          const addr = p.direccion.split(',')[0]

          return (
            <a
              key={p.id}
              href={`/propiedades/${p.slug ?? p.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div
                className="prop-card"
                style={{
                  background: '#fff', borderRadius: 10, overflow: 'hidden',
                  border: '2px solid transparent', cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  transition: 'box-shadow .15s, transform .1s, border-color .15s',
                  height: '100%', display: 'flex', flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'
                  el.style.transform = 'translateY(-1px)'
                  el.style.borderColor = '#4a7fcb'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'
                  el.style.transform = 'translateY(0)'
                  el.style.borderColor = 'transparent'
                }}
              >
                {/* Head */}
                <div style={{ padding: '11px 13px 8px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: '.4px', flexShrink: 0,
                    background: s.bg, color: s.color,
                  }}>
                    {p.tipo}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>
                    {addr}
                  </div>
                </div>

                {/* Price */}
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', padding: '0 13px 4px' }}>
                  {main}
                </div>

                {/* Description */}
                {p.descripcion && (
                  <div style={{
                    padding: '0 13px 8px', fontSize: 12, color: '#666', lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {p.descripcion}
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div style={{ padding: '0 13px 8px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {tags.map((t, i) => (
                      <span key={i} style={{
                        fontSize: 10, background: '#f0f2f5', color: '#555',
                        padding: '2px 8px', borderRadius: 10,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  padding: '7px 13px 10px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', borderTop: '1px solid #f3f3f3',
                  marginTop: 'auto', gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: '#aaa', flex: 1 }}>
                    {p.inmobiliaria ?? ''}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#4a7fcb',
                    padding: '4px 11px', border: '1.5px solid #4a7fcb', borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    Ver más →
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#aaa' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Sin resultados</div>
          <button onClick={reset}
            style={{ color: '#4a7fcb', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => setPagina(p => p + 1)}
            style={{
              background: '#1a1a2e', color: '#fff', fontWeight: 700, fontSize: 13,
              padding: '12px 32px', borderRadius: 30, border: 'none', cursor: 'pointer',
            }}
          >
            Ver más propiedades ({filtered.length - pagina * POR_PAG} restantes)
          </button>
        </div>
      )}
    </div>
  )
}
