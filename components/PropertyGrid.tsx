'use client'

import { useState, useMemo } from 'react'
import type { Propiedad } from '@/lib/types'

const TIPOS = ['Todos', 'Casa', 'Dpto', 'Lote']

const BADGE: Record<string, string> = {
  Casa: 'bg-green-100 text-green-800',
  Dpto: 'bg-blue-100 text-blue-800',
  Lote: 'bg-orange-100 text-orange-800',
  Otro: 'bg-purple-100 text-purple-800',
}
const TIPO_ICON: Record<string, string> = {
  Casa: '🏠', Dpto: '🏢', Lote: '🌿', Otro: '🏗',
}
const BG_COLOR: Record<string, string> = {
  Casa: '#e8f5e9', Dpto: '#e3f2fd', Lote: '#fff3e0', Otro: '#f3e5f5',
}

function fmtPrecio(p: number | null) {
  if (!p) return 'Consultar'
  return `USD ${p.toLocaleString('es-AR')}`
}

interface Props {
  propiedades: Propiedad[]
}

const POR_PAG = 24

export default function PropertyGrid({ propiedades }: Props) {
  const [tipo,     setTipo]     = useState('Todos')
  const [precioMax, setPrecioMax] = useState('')
  const [busqueda, setBusqueda]  = useState('')
  const [pagina,   setPagina]    = useState(1)

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
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col gap-3">

        <input
          type="text"
          placeholder="🔍  Buscar por dirección, zona..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <div className="flex flex-wrap items-center gap-2">
          {TIPOS.map(t => (
            <button
              key={t}
              onClick={() => { setTipo(t); setPagina(1) }}
              className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                tipo === t
                  ? 'bg-[#1a1a2e] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
          <input
            type="text"
            placeholder="Precio máx USD"
            value={precioMax}
            onChange={e => { setPrecioMax(e.target.value); setPagina(1) }}
            className="ml-auto border border-gray-200 rounded-xl px-3 py-1.5 text-[12px] w-36 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>{filtered.length.toLocaleString('es-AR')} propiedades encontradas</span>
          {(tipo !== 'Todos' || precioMax || busqueda) && (
            <button onClick={reset} className="text-[#4a7fcb] font-bold">Limpiar filtros</button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paged.map(p => (
          <a
            key={p.id}
            href={`/propiedades/${p.slug ?? p.id}`}
            className="no-underline block group"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow h-full flex flex-col">

              {/* Imagen placeholder */}
              <div
                className="h-[140px] flex items-center justify-center relative flex-shrink-0"
                style={{ background: BG_COLOR[p.tipo] ?? '#f5f5f5' }}
              >
                <span className="text-5xl opacity-30">{TIPO_ICON[p.tipo] ?? '🏗'}</span>
                <span className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${BADGE[p.tipo] ?? BADGE.Otro}`}>
                  {p.tipo}
                </span>
                {p.inmobiliaria && (
                  <span className="absolute bottom-3 right-3 text-[9px] text-gray-500 bg-white/90 px-2 py-0.5 rounded-full max-w-[120px] truncate">
                    {p.inmobiliaria}
                  </span>
                )}
                {p.tiene_coords && (
                  <span className="absolute bottom-3 left-3 text-[9px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                    📍 Ubicado
                  </span>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4 flex flex-col flex-1">
                <div className="font-bold text-[14px] text-[#1a1a2e] truncate mb-0.5">
                  {p.direccion.split(',')[0]}
                </div>
                {p.zona && (
                  <div className="text-[11px] text-gray-400 mb-2">{p.zona}</div>
                )}
                <div className="font-black text-[20px] text-[#1a1a2e] mb-2">
                  {fmtPrecio(p.precio_usd)}
                </div>
                {p.caracteristicas && (
                  <div className="text-[11px] text-gray-400 truncate mb-3">
                    {p.caracteristicas}
                  </div>
                )}
                <div className="mt-auto pt-2 border-t border-gray-50">
                  <span className="text-[11px] font-bold text-[#4a7fcb]">
                    Ver propiedad →
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-semibold">Sin resultados para esa búsqueda</div>
          <button onClick={reset} className="mt-3 text-[#4a7fcb] font-bold text-sm">Limpiar filtros</button>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={() => setPagina(p => p + 1)}
            className="bg-[#1a1a2e] text-white font-bold text-[13px] px-8 py-3 rounded-full hover:bg-[#2a2a4e] transition-colors"
          >
            Ver más ({filtered.length - pagina * POR_PAG} restantes)
          </button>
        </div>
      )}
    </div>
  )
}
