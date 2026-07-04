/**
 * Queries de Supabase para SN Propiedades.
 * Usar createClient() del server helper en Server Components,
 * y createClient() del client helper en Client Components.
 */

import { createClient as createServerClient } from '@/utils/supabase/server'
import type { Propiedad, Sesion, Evento, FiltrosProps } from './types'

// ── Propiedades ──────────────────────────────────────────────────────────

export async function getPropiedades(filtros?: Partial<FiltrosProps>): Promise<Propiedad[]> {
  const supabase = await createServerClient()

  let q = supabase
    .from('propiedades')
    .select('*')
    .eq('activo', true)
    .order('precio_usd', { ascending: true, nullsFirst: false })

  if (filtros?.soloConCoords !== false) {
    q = q.eq('tiene_coords', true)
  }
  if (filtros?.tipos?.length) {
    q = q.in('tipo', filtros.tipos)
  }
  if (filtros?.precioMax) {
    q = q.or(`precio_usd.is.null,precio_usd.lte.${filtros.precioMax}`)
  }

  const { data, error } = await q.limit(1000)
  if (error) { console.error('getPropiedades:', error.message); return [] }
  return (data as Propiedad[]) ?? []
}

export async function getPropiedad(id: string): Promise<Propiedad | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('propiedades')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single()
  if (error) return null
  return data as Propiedad
}

export async function getPropiedadBySlug(slug: string): Promise<Propiedad | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('propiedades')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single()
  if (error) return null
  return data as Propiedad
}

// ── Analytics (llamado desde el cliente via Server Actions o API routes) ──

export async function crearSesion(sesion: Sesion): Promise<string | null> {
  // Esta función se llama desde el cliente — usar createBrowserClient ahí
  // Acá queda como referencia para Server Actions futuros
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('sesiones')
    .insert(sesion)
    .select('id')
    .single()
  if (error) { console.error('crearSesion:', error.message); return null }
  return data?.id ?? null
}

export async function actualizarSesion(id: string, updates: Partial<Sesion>): Promise<void> {
  const supabase = await createServerClient()
  await supabase.from('sesiones').update(updates).eq('id', id)
}

export async function registrarEvento(evento: Evento): Promise<void> {
  const supabase = await createServerClient()
  await supabase.from('eventos').insert(evento)
}
