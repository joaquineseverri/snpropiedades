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
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f5f5f0', minHeight: '100vh', color: '#1a1a1a' }}>

      {/* ── Header ── */}
      <header style={{
        background: '#1a1a2e', color: '#fff',
        padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 2px 8px rgba(0,0,0,.3)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '.3px' }}>
          SN <span style={{ color: '#7eb8f7' }}>Propiedades</span>
        </div>
        <a
          href="/mapa"
          style={{
            background: '#4a7fcb', color: '#fff', textDecoration: 'none',
            fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          🗺 Ver mapa
        </a>
      </header>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #1e2a4a 60%, #2a3050 100%)',
        padding: '40px 20px 48px', textAlign: 'center',
      }}>
        <p style={{ color: '#7eb8f7', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
          Portal inmobiliario local
        </p>
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>
          Encontrá tu propiedad<br />
          <span style={{ color: '#7eb8f7' }}>en San Nicolás</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, marginBottom: 28 }}>
          Las mejores ofertas del centro, actualizadas diariamente
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '24px 40px' }}>
          {[
            { val: propiedades.length, lbl: 'propiedades' },
            { val: casas,  lbl: 'casas'          },
            { val: dptos,  lbl: 'departamentos'  },
            { val: lotes,  lbl: 'lotes'           },
            { val: inmobs, lbl: 'inmobiliarias'  },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 26, fontWeight: 900, lineHeight: 1 }}>
                {val.toLocaleString('es-AR')}
              </div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.6px', marginTop: 4 }}>
                {lbl}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid con filtros ── */}
      <PropertyGrid propiedades={propiedades} />

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #e5e5e5', padding: '24px 20px', textAlign: 'center', background: '#fff' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>
          SN <span style={{ color: '#4a7fcb' }}>Propiedades</span>
        </div>
        <div style={{ fontSize: 11, color: '#aaa' }}>
          San Nicolás de los Arroyos · Buenos Aires · Argentina
        </div>
      </footer>

      {/* ── Botón flotante mapa ── */}
      <a
        href="/mapa"
        style={{
          position: 'fixed', bottom: 20, right: 16, zIndex: 100,
          background: '#1a1a2e', color: '#fff', textDecoration: 'none',
          fontWeight: 700, fontSize: 13, padding: '12px 20px', borderRadius: 30,
          boxShadow: '0 4px 20px rgba(0,0,0,.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        🗺 Ver en el mapa
      </a>
    </div>
  )
}
