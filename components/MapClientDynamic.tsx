'use client'

/**
 * Wrapper cliente para MapClient con ssr:false.
 * Next.js 16 no permite dynamic() con ssr:false en Server Components,
 * así que lo movemos a este Client Component intermedio.
 */

import dynamic from 'next/dynamic'
import type { Propiedad } from '@/lib/types'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', minHeight: '200px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a2e', color: '#7eb8f7', fontSize: 14,
    }}>
      Cargando mapa…
    </div>
  ),
})

interface Props {
  propiedades: Propiedad[]
  onSelectProp?: (prop: Propiedad) => void
}

export default function MapClientDynamic({ propiedades, onSelectProp }: Props) {
  return <MapClient propiedades={propiedades} onSelectProp={onSelectProp} />
}
