import { useEffect, useRef, useState } from 'react'
import 'pannellum/build/pannellum.css'
import 'pannellum/build/pannellum.js'
import { asset } from '../lib/format'
import type { PanoramaScene } from '../types'

interface Props {
  scenes: PanoramaScene[]
}

/** 360° virtual tour: Pannellum multi-scene viewer + floor hotspots + thumbnail strip. */
export default function PanoramaViewer({ scenes }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const viewer = useRef<PannellumViewer | null>(null)
  const [current, setCurrent] = useState(scenes[0]?.id)
  const [loading, setLoading] = useState(true)
  const sceneKey = scenes.map((s) => s.id).join('|')

  useEffect(() => {
    if (!el.current || !scenes.length) return
    const ids = new Set(scenes.map((s) => s.id))
    const titles = Object.fromEntries(scenes.map((s) => [s.id, s.title]))
    const config = {
      default: {
        firstScene: scenes[0].id,
        sceneFadeDuration: 900,
        autoLoad: true,
        showControls: true,
        showFullscreenCtrl: true,
        compass: false,
        hfov: 105,
        minHfov: 50,
        maxHfov: 120,
        autoRotate: -1.5,
        autoRotateInactivityDelay: 6000,
        strings: {
          loadingLabel: 'Duke u ngarkuar…',
          loadButtonLabel: 'Kliko për të<br>ngarkuar panoramën',
          bylineLabel: '',
        },
      },
      scenes: Object.fromEntries(
        scenes.map((s) => [
          s.id,
          {
            title: s.title,
            type: 'equirectangular',
            panorama: asset(s.image),
            yaw: s.initialYaw ?? 0,
            hotSpots: s.hotSpots
              .filter((h) => ids.has(h.target))
              .map((h) => ({
                pitch: h.pitch,
                yaw: h.yaw,
                type: 'scene',
                sceneId: h.target,
                cssClass: 'floor-hotspot',
                createTooltipFunc: (div: HTMLElement) => {
                  const span = document.createElement('span')
                  span.textContent = `→ ${titles[h.target]}`
                  div.appendChild(span)
                },
              })),
          },
        ]),
      ),
    }
    const v = window.pannellum.viewer(el.current, config)
    viewer.current = v
    setCurrent(scenes[0].id)
    setLoading(true)
    v.on('scenechange', (id) => {
      setCurrent(id as string)
      setLoading(true)
    })
    v.on('load', () => setLoading(false))
    return () => {
      v.destroy()
      viewer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey])

  const go = (id: string) => {
    if (id !== current) viewer.current?.loadScene(id)
  }

  const title = scenes.find((s) => s.id === current)?.title

  return (
    <div className="overflow-hidden rounded-2xl bg-navy-950 shadow-xl shadow-navy-900/20">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
        <div ref={el} className="absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-navy-950/70 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
          {title}
        </div>
        {loading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-navy-950/70 px-3 py-1 text-xs text-navy-100">Duke u ngarkuar…</span>
          </div>
        )}
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto p-3">
        {scenes.map((s) => (
          <button
            key={s.id}
            onClick={() => go(s.id)}
            className={`group relative h-20 w-32 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-24 sm:w-40 ${s.id === current ? 'ring-gold-400' : 'ring-transparent opacity-70 hover:opacity-100'}`}
          >
            <img src={asset(s.image)} alt="" className="size-full object-cover transition group-hover:scale-110" loading="lazy" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 to-transparent px-2 pb-1 pt-4 text-left text-xs font-medium text-white">
              {s.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
