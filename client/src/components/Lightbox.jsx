import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const OPEN = { duration: 300, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' }
const CLOSE = { duration: 200, easing: 'ease-in' }

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Full-screen photo viewer that grows out of `anchor` (a ref to the thumbnail) and shrinks back into it.
// Portalled to <body>, since windows are transformed and blurred, which would trap position: fixed.
export default function Lightbox({ src, alt, anchor, onClose }) {
  const img = useRef(null)
  const backdrop = useRef(null)
  const closeButton = useRef(null)
  const started = useRef(false)
  const closing = useRef(false)

  // the transform that lays the full-size photo over the thumbnail (a plain shrink if it's gone)
  const overThumb = () => {
    const from = anchor.current?.getBoundingClientRect()
    if (!from?.width) return 'scale(0.9)'
    const to = img.current.getBoundingClientRect()
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top + from.height / 2 - (to.top + to.height / 2)
    return `translate(${dx}px, ${dy}px) scale(${Math.max(from.width / to.width, from.height / to.height)})`
  }

  // needs the photo's size, so it waits for the image (usually already cached by the thumbnail)
  const start = () => {
    if (started.current || !img.current?.naturalWidth) return
    started.current = true
    img.current.style.opacity = ''
    const timing = { ...OPEN, duration: reducedMotion() ? 0 : OPEN.duration }
    img.current.animate([{ transform: overThumb(), borderRadius: '50%' }, { transform: 'none', borderRadius: '12px' }], timing)
    backdrop.current.animate([{ opacity: 0 }, { opacity: 1 }], timing)
  }

  const close = () => {
    if (closing.current) return
    closing.current = true
    const timing = { ...CLOSE, duration: reducedMotion() || !started.current ? 0 : CLOSE.duration, fill: 'forwards' }
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
    const onKey = (e) => e.key === 'Escape' && close()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={alt} onClick={close} className="fixed inset-0 z-[20000] flex cursor-zoom-out items-center justify-center p-4 sm:p-10">
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
