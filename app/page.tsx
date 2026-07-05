import { getPropiedades } from '@/lib/supabase'
import PropertyGrid from '@/components/PropertyGrid'

export const revalidate = 300

export default async function HomePage() {
  const propiedades = await getPropiedades({
    tipos: ['Casa', 'Dpto', 'Lote', 'Otro'],
    soloConCoords: false,
  })

  const casas  = propiedades.filter(p => p.tipo === 'Casa').length
  const dptos  = propiedades.filter(p => p.tipo === 'Dpto').length
  const lotes  = propiedades.filter(p => p.tipo === 'Lote').length
  const inmobs = new Set(propiedades.map(p => p.inmobiliaria).filter(Boolean)).size

  return (
    <div className="min-h-screen bg-[#f5f5f0]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#1a1a2e] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-white text-lg tracking-tight">
            SN <span className="text-[#7eb8f7]">Propiedades</span>
          </span>
          <a
            href="/mapa"
            className="flex items-center gap-1.5 bg-[#4a7fcb] hover:bg-[#3a6fbb] text-white text-[12px] font-bold px-4 py-2 rounded-full no-underline transition-colors"
          >
            🗺 Ver mapa
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-[#1a1a2e] via-[#1e2a4a] to-[#f5f5f0] pt-10 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[#7eb8f7] text-[12px] font-bold uppercase tracking-widest mb-3">
            Portal inmobiliario local
          </p>
          <h1 className="text-[32px] md:text-[42px] font-black text-white leading-tight mb-4">
            Encontrá tu propiedad<br />
            <span className="text-[#7eb8f7]">en San Nicolás</span>
          </h1>
          <p className="text-white/50 text-sm mb-8">
            Las mejores ofertas del centro, actualizadas diariamente
          </p>

          {/* Stats */}
          <div className="flex justify-center flex-wrap gap-x-8 gap-y-4">
            <StatBadge val={propiedades.length} lbl="propiedades" />
            <StatBadge val={casas}  lbl="casas" />
            <StatBadge val={dptos}  lbl="departamentos" />
            <StatBadge val={lotes}  lbl="lotes" />
            <StatBadge val={inmobs} lbl="inmobiliarias" />
          </div>
        </div>
      </div>

      {/* ── Grid con filtros ── */}
      <PropertyGrid propiedades={propiedades} />

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-8 px-4 text-center bg-white">
        <div className="text-[13px] font-black text-[#1a1a2e] mb-1">
          SN <span className="text-[#4a7fcb]">Propiedades</span>
        </div>
        <div className="text-[11px] text-gray-400">
          San Nicolás de los Arroyos · Buenos Aires · Argentina
        </div>
      </footer>

      {/* ── Botón flotante mapa ── */}
      <a
        href="/mapa"
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 bg-[#1a1a2e] text-white font-bold text-[13px] px-4 py-3 rounded-full shadow-xl no-underline hover:bg-[#2a2a4e] transition-colors"
      >
        🗺 <span>Ver en el mapa</span>
      </a>
    </div>
  )
}

function StatBadge({ val, lbl }: { val: number; lbl: string }) {
  return (
    <div className="text-center">
      <div className="text-[26px] font-black text-white leading-none">
        {val.toLocaleString('es-AR')}
      </div>
      <div className="text-[11px] text-white/40 uppercase tracking-wide mt-0.5">{lbl}</div>
    </div>
  )
}
