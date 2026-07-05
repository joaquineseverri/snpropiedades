import { getPropiedades } from '@/lib/supabase'
import MapClientDynamic from '@/components/MapClientDynamic'
import type { Propiedad } from '@/lib/types'

function fmtPrecio(p: number | null) {
  if (!p) return 'Consultar'
  return `USD ${p.toLocaleString('es-AR')}`
}

const BADGE_COLOR: Record<string, string> = {
  Casa : 'bg-green-100 text-green-800',
  Dpto : 'bg-blue-100  text-blue-800',
  Lote : 'bg-orange-100 text-orange-800',
  Otro : 'bg-purple-100 text-purple-800',
}

export const revalidate = 300   // revalidar cada 5 minutos (ISR)

export default async function HomePage() {
  const propiedades: Propiedad[] = await getPropiedades({
    tipos: ['Casa', 'Dpto', 'Lote', 'Otro'],
    soloConCoords: true,
  })

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-4 h-[50px] bg-[#1a1a2e] text-white shadow-lg flex-shrink-0">
        <span className="font-bold text-[15px] tracking-tight">
          SN <span className="text-[#7eb8f7]">Propiedades</span>
        </span>
        <span className="text-xs text-white/60">{propiedades.length} propiedades</span>
      </header>

      {/* ── BODY: sidebar + mapa ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-[340px] flex flex-col overflow-y-auto bg-white border-r border-gray-100 flex-shrink-0">

          {/* Filtros (placeholder — se pueden hacer interactivos con useState en Client Component) */}
          <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-400">
            Mostrando {propiedades.length} propiedades en el Centro
          </div>

          {/* Cards */}
          {propiedades.map(p => (
            <a
              key={p.id}
              href={`/propiedades/${p.slug ?? p.id}`}
              className="block border-b border-gray-50 hover:bg-gray-50 transition-colors p-3 no-underline"
            >
              {/* Head */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${BADGE_COLOR[p.tipo] ?? BADGE_COLOR.Otro}`}>
                  {p.tipo}
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">{p.inmobiliaria ?? ''}</span>
              </div>

              {/* Dirección */}
              <div className="text-[13px] font-semibold text-gray-800 leading-snug truncate">
                {p.direccion.split(',')[0]}
              </div>

              {/* Precio */}
              <div className="text-[12px] font-bold text-[#1a1a2e] mt-0.5">
                {fmtPrecio(p.precio_usd)}
              </div>

              {/* Características */}
              {p.caracteristicas && (
                <div className="text-[10px] text-gray-400 mt-1 truncate">{p.caracteristicas}</div>
              )}

              {/* Descripción snippet */}
              {p.descripcion && (
                <div className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-snug">
                  {p.descripcion}
                </div>
              )}

              {/* CTA */}
              <div className="mt-2">
                <span className="text-[10px] font-bold text-[#4a7fcb] border border-[#4a7fcb] px-2 py-0.5 rounded-full">
                  Ver más →
                </span>
              </div>
            </a>
          ))}
        </aside>

        {/* Mapa */}
        <div className="flex-1 relative">
          <MapClientDynamic propiedades={propiedades} />
        </div>
      </div>
    </div>
  )
}
