import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { getPropiedadBySlug, getPropiedad } from '@/lib/supabase'
import Analytics from '@/components/Analytics'
import type { Propiedad } from '@/lib/types'

const MapClient = dynamic(() => import('@/components/MapClient'), { ssr: false })

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrecio(p: number | null) {
  if (!p) return 'Precio a consultar'
  return `USD ${p.toLocaleString('es-AR')}`
}

function shortAddr(addr: string) {
  return addr.split(',')[0].trim()
}

function parseCaract(caract: string | null) {
  if (!caract) return {}
  const dorm  = caract.match(/(\d+)\s*dorm/i)?.[1]
  const banios = caract.match(/(\d+)\s*ba[ñn]/i)?.[1]
  const coch  = caract.match(/(\d+)\s*coch/i)?.[1]
  const m2    = caract.match(/(\d+[\.,]?\d*)\s*m2/i)?.[1]
  return { dorm, banios, coch, m2 }
}

// ── Metadata dinámica ──────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { id: string } }) {
  const prop = await getProp(params.id)
  if (!prop) return { title: 'Propiedad no encontrada' }
  return {
    title: `${prop.tipo} en ${shortAddr(prop.direccion)} — SN Propiedades`,
    description: prop.descripcion?.slice(0, 155) ?? `${prop.tipo} en venta en San Nicolás de los Arroyos`,
  }
}

// ── Resolver por slug o UUID ───────────────────────────────────────────────
async function getProp(id: string): Promise<Propiedad | null> {
  // Si parece UUID
  if (/^[0-9a-f-]{36}$/i.test(id)) return getPropiedad(id)
  return getPropiedadBySlug(id)
}

export const revalidate = 300

