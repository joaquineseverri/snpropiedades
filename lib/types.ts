export type TipoProp = 'Casa' | 'Dpto' | 'Lote' | 'Otro'

export interface Propiedad {
  id: string
  direccion: string
  zona: string | null
  tipo: TipoProp
  precio_usd: number | null
  caracteristicas: string | null
  descripcion: string | null
  inmobiliaria: string | null
  url_original: string | null   // no mostrar en UI
  fecha_publicacion: string | null
  lat: number | null
  lng: number | null
  tiene_coords: boolean
  activo: boolean
  slug: string | null
  created_at: string
  updated_at: string
}

export interface Sesion {
  id?: string
  prop_id?: string
  session_key: string
  device: string
  screen_w?: number
  referrer?: string
  tiempo_total?: number
  scroll_max?: number
  reboton?: boolean
  sv_click?: boolean
  sv_duracion?: number
  calc_abrio?: boolean
  galeria_fotos?: number
}

export interface Evento {
  sesion_id?: string
  prop_id?: string
  tipo: string
  datos?: Record<string, unknown>
  ms_desde_inicio?: number
}

export interface FiltrosProps {
  tipos: TipoProp[]
  precioMax: number
  soloConCoords: boolean
}
