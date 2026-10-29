import { useEffect, useRef, useState } from 'react'
import { arrayMove } from '../features/api/collectionEndpoints.js'

const EDGE = 48 // px from the scroll container's edge where dragging starts to scroll it

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

function scrollParent(el) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node
  }
  return document.scrollingElement
}

// Drag-to-reorder for a vertical list. Pointer events, so touch works too. Spread rowProps(id) on
// each row and handleProps(id) on its grip. While dragging, the row follows the pointer, the rows it
// passes slide out of its way, and `slot` is where it will land (in the rows' offsetParent). On drop,
// onReorder gets every id in the new order. Escape cancels; the arrow keys on a grip move its row.
export function useDragSort(ids, onReorder) {
  const rows = useRef(new Map())
  const session = useRef(null) // pointer and scroll bookkeeping that doesn't need a render
  const [drag, setDrag] = useState(null) // { id, from, to, dy, tops, heights }

  const tick = () => {
    const s = session.current
    if (!s) return
    const { scroller, tops, heights, from } = s
    const box = scroller === document.scrollingElement ? { top: 0, bottom: innerHeight } : scroller.getBoundingClientRect()
    if (s.y < box.top + EDGE) scroller.scrollTop -= Math.ceil((box.top + EDGE - s.y) / 4)
    else if (s.y > box.bottom - EDGE) scroller.scrollTop += Math.ceil((s.y - box.bottom + EDGE) / 4)

    // offsetTop ignores both transforms and scrolling, so add the scroll back in
    const last = tops.length - 1
    const dy = clamp(s.y - s.startY + scroller.scrollTop - s.startScroll, tops[0] - tops[from], tops[last] + heights[last] - tops[from] - heights[from])
    const center = tops[from] + heights[from] / 2 + dy
    let to = from
    while (to < last && center > tops[to + 1] + heights[to + 1] / 2) to++
    while (to > 0 && center < tops[to - 1] + heights[to - 1] / 2) to--
    s.to = to
    setDrag((d) => (d && d.dy === dy && d.to === to ? d : { ...d, dy, to }))
    s.frame = requestAnimationFrame(tick)
  }

  const finish = (commit) => {
    const s = session.current
    if (!s) return
    cancelAnimationFrame(s.frame)
    session.current = null
    setDrag(null)
    if (commit && s.to !== s.from) onReorder(arrayMove(s.ids, s.from, s.to))
  }

  const dragging = drag !== null
  useEffect(() => {
    if (!dragging) return
    const onKey = (e) => e.key === 'Escape' && finish(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [dragging])

  useEffect(() => () => cancelAnimationFrame(session.current?.frame), [])

  const handleProps = (id) => ({
    onPointerDown(e) {
      if (e.button !== 0 || session.current) return
      const els = ids.map((i) => rows.current.get(i))
      if (els.some((el) => !el)) return
      e.currentTarget.setPointerCapture(e.pointerId)
      const from = ids.indexOf(id)
      const tops = els.map((el) => el.offsetTop)
      const heights = els.map((el) => el.offsetHeight)
      const scroller = scrollParent(els[from])
      session.current = { ids, from, to: from, tops, heights, scroller, startScroll: scroller.scrollTop, startY: e.clientY, y: e.clientY }
      setDrag({ id, from, to: from, dy: 0, tops, heights })
      session.current.frame = requestAnimationFrame(tick)
    },
    onPointerMove(e) {
      if (session.current) session.current.y = e.clientY
    },
    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),
    onKeyDown(e) {
      const delta = { ArrowUp: -1, ArrowDown: 1 }[e.key]
      const from = ids.indexOf(id)
      if (!delta || session.current || !ids[from + delta]) return
      e.preventDefault()
      const grip = e.currentTarget
      onReorder(arrayMove(ids, from, from + delta))
      // the row moves in the DOM, which can drop focus
      requestAnimationFrame(() => grip.focus())
    },
  })

  const rowProps = (id) => {
    const ref = (el) => {
      if (el) rows.current.set(id, el)
      else rows.current.delete(id)
    }
    if (!drag) return { ref }
    const { from, to, dy, heights } = drag
    const i = ids.indexOf(id)
    const shift = i === from ? dy : from < i && i <= to ? -heights[from] : to <= i && i < from ? heights[from] : 0
    return { ref, style: shift ? { transform: `translateY(${shift}px)` } : undefined }
  }

  const slot = drag && {
    top: drag.to > drag.from ? drag.tops[drag.to] + drag.heights[drag.to] - drag.heights[drag.from] : drag.tops[drag.to],
    height: drag.heights[drag.from],
  }

  return { draggingId: drag?.id ?? null, slot, rowProps, handleProps }
}
