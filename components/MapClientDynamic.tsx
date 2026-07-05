'use client'

import dynamic from 'next/dynamic'
import type { Propiedad } from '@/lib/types'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', minHeight: '200px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a2e', color: '#7eb8f7', fontSize: 14,
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      Cargando mapa…
    </div>
  ),
})

interface Props {
  propiedades: Propiedad[]
  showEscuelas?: boolean
  showHospitales?: boolean
  onSelectProp?: (prop: Propiedad) => void
  onHoverProp?:  (prop: Propiedad) => void
  onUnhoverProp?: () => void
}

export default function MapClientDynamic(props: Props) {
  return <MapClient {...props} />
}
