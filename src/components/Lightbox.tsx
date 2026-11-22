'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const OPEN: KeyframeAnimationOptions = { duration: 300, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' }
const CLOSE: KeyframeAnimationOptions = { duration: 200, easing: 'ease-in' }

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface LightboxProps {
  src?: string
  alt: string
  anchor: RefObject<HTMLElement | null>
  onClose: () => void
}

export default function Lightbox({ src, alt, anchor, onClose }: LightboxProps) {
  const img = useRef<HTMLImageElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const started = useRef(false)
  const closing = useRef(false)

  const overThumb = (): string => {
    const from = anchor.current?.getBoundingClientRect()
    if (!from?.width || !img.current) return 'scale(0.9)'
    const to = img.current.getBoundingClientRect()
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top + from.height / 2 - (to.top + to.height / 2)
    return `translate(${dx}px, ${dy}px) scale(${Math.max(from.width / to.width, from.height / to.height)})`
  }

  const start = () => {
    if (started.current || !img.current?.naturalWidth || !backdrop.current) return
    started.current = true
    img.current.style.opacity = ''
    const timing = { ...OPEN, duration: reducedMotion() ? 0 : OPEN.duration }
    img.current.animate(
      [{ transform: overThumb(), borderRadius: '50%' }, { transform: 'none', borderRadius: '12px' }],
      timing
    )
    backdrop.current.animate([{ opacity: 0 }, { opacity: 1 }], timing)
  }

  const close = () => {
    if (closing.current || !backdrop.current || !img.current) return
    closing.current = true
    const timing: KeyframeAnimationOptions = {
      ...CLOSE,
      duration: reducedMotion() || !started.current ? 0 : CLOSE.duration,
      fill: 'forwards',
    }
    backdrop.current.animate([{ opacity: 1 }, { opacity: 0 }], timing)
    img.current
      .animate([{ transform: 'none', borderRadius: '12px' }, { transform: overThumb(), borderRadius: '50%' }], timing)
      .finished.then(() => {
        onClose()
        anchor.current?.focus()
      })
  }

  useLayoutEffect(start, [])

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={close}
      className="fixed inset-0 z-[20000] flex cursor-zoom-out items-center justify-center p-4 sm:p-10"
    >
      <div ref={backdrop} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <img
        ref={img}
        src={src}
        alt={alt}
        onLoad={start}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        style={{ opacity: 0 }}
        className="relative max-h-full max-w-full cursor-default rounded-xl object-contain shadow-2xl"
      />
      <button
        ref={closeButton}
        aria-label="Close photo"
        onClick={close}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        <X className="h-5 w-5" />
      </button>
    </div>,
    document.body
  )
}
