'use client'

/**
 * Analytics — registra sesión y eventos en Supabase desde el browser.
 * Montar en cada página de propiedad: <Analytics propId={prop.id} />
 */

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Props {
  propId: string
}

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export default function Analytics({ propId }: Props) {
  const supabase     = createClient()
  const sesionDbId   = useRef<string | null>(null)
  const sessionKey   = useRef(genId())
  const startTime    = useRef(Date.now())
  const maxScroll    = useRef(0)
  const bounced      = useRef(true)
  const svClickTime  = useRef<number | null>(null)
  const milestones   = useRef(new Set<number>())

  const track = useCallback(async (tipo: string, datos?: Record<string, unknown>) => {
    const ms = Date.now() - startTime.current
    if (ms > 30000) bounced.current = false
    await supabase.from('eventos').insert({
      sesion_id:      sesionDbId.current,
      prop_id:        propId,
      tipo,
      datos,
      ms_desde_inicio: ms,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propId])

  // Crear sesión al montar
  useEffect(() => {
    const device  = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    const screenW = window.innerWidth

    supabase.from('sesiones').insert({
      prop_id:     propId,
      session_key: sessionKey.current,
      device,
      screen_w:    screenW,
      referrer:    document.referrer || null,
    }).select('id').single().then(({ data }) => {
      if (data?.id) {
        sesionDbId.current = data.id
        track('page_view', { device, screen_w: screenW, referrer: document.referrer })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propId])

  // Scroll depth
  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight
      if (total <= 0) return
      const pct = Math.round((window.scrollY / total) * 100)
      if (pct > maxScroll.current) maxScroll.current = pct
      ;[25, 50, 75, 90, 100].forEach(m => {
        if (pct >= m && !milestones.current.has(m)) {
          milestones.current.add(m)
          track('scroll_milestone', { pct: m })
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [track])

  // Street View: detectar retorno
  useEffect(() => {
    const onFocus = () => {
      if (svClickTime.current) {
        const secs = Math.round((Date.now() - svClickTime.current) / 1000)
        track('streetview_return', { duration_sec: secs })
        if (sesionDbId.current) {
          supabase.from('sesiones').update({ sv_duracion: secs }).eq('id', sesionDbId.current)
        }
        svClickTime.current = null
      }
    }
    const onVisibility = () => { if (document.visibilityState === 'visible') onFocus() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [track])

  // Al cerrar/salir: actualizar sesión
  useEffect(() => {
    const onUnload = () => {
      const tiempo = Math.round((Date.now() - startTime.current) / 1000)
      if (!sesionDbId.current) return
      // sendBeacon: funciona aunque se cierre la pestaña
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sesiones?id=eq.${sesionDbId.current}`
      const headers = {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!}`,
        'Prefer': 'return=minimal',
      }
      const body = JSON.stringify({
        tiempo_total: tiempo,
        scroll_max:   maxScroll.current,
        reboton:      bounced.current,
      })
      // Adjuntar headers al blob no es posible con sendBeacon — usar fetch con keepalive
      fetch(url, { method: 'PATCH', headers, body, keepalive: true })
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  // Exponer funciones globales para otros componentes
  useEffect(() => {
    const w = window as any
    w.snpTrack = track
    w.snpStreetViewClick = () => {
      svClickTime.current = Date.now()
      track('streetview_click')
      if (sesionDbId.current) {
        supabase.from('sesiones').update({ sv_click: true }).eq('id', sesionDbId.current)
      }
    }
    w.snpCalcOpen = () => {
      track('calc_open')
      if (sesionDbId.current) {
        supabase.from('sesiones').update({ calc_abrio: true }).eq('id', sesionDbId.current)
      }
    }
    w.snpGalleryPhoto = (idx: number) => track('gallery_photo', { idx })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track])

  return null
}
