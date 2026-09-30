import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type PointerEvent as RPointerEvent } from 'react'
import { btnCls, inputCls } from '../components/ui'
import { useData } from '../data/DataContext'
import { asset, centroid, toPoints } from '../lib/format'
import type { Point, PolygonExport } from '../types'

/* ------------------------------------------------------------------ types */

interface Poly {
  id: string
  points: Point[]
}

interface Img {
  src: string // URL shown in the editor (may be a blob: URL for uploads)
  path: string // path written to the export, relative to /public
  width: number
  height: number
}

type Mode = 'draw' | 'edit'

type Drag =
  | { kind: 'vertex'; poly: number; idx: number }
  | { kind: 'poly'; poly: number; start: Point; orig: Point[] }
  | { kind: 'pan'; x: number; y: number; sl: number; st: number }
  | null

const DRAFT_KEY = (target: string) => `aurora-editor-draft:${target}`
const round = (p: Point): Point => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
const hue = (i: number) => (i * 67) % 360

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ page */

export default function EditorPage() {
  const { complex, buildings, apartments, savePolygons } = useData()

  // ---------- targets (what the polygons describe)
  const targets = useMemo(() => {
    const list: { key: string; label: string; image: Img; polys: Poly[]; expected: string[]; target: PolygonExport['target'] }[] = [
      {
        key: 'aerial',
        label: 'Pamja ajrore (ndërtesat)',
        image: { src: asset(complex.aerial.image), path: complex.aerial.image, width: complex.aerial.width, height: complex.aerial.height },
        polys: buildings.filter((b) => b.polygon).map((b) => ({ id: b.id, points: b.polygon! })),
        expected: buildings.map((b) => b.id),
        target: { type: 'aerial' },
      },
    ]
    for (const b of buildings)
      for (const f of b.facades)
        list.push({
          key: `facade:${f.id}`,
          label: `${b.name} · ${f.label}`,
          image: { src: asset(f.image), path: f.image, width: f.width, height: f.height },
          polys: apartments.filter((a) => a.facadeId === f.id && a.polygon).map((a) => ({ id: a.id, points: a.polygon! })),
          expected: apartments
            .filter((a) => a.buildingId === b.id)
            .sort((x, y) => y.floor - x.floor || x.number.localeCompare(y.number))
            .map((a) => a.id),
          target: { type: 'facade', buildingId: b.id, facadeId: f.id },
        })
    return list
  }, [complex, buildings, apartments])

  const [targetKey, setTargetKey] = useState('aerial')
  const target = targets.find((t) => t.key === targetKey) ?? null // null → custom image

  // ---------- editor state
  const [img, setImg] = useState<Img | null>(null)
  const [polys, setPolys] = useState<Poly[]>([])
  const [undo, setUndo] = useState<Poly[][]>([])
  const [redo, setRedo] = useState<Poly[][]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [drawing, setDrawing] = useState<Point[] | null>(null)
  const [mode, setMode] = useState<Mode>('draw')
  const [zoom, setZoom] = useState(1)
  const [cursor, setCursor] = useState<Point | null>(null)
  const [nextId, setNextId] = useState('')
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [snap, setSnap] = useState(true)
  const [draftRestored, setDraftRestored] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag>(null)
  const spaceDown = useRef(false)
  const idInputRef = useRef<HTMLInputElement>(null)
  const [scale, setScale] = useState(1) // image px per screen px

  const say = (text: string, tone: 'ok' | 'warn' = 'ok') => {
    setNotice({ text, tone })
    window.setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 3500)
  }

  // ---------- history helpers
  const commit = useCallback(
    (next: Poly[]) => {
      setUndo((u) => [...u.slice(-99), polys])
      setRedo([])
      setPolys(next)
    },
    [polys],
  )
  const doUndo = () => {
    if (!undo.length) return
    setRedo((r) => [...r, polys])
    setPolys(undo[undo.length - 1])
    setUndo((u) => u.slice(0, -1))
    setSelected(null)
  }
  const doRedo = () => {
    if (!redo.length) return
    setUndo((u) => [...u, polys])
    setPolys(redo[redo.length - 1])
    setRedo((r) => r.slice(0, -1))
  }

  // ---------- load target (from draft if one exists)
  const loadTarget = useCallback(
    (key: string, ignoreDraft = false) => {
      const t = targets.find((x) => x.key === key)
      let draft: { image: Img; polygons: Poly[] } | null = null
      if (!ignoreDraft) {
        try {
          draft = JSON.parse(localStorage.getItem(DRAFT_KEY(key)) ?? 'null')
        } catch {
          /* ignore */
        }
      }
      if (draft && draft.image.src.startsWith('blob:')) draft.image.src = asset(draft.image.path)
      setImg(draft?.image ?? t?.image ?? null)
      setPolys(draft?.polygons ?? t?.polys.map((p) => ({ ...p, points: p.points.map((q) => [...q] as Point) })) ?? [])
      setDraftRestored(!!draft)
      setUndo([])
      setRedo([])
      setSelected(null)
      setDrawing(null)
      setZoom(1)
    },
    [targets],
  )

  // load once on mount / when the target changes (not when data changes after "Ruaj në demo")
  const loadedKey = useRef<string | null>(null)
  useEffect(() => {
    if (loadedKey.current === targetKey) return
    loadedKey.current = targetKey
    loadTarget(targetKey)
  }, [targetKey, loadTarget])

  // autosave draft
  useEffect(() => {
    if (!img || loadedKey.current !== targetKey) return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY(targetKey), JSON.stringify({ image: img, polygons: polys }))
      } catch {
        /* quota */
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [img, polys, targetKey])

  // image px per screen px (for constant-size handles)
  useEffect(() => {
    const el = svgRef.current
    if (!el || !img) return
    const update = () => el.clientWidth && setScale(img.width / el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [img, zoom])

  // ---------- suggested next id
  const usedIds = new Set(polys.map((p) => p.id))
  const missing = (target?.expected ?? []).filter((id) => !usedIds.has(id))
  const suggestedId = nextId.trim() || missing[0] || `poly-${polys.length + 1}`

  // ---------- geometry helpers
  const toImage = (e: { clientX: number; clientY: number }): Point => {
    const svg = svgRef.current!
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse())
    return [Math.min(Math.max(pt.x, 0), img!.width), Math.min(Math.max(pt.y, 0), img!.height)]
  }

  const snapPoint = (p: Point, exclude?: { poly: number; idx: number }, e?: { altKey: boolean }): Point => {
    if (!snap || e?.altKey) return round(p)
    const r = 10 * scale
    let best: Point | null = null
    let bestD = r
    polys.forEach((poly, pi) =>
      poly.points.forEach((q, qi) => {
        if (exclude && exclude.poly === pi && exclude.idx === qi) return
        const d = dist(p, q)
        if (d < bestD) {
          bestD = d
          best = q
        }
      }),
    )
    return best ? [...(best as Point)] : round(p)
  }

  // ---------- drawing
  const closeDrawing = useCallback(() => {
    if (!drawing || drawing.length < 3) return
    const id = suggestedId
    const next = [...polys, { id, points: drawing }]
    commit(next)
    setDrawing(null)
    setSelected(next.length - 1)
    setNextId('')
    say(`Poligoni "${id}" u shtua`)
  }, [drawing, polys, commit, suggestedId])

  // ---------- pointer handlers
  const onPointerDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (!img) return
    const el = e.target as SVGElement
    const kind = el.dataset.kind

    // pan: space + drag, middle button
    if (spaceDown.current || e.button === 1) {
      const s = scrollRef.current!
      drag.current = { kind: 'pan', x: e.clientX, y: e.clientY, sl: s.scrollLeft, st: s.scrollTop }
      svgRef.current!.setPointerCapture(e.pointerId)
      e.preventDefault()
      return
    }
    if (e.button !== 0) return
    const p = toImage(e)

    if (mode === 'draw') {
      if (kind === 'first' && drawing && drawing.length >= 3) return closeDrawing()
      const sp = snapPoint(p, undefined, e)
      setDrawing((d) => [...(d ?? []), sp])
      return
    }

    // edit mode
    const pi = el.dataset.poly !== undefined ? Number(el.dataset.poly) : null
    const idx = el.dataset.idx !== undefined ? Number(el.dataset.idx) : null
    if (kind === 'vertex' && pi !== null && idx !== null) {
      if (e.altKey || e.shiftKey) {
        // delete vertex
        if (polys[pi].points.length <= 3) return say('Një poligon duhet të ketë të paktën 3 pika', 'warn')
        commit(polys.map((q, i) => (i === pi ? { ...q, points: q.points.filter((_, j) => j !== idx) } : q)))
        return
      }
      setUndo((u) => [...u.slice(-99), polys])
      setRedo([])
      drag.current = { kind: 'vertex', poly: pi, idx }
    } else if (kind === 'mid' && pi !== null && idx !== null) {
      // insert a vertex after idx and start dragging it
      const next = polys.map((q, i) => (i === pi ? { ...q, points: [...q.points.slice(0, idx + 1), round(p), ...q.points.slice(idx + 1)] } : q))
      commit(next)
      drag.current = { kind: 'vertex', poly: pi, idx: idx + 1 }
    } else if (kind === 'poly' && pi !== null) {
      setSelected(pi)
      setUndo((u) => [...u.slice(-99), polys])
      setRedo([])
      drag.current = { kind: 'poly', poly: pi, start: p, orig: polys[pi].points }
    } else {
      setSelected(null)
      return
    }
    svgRef.current!.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!img) return
    const d = drag.current
    if (d?.kind === 'pan') {
      const s = scrollRef.current!
      s.scrollLeft = d.sl - (e.clientX - d.x)
      s.scrollTop = d.st - (e.clientY - d.y)
      return
    }
    const p = toImage(e)
    setCursor(round(p))
    if (!d) return
    if (d.kind === 'vertex') {
      const sp = snapPoint(p, { poly: d.poly, idx: d.idx }, e)
      setPolys((ps) => ps.map((q, i) => (i === d.poly ? { ...q, points: q.points.map((pt, j) => (j === d.idx ? sp : pt)) } : q)))
    } else if (d.kind === 'poly') {
      const dx = p[0] - d.start[0]
      const dy = p[1] - d.start[1]
      setPolys((ps) => ps.map((q, i) => (i === d.poly ? { ...q, points: d.orig.map(([x, y]) => round([x + dx, y + dy])) } : q)))
    }
  }

  const onPointerUp = () => {
    drag.current = null
  }

  // ---------- keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === ' ') {
        spaceDown.current = e.type === 'keydown'
        e.preventDefault()
        return
      }
      if (e.type !== 'keydown') return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) doRedo()
        else doUndo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        doRedo()
      } else if (e.key === 'Enter') closeDrawing()
      else if (e.key === 'Escape') {
        setDrawing(null)
        setSelected(null)
      } else if (e.key === 'Backspace' && drawing) {
        e.preventDefault()
        setDrawing((d) => (d && d.length > 1 ? d.slice(0, -1) : null))
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected !== null) {
        e.preventDefault()
        commit(polys.filter((_, i) => i !== selected))
        setSelected(null)
      } else if (e.key.startsWith('Arrow') && selected !== null) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const [dx, dy] = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key] as [number, number]
        commit(polys.map((q, i) => (i === selected ? { ...q, points: q.points.map(([x, y]) => [x + dx, y + dy] as Point) } : q)))
      } else if (e.key === 'd' || e.key === 'D') setMode('draw')
      else if (e.key === 'e' || e.key === 'E' || e.key === 'v' || e.key === 'V') setMode('edit')
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(8, z * 1.25))
      else if (e.key === '-') setZoom((z) => Math.max(0.25, z / 1.25))
      else if (e.key === '0') setZoom(1)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  })

  // ctrl/cmd + wheel zoom (keeps the point under the cursor fixed)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const fx = (el.scrollLeft + e.clientX - r.left) / el.scrollWidth
      const fy = (el.scrollTop + e.clientY - r.top) / el.scrollHeight
      setZoom((z) => {
        const nz = Math.min(8, Math.max(0.25, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
        requestAnimationFrame(() => {
          el.scrollLeft = fx * el.scrollWidth - (e.clientX - r.left)
          el.scrollTop = fy * el.scrollHeight - (e.clientY - r.top)
        })
        return nz
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ---------- image upload
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return say('Ky skedar nuk është imazh', 'warn')
    const src = URL.createObjectURL(file)
    const probe = new Image()
    probe.onload = () => {
      const width = probe.naturalWidth
      const height = probe.naturalHeight
      const path = img?.path && target ? img.path : `images/${file.name}`
      if (img && polys.length && (img.width !== width || img.height !== height)) {
        const sx = width / img.width
        const sy = height / img.height
        commit(polys.map((p) => ({ ...p, points: p.points.map(([x, y]) => round([x * sx, y * sy])) })))
        say(`Imazhi ka madhësi tjetër (${width}×${height}); poligonet u shkallëzuan proporcionalisht.`, 'warn')
      } else say(`U ngarkua ${file.name} (${width}×${height})`)
      setImg({ src, path, width, height })
      setZoom(1)
    }
    probe.src = src
  }

  // ---------- export / import / save
  const exportData = (): PolygonExport | null =>
    img && {
      version: 1,
      target: target?.target ?? { type: 'custom' },
      image: img.path,
      width: img.width,
      height: img.height,
      polygons: polys.map((p) => ({ id: p.id, points: p.points })),
    }

  const dupIds = polys.map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i)
  const unknownIds = target ? polys.map((p) => p.id).filter((id) => !target.expected.includes(id)) : []

  const importJson = (text: string) => {
    try {
      const data = JSON.parse(text) as Partial<PolygonExport> | Poly[]
      const list = Array.isArray(data) ? data : data.polygons
      if (!Array.isArray(list)) throw new Error('mungon "polygons"')
      const clean = list.map((p) => ({ id: String(p.id), points: p.points.map((q) => [Number(q[0]), Number(q[1])] as Point) }))
      if (!Array.isArray(data) && data.width && data.height && data.image) {
        const t = data.target
        const key = t?.type === 'aerial' ? 'aerial' : t?.type === 'facade' ? `facade:${t.facadeId}` : 'custom'
        if (key !== targetKey) {
          loadedKey.current = key
          setTargetKey(key)
        }
        setImg({ src: asset(data.image), path: data.image, width: data.width, height: data.height })
      }
      commit(clean)
      setShowImport(false)
      setImportText('')
      say(`U importuan ${clean.length} poligone`)
    } catch (err) {
      say(`JSON i pavlefshëm: ${(err as Error).message}`, 'warn')
    }
  }

  const saveToDemo = async () => {
    const data = exportData()
    if (!data || !target) return
    if (dupIds.length) return say(`ID të dyfishta: ${[...new Set(dupIds)].join(', ')}`, 'warn')
    if (img!.src.startsWith('blob:'))
      say(`Kujdes: kopjoje imazhin te public/${img!.path} që faqja ta shfaqë.`, 'warn')
    await savePolygons(data)
    if (!img!.src.startsWith('blob:')) say('U ruajt! Hape ballinën/ndërtesën për ta parë.')
  }

  const fileName = `polygons-${targetKey.replace(/[^a-z0-9-]/gi, '-')}.json`
  const selPoly = selected !== null ? polys[selected] : null
  const handleR = 6 * scale
  const stroke = 2 * scale

  /* ---------------------------------------------------------------- render */
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:flex-row">
      {/* ---------------- canvas */}
      <div className="relative flex min-h-[55vh] flex-1 flex-col bg-navy-950 lg:min-h-0">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-navy-900 px-3 py-2 text-sm text-white">
          <div className="flex rounded-lg bg-white/10 p-0.5">
            {(['draw', 'edit'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  if (m === 'edit') setDrawing(null)
                }}
                className={`rounded-md px-3 py-1.5 font-medium transition ${mode === m ? 'bg-gold-500 text-navy-950' : 'text-navy-100 hover:bg-white/10'}`}
              >
                {m === 'draw' ? '✎ Vizato (D)' : '⤧ Ndrysho (E)'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <ToolBtn onClick={doUndo} disabled={!undo.length} title="Zhbëj (Ctrl+Z)">
              ↶
            </ToolBtn>
            <ToolBtn onClick={doRedo} disabled={!redo.length} title="Ribëj (Ctrl+Shift+Z)">
              ↷
            </ToolBtn>
          </div>
          <div className="flex items-center gap-1">
            <ToolBtn onClick={() => setZoom((z) => Math.max(0.25, z / 1.25))} title="Zvogëlo (−)">
              −
            </ToolBtn>
            <button onClick={() => setZoom(1)} className="w-14 rounded-md py-1.5 text-center tabular-nums hover:bg-white/10" title="Përshtat (0)">
              {Math.round(zoom * 100)}%
            </button>
            <ToolBtn onClick={() => setZoom((z) => Math.min(8, z * 1.25))} title="Zmadho (+)">
              +
            </ToolBtn>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-navy-200">
            <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} className="accent-gold-500" />
            Ngjit në pika
          </label>
          {drawing && (
            <div className="flex items-center gap-2">
              <span className="text-navy-300">{drawing.length} pika</span>
              <button onClick={closeDrawing} disabled={drawing.length < 3} className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium disabled:opacity-40">
                Mbyll ✓
              </button>
              <button onClick={() => setDrawing(null)} className="rounded-md px-2 py-1.5 text-navy-200 hover:bg-white/10">
                Anulo
              </button>
            </div>
          )}
          <span className="ml-auto font-mono text-xs text-navy-300 tabular-nums">
            {img ? `${img.width}×${img.height}` : ''} {cursor ? `· x ${Math.round(cursor[0])}, y ${Math.round(cursor[1])}` : ''}
          </span>
        </div>

        {/* canvas */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) loadFile(f)
          }}
        >
          {img ? (
            <div className="p-4" style={{ width: `${Math.max(zoom, 1) * 100}%` }}>
              <div className="relative mx-auto" style={{ maxWidth: `calc((100dvh - 12rem) * ${(img.width / img.height) * zoom})` }}>
                <img src={img.src} alt="" draggable={false} className="block h-auto w-full select-none" />
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${img.width} ${img.height}`}
                  preserveAspectRatio="none"
                  className={`absolute inset-0 size-full touch-none ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onPointerLeave={() => setCursor(null)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {polys.map((p, i) => {
                    const sel = i === selected
                    const [cx, cy] = centroid(p.points)
                    return (
                      <g key={i}>
                        <polygon
                          points={toPoints(p.points)}
                          data-kind="poly"
                          data-poly={i}
                          fill={sel ? 'rgb(200 168 103 / 0.45)' : `hsl(${hue(i)} 80% 55% / 0.3)`}
                          stroke={sel ? '#c8a867' : `hsl(${hue(i)} 80% 45%)`}
                          strokeWidth={sel ? stroke * 1.5 : stroke}
                          className={mode === 'edit' ? 'cursor-move' : ''}
                          style={{ pointerEvents: mode === 'edit' ? 'auto' : 'none' }}
                        />
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={13 * scale}
                          fontWeight={700}
                          fill="#fff"
                          stroke="#0f1b2d"
                          strokeWidth={3 * scale}
                          paintOrder="stroke"
                          pointerEvents="none"
                        >
                          {p.id}
                        </text>
                      </g>
                    )
                  })}

                  {/* handles of selected polygon */}
                  {mode === 'edit' && selPoly && (
                    <g>
                      {selPoly.points.map((pt, j) => {
                        const nx = selPoly.points[(j + 1) % selPoly.points.length]
                        return (
                          <circle
                            key={`m${j}`}
                            cx={(pt[0] + nx[0]) / 2}
                            cy={(pt[1] + nx[1]) / 2}
                            r={handleR * 0.7}
                            data-kind="mid"
                            data-poly={selected!}
                            data-idx={j}
                            fill="#fff"
                            fillOpacity={0.6}
                            stroke="#c8a867"
                            strokeWidth={stroke * 0.75}
                            className="cursor-copy"
                          />
                        )
                      })}
                      {selPoly.points.map((pt, j) => (
                        <circle
                          key={`v${j}`}
                          cx={pt[0]}
                          cy={pt[1]}
                          r={handleR}
                          data-kind="vertex"
                          data-poly={selected!}
                          data-idx={j}
                          fill="#c8a867"
                          stroke="#fff"
                          strokeWidth={stroke}
                          className="cursor-grab"
                        />
                      ))}
                    </g>
                  )}

                  {/* polygon being drawn */}
                  {drawing && (
                    <g pointerEvents="none">
                      <polyline
                        points={toPoints(cursor && mode === 'draw' ? [...drawing, cursor] : drawing)}
                        fill="rgb(34 197 94 / 0.2)"
                        stroke="#22c55e"
                        strokeWidth={stroke}
                        strokeDasharray={`${6 * scale} ${4 * scale}`}
                      />
                      {drawing.map((pt, j) => (
                        <circle
                          key={j}
                          cx={pt[0]}
                          cy={pt[1]}
                          r={j === 0 ? handleR * 1.4 : handleR * 0.8}
                          fill={j === 0 ? '#22c55e' : '#fff'}
                          stroke="#15803d"
                          strokeWidth={stroke}
                          data-kind={j === 0 ? 'first' : undefined}
                          pointerEvents={j === 0 ? 'auto' : 'none'}
                          className={j === 0 ? 'cursor-pointer' : ''}
                        />
                      ))}
                    </g>
                  )}
                </svg>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-navy-300">
              <div>
                <p className="mb-3">Ngarko një imazh për të filluar (ose tërhiqe këtu).</p>
                <label className={`${btnCls.gold} cursor-pointer`}>
                  Ngarko imazh
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
                </label>
              </div>
            </div>
          )}
        </div>

        {notice && (
          <div
            className={`pointer-events-none absolute bottom-4 left-1/2 z-10 max-w-[90%] -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-medium shadow-lg ${notice.tone === 'ok' ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-navy-950'}`}
          >
            {notice.text}
          </div>
        )}
      </div>

      {/* ---------------- sidebar */}
      <aside className="w-full shrink-0 space-y-5 overflow-y-auto border-l border-navy-100 bg-navy-50/60 p-4 lg:w-[360px]">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-500">1 · Imazhi</h2>
          <select
            className={inputCls}
            value={target ? targetKey : 'custom'}
            onChange={(e) => {
              loadedKey.current = null
              setTargetKey(e.target.value)
            }}
          >
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
            <option value="custom">Imazh tjetër (i lirë)</option>
          </select>
          <div className="mt-2 flex gap-2">
            <label className={`${btnCls.ghost} flex-1 cursor-pointer`}>
              {target ? 'Zëvendëso imazhin…' : 'Ngarko imazh…'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
            </label>
            <button
              className={btnCls.ghost}
              title="Hidh ndryshimet e padeponuara dhe ngarko nga të dhënat e aplikacionit"
              onClick={() => {
                localStorage.removeItem(DRAFT_KEY(targetKey))
                loadTarget(targetKey, true)
                say('U ringarkua nga të dhënat')
              }}
            >
              Ringarko
            </button>
          </div>
          {img && (
            <label className="mt-2 block text-xs text-navy-500">
              Shtegu në <code>public/</code> (ruhet në JSON)
              <input className={`${inputCls} mt-1 font-mono text-xs`} value={img.path} onChange={(e) => setImg({ ...img, path: e.target.value })} />
            </label>
          )}
          {draftRestored && (
            <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">
              U rikthye drafti yt i fundit për këtë imazh. Kliko “Ringarko” për të filluar nga të dhënat e aplikacionit.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-500">2 · Vizato</h2>
          <label className="block text-xs text-navy-500">
            ID për poligonin e ardhshëm
            <input
              className={`${inputCls} mt-1 font-mono`}
              placeholder={suggestedId}
              value={nextId}
              onChange={(e) => setNextId(e.target.value)}
              list="expected-ids"
            />
            <datalist id="expected-ids">
              {missing.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
          </label>
          {target && missing.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs text-navy-500">Pa poligon ({missing.length}) – kliko për ta vizatuar:</div>
              <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                {missing.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setNextId(id)
                      setMode('draw')
                    }}
                    className={`rounded-md px-2 py-0.5 font-mono text-xs ring-1 transition ${suggestedId === id ? 'bg-gold-500 text-navy-950 ring-gold-500' : 'bg-white text-navy-700 ring-navy-200 hover:bg-navy-100'}`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-navy-500">
            <span>3 · Poligonet ({polys.length})</span>
            {polys.length > 0 && (
              <button
                className="normal-case tracking-normal text-red-600 hover:underline"
                onClick={() => {
                  if (!confirm('Të fshihen të gjitha poligonet?')) return
                  commit([])
                  setSelected(null)
                }}
              >
                Fshi të gjitha
              </button>
            )}
          </h2>
          {dupIds.length > 0 && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">ID të dyfishta: {[...new Set(dupIds)].join(', ')}</p>}
          {unknownIds.length > 0 && (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Këto ID nuk ekzistojnë në të dhëna dhe do të injorohen në faqe: {unknownIds.join(', ')}
            </p>
          )}
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {polys.map((p, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 transition ${i === selected ? 'bg-gold-300/30 ring-gold-500' : 'bg-white ring-navy-100'}`}
                onClick={() => {
                  setSelected(i)
                  setMode('edit')
                }}
              >
                <span className="size-3 shrink-0 rounded-sm" style={{ background: `hsl(${hue(i)} 80% 55%)` }} />
                <input
                  ref={i === selected ? idInputRef : undefined}
                  className="min-w-0 flex-1 rounded border-0 bg-transparent px-1 py-0.5 font-mono text-sm focus:bg-white focus:ring-1 focus:ring-gold-500 focus:outline-none"
                  value={p.id}
                  onFocus={() => setSelected(i)}
                  onChange={(e) => setPolys((ps) => ps.map((q, j) => (j === i ? { ...q, id: e.target.value } : q)))}
                />
                <span className="text-xs text-navy-400">{p.points.length} pk</span>
                <button
                  className="rounded px-1.5 text-navy-400 hover:bg-red-50 hover:text-red-600"
                  title="Fshi"
                  onClick={(e) => {
                    e.stopPropagation()
                    commit(polys.filter((_, j) => j !== i))
                    setSelected(null)
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-500">4 · Eksporto</h2>
          <div className="grid grid-cols-2 gap-2">
            <button className={btnCls.primary} disabled={!img} onClick={() => download(fileName, JSON.stringify(exportData(), null, 2))}>
              Shkarko JSON
            </button>
            <button
              className={btnCls.ghost}
              disabled={!img}
              onClick={async () => {
                await navigator.clipboard.writeText(JSON.stringify(exportData(), null, 2))
                say('JSON u kopjua')
              }}
            >
              Kopjo JSON
            </button>
            <button className={btnCls.ghost} onClick={() => setShowImport((s) => !s)}>
              Importo JSON
            </button>
            <button className={btnCls.gold} disabled={!img || !target} onClick={saveToDemo} title="Ruaj në localStorage dhe shfaq menjëherë në faqe">
              Ruaj në demo
            </button>
          </div>
          {showImport && (
            <div className="mt-2 space-y-2">
              <textarea
                className={`${inputCls} h-32 font-mono text-xs`}
                placeholder='{"polygons":[{"id":"A","points":[[10,10],[100,10],[100,80]]}]}'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex gap-2">
                <button className={btnCls.primary} onClick={() => importJson(importText)}>
                  Importo
                </button>
                <label className={`${btnCls.ghost} cursor-pointer`}>
                  Nga skedari…
                  <input type="file" accept=".json,application/json" className="hidden" onChange={async (e) => e.target.files?.[0] && importJson(await e.target.files[0].text())} />
                </label>
              </div>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-navy-500">
            Për ta bërë të përhershëm: ruaje JSON-in dhe ekzekuto <code className="rounded bg-white px-1">npm run apply-polygons -- {fileName}</code>
          </p>
        </section>

        <details className="rounded-xl bg-white p-3 text-xs text-navy-600 ring-1 ring-navy-100">
          <summary className="cursor-pointer font-semibold text-navy-800">Shkurtesat</summary>
          <ul className="mt-2 space-y-1">
            <li><b>D</b> vizato · <b>E</b> ndrysho</li>
            <li><b>Klik</b> shto pikë · <b>Enter</b> ose klik në pikën e parë = mbyll</li>
            <li><b>Backspace</b> hiq pikën e fundit · <b>Esc</b> anulo</li>
            <li>Ndrysho: tërhiq pikat / trupin; tërhiq rrethin e vogël për të shtuar pikë</li>
            <li><b>Shift/Alt + klik</b> në pikë = fshi pikën</li>
            <li><b>Delete</b> fshi poligonin · <b>Shigjetat</b> lëviz 1px (Shift = 10px)</li>
            <li><b>Ctrl+Z / Ctrl+Shift+Z</b> zhbëj / ribëj</li>
            <li><b>Ctrl + rrota</b> zoom · <b>Hapësirë + tërhiq</b> lëviz pamjen</li>
            <li><b>Alt</b> gjatë vizatimit = pa ngjitje</li>
          </ul>
        </details>
      </aside>
    </div>
  )
}

function ToolBtn({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="grid size-8 place-items-center rounded-md text-base hover:bg-white/10 disabled:opacity-30">
      {children}
    </button>
  )
}
