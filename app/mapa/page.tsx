import { getPropiedades } from '@/lib/supabase'
import MapPageClient from '@/components/MapPageClient'

export const revalidate = 300

export default async function MapaPage() {
  const propiedades = await getPropiedades({
    tipos: ['Casa', 'Dpto', 'Lote', 'Otro'],
    soloConCoords: true,
  })

  return <MapPageClient propiedades={propiedades} />
}