// ── Página ─────────────────────────────────────────────────────────────────
export default async function PropiedadPage({ params }: { params: { id: string } }) {
  const prop = await getProp(params.id)
  if (!prop) notFound()

  const { dorm, banios, coch, m2 } = parseCaract(prop.caracteristicas)
  const aptaCredito = /cr[eé]dito/i.test(prop.descripcion ?? '') ||
                      /cr[eé]dito/i.test(prop.caracteristicas ?? '')

  const svUrl = prop.lat && prop.lng
    ? `https://maps.google.com/?layer=c&cbll=${prop.lat},${prop.lng}&cbp=12,90,0,0,5`
    : 'https://maps.google.com/?q=San+Nicol%C3%A1s+de+los+Arroyos'

  const gmUrl = prop.lat && prop.lng
    ? `https://maps.google.com/?q=${prop.lat},${prop.lng}`
    : 'https://maps.google.com/?q=San+Nicol%C3%A1s+de+los+Arroyos'

  return (
    <>
      {/* Analytics — corre solo en el cliente */}
      <Analytics propId={prop.id} />

      <div className="flex flex-col min-h-screen bg-[#f5f5f0]">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-[50px] bg-[#1a1a2e] text-white shadow-lg">
          <a href="/" className="text-sm text-white/75 hover:text-white flex items-center gap-1">
            ← Volver
          </a>
          <span className="font-bold text-[15px]">
            SN <span className="text-[#7eb8f7]">Propiedades</span>
          </span>
          <button className="text-lg">♡</button>
        </header>

        {/* ── Gallery placeholder ── */}
        <div className="h-[180px] bg-[#1a2744] flex items-center justify-center relative cursor-pointer"
          onClick={() => (window as any).snpTrack?.('gallery_open', { photo: 0 })}>
          <span className="text-5xl opacity-30">🏠</span>
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur">
            📷 Fotos próximamente
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-[680px] mx-auto w-full pb-24">

          {/* ── Datos principales ── */}
          <div className="bg-white px-4 py-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {prop.tipo}
              </span>
              {aptaCredito && (
                <button
                  onClick={() => (window as any).snpCalcOpen?.()}
                  className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                >
                  ✓ Apta crédito hipotecario
                </button>
              )}
              {prop.inmobiliaria && (
                <span className="text-[10px] text-gray-400 ml-auto">{prop.inmobiliaria}</span>
              )}
            </div>

            <h1 className="text-[20px] font-black text-[#1a1a2e] leading-tight mb-1">
              {shortAddr(prop.direccion)}
            </h1>
            <p className="text-xs text-gray-400 mb-4">San Nicolás de los Arroyos, Buenos Aires</p>

            <div className="text-[28px] font-black text-[#1a1a2e]">
              {fmtPrecio(prop.precio_usd)}
            </div>

            {/* Stats */}
            {(dorm || banios || coch || m2) && (
              <div className="flex border-t border-gray-50 mt-4 pt-4 gap-0">
                {dorm   && <Stat icon="🛏"  val={dorm}   lbl="Dorm." />}
                {banios && <Stat icon="🚿"  val={banios} lbl="Baños" />}
                {coch   && <Stat icon="🚗"  val={coch}   lbl="Cochera" />}
                {m2     && <Stat icon="📐"  val={m2+'m²'} lbl="Terreno" />}
              </div>
            )}
          </div>

          {/* ── Descripción ── */}
          {prop.descripcion && (
            <div className="bg-white px-4 py-4 mt-2">
              <SectionTitle>Descripción</SectionTitle>
              <p className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-line">
                {prop.descripcion}
              </p>
            </div>
          )}

          {/* ── Ad slot ── */}
          <div className="mx-0 my-2 border border-dashed border-gray-200 rounded-lg h-[80px] flex items-center justify-center bg-gray-50">
            <span className="text-[10px] text-gray-300 uppercase tracking-widest">Publicidad</span>
          </div>

          {/* ── Mapa + Street View ── */}
          {prop.lat && prop.lng && (
            <div className="bg-white px-4 py-4 mt-2">
              <SectionTitle>Ubicación</SectionTitle>
              <div className="h-[200px] rounded-xl overflow-hidden mb-3">
                <MapClient propiedades={[prop]} />
              </div>
              <div className="flex gap-2">
                <a
                  href={svUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => (window as any).snpStreetViewClick?.()}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a2e] text-white text-[12px] font-bold py-2.5 rounded-lg no-underline"
                >
                  📸 Ver en Street View
                </a>
                <a
                  href={gmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-[#1a1a2e] text-[12px] font-bold py-2.5 rounded-lg no-underline"
                >
                  🗺 Google Maps
                </a>
              </div>
            </div>
          )}

          {/* ── Características ── */}
          {prop.caracteristicas && (
            <div className="bg-white px-4 py-4 mt-2">
              <SectionTitle>Características</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {prop.caracteristicas
                  .split(/[|·,;]+/)
                  .map(t => t.trim())
                  .filter(t => t.length > 1)
                  .map((t, i) => (
                    <span key={i} className="text-[11px] bg-green-50 text-green-800 font-semibold px-3 py-1 rounded-full">
                      ✓ {t}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* ── Inmobiliaria ── */}
          {prop.inmobiliaria && (
            <div className="bg-white px-4 py-4 mt-2">
              <SectionTitle>Inmobiliaria</SectionTitle>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#1a1a2e] flex items-center justify-center text-lg flex-shrink-0">🏢</div>
                <div>
                  <div className="font-bold text-[14px] text-[#1a1a2e]">{prop.inmobiliaria}</div>
                  <div className="text-[11px] text-gray-400">San Nicolás de los Arroyos</div>
                </div>
                <button className="ml-auto bg-[#1a1a2e] text-white text-[11px] font-bold px-3 py-2 rounded-lg flex-shrink-0">
                  📞 Contactar
                </button>
              </div>
            </div>
          )}

          {/* ── Ad slot 2 ── */}
          <div className="mx-0 my-2 border border-dashed border-gray-200 rounded-lg h-[80px] flex items-center justify-center bg-gray-50">
            <span className="text-[10px] text-gray-300 uppercase tracking-widest">Publicidad</span>
          </div>

        </div>{/* /max-w */}

        {/* ── Sticky bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2.5 flex items-center gap-3 shadow-lg z-40">
          <div>
            <div className="font-black text-[18px] text-[#1a1a2e]">{fmtPrecio(prop.precio_usd)}</div>
            <div className="text-[10px] text-gray-400">{prop.tipo} · {shortAddr(prop.direccion)}</div>
          </div>
          <button
            className="flex-1 bg-[#4a7fcb] text-white font-bold text-[14px] py-3 rounded-xl"
            onClick={() => alert('Próximamente disponible en snpropiedades.com.ar')}
          >
            Consultar propiedad
          </button>
        </div>

      </div>
    </>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────────────────
function Stat({ icon, val, lbl }: { icon: string; val: string; lbl: string }) {
  return (
    <div className="flex-1 flex flex-col items-center py-3 border-r border-gray-50 last:border-0 text-center">
      <span className="text-xl mb-1">{icon}</span>
      <span className="font-bold text-[15px] text-[#1a1a2e]">{val}</span>
      <span className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">{lbl}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-bold uppercase tracking-[.6px] text-[#1a1a2e]">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}
