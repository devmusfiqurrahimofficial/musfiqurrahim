import { useRef, useState } from 'react'

export const MENU_H = 28
export const DOCK_SPACE = 92

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

function TrafficLights({ active, onClose, onMinimize, onMaximize }) {
  const lights = [
    {
      label: 'Close',
      on: 'bg-[#ff5f57] border-[#e0443e]',
      idle: 'group-hover/lights:bg-[#ff5f57] group-hover/lights:border-[#e0443e]',
      glyph: '×',
      onClick: onClose,
    },
    {
      label: 'Minimize',
      on: 'bg-[#febc2e] border-[#dea123]',
      idle: 'group-hover/lights:bg-[#febc2e] group-hover/lights:border-[#dea123]',
      glyph: '−',
      onClick: onMinimize,
    },
    {
      label: 'Zoom',
      on: 'bg-[#28c840] border-[#1aab29]',
      idle: 'group-hover/lights:bg-[#28c840] group-hover/lights:border-[#1aab29]',
      glyph: '+',
      onClick: onMaximize,
    },
  ]
  return (
    <div className="group/lights flex items-center gap-2">
      {lights.map((l) => (
        <button
          key={l.label}
          aria-label={l.label}
          onClick={l.onClick}
          className={`flex h-3 w-3 items-center justify-center rounded-full border text-[9px] font-bold leading-none text-black/0 transition-colors group-hover/lights:text-black/60 ${
            active ? l.on : `border-slate-300 bg-slate-300/80 dark:border-slate-600 dark:bg-slate-600/80 ${l.idle}`
          }`}
        >
          {l.glyph}
        </button>
      ))}
    </div>
  )
}

export default function Window({ app, win, active, isMobile, onFocus, onClose, onMinimize, onMaximize, onMove, children }) {
  const drag = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)

  const maximized = win.maximized || isMobile

  const startDrag = (e) => {
    onFocus()
    if (maximized || e.button !== 0 || e.target.closest('button')) return
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  const moveDrag = (e) => {
    if (!drag.current) return
    const x = clamp(e.clientX - drag.current.dx, 120 - win.w, window.innerWidth - 120)
    const y = clamp(e.clientY - drag.current.dy, MENU_H, window.innerHeight - 80)
    onMove(x, y)
  }

  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  const close = () => {
    setClosing(true)
    setTimeout(onClose, 170)
  }

  const frame = maximized
    ? { left: 0, top: MENU_H, width: '100%', height: `calc(100% - ${MENU_H + (isMobile ? 76 : DOCK_SPACE)}px)` }
    : { left: win.x, top: win.y, width: win.w, height: win.h }

  return (
    <section
      role="dialog"
      aria-label={app.title}
      onPointerDown={onFocus}
      style={{ ...frame, zIndex: win.z }}
      className={`glass-panel absolute flex flex-col overflow-hidden ${maximized ? 'rounded-none' : 'rounded-[22px]'} ${
        active ? '[--glass-drop:0_30px_80px_-16px_rgb(var(--glass-shadow)/0.6)]' : '[--glass-drop:0_14px_40px_-14px_rgb(var(--glass-shadow)/0.35)]'
      } ${
        dragging ? '' : 'transition-[left,top,width,height,translate,scale,opacity] duration-300 ease-out'
      } ${win.minimized ? 'pointer-events-none translate-y-[60vh] scale-[0.15] opacity-0' : ''} ${
        closing ? 'animate-window-close' : 'animate-window-open'
      }`}
    >
      <header
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(e) => !e.target.closest('button') && onMaximize()}
        className={`relative flex h-11 shrink-0 touch-none items-center border-b border-sky-900/10 bg-gradient-to-b from-white/40 to-white/0 px-4 dark:border-white/[0.07] dark:from-white/[0.06] ${
          maximized ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <TrafficLights active={active} onClose={close} onMinimize={onMinimize} onMaximize={onMaximize} />
        <h2
          className={`pointer-events-none absolute inset-x-24 truncate text-center text-[13px] font-semibold ${
            active ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {app.title}
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  )
}
