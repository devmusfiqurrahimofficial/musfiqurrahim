import { useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { APPS } from '../apps/registry.js'
import { selectProfile } from '../features/content/contentSelectors.js'
import { selectIsMobile } from '../features/ui/uiSlice.js'
import { selectBouncing, selectWindowEntities } from '../features/windows/windowsSelectors.js'
import { openApp } from '../features/windows/windowsThunks.js'
import { useAppDispatch, useAppSelector } from '../store/hooks.js'
import { GithubIcon, LinkedinIcon } from './BrandIcons.jsx'

const BASE = 50
const MAX = 84
const RANGE = 150

function DockItem({ item, mouseX, compact, running, bouncing, onClick }) {
  const ref = useRef(null)
  const Icon = item.icon

  let size = compact ? 36 : BASE
  if (!compact && mouseX != null && ref.current) {
    const r = ref.current.getBoundingClientRect()
    const d = Math.abs(mouseX - (r.left + r.width / 2))
    size = BASE + (MAX - BASE) * Math.max(0, Math.cos(Math.min(d / RANGE, 1) * (Math.PI / 2)))
  }

  const Tag = item.href ? 'a' : 'button'
  const linkProps = item.href ? { href: item.href, target: '_blank', rel: 'noreferrer' } : { onClick }

  return (
    <div ref={ref} className="group relative flex flex-col items-center justify-end" style={{ width: size }}>
      <span className="glass-panel pointer-events-none absolute -top-10 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-slate-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-100">
        {item.title}
      </span>
      <Tag
        {...linkProps}
        aria-label={item.title}
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center overflow-hidden rounded-[26%] bg-gradient-to-br ${item.gradient} text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6),0_6px_14px_-4px_rgba(0,8,24,0.55)] ring-1 ring-white/25 transition-[width,height] duration-150 ease-out active:brightness-90 ${
          bouncing ? 'animate-dock-bounce' : ''
        }`}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 to-transparent to-55%" />
        <Icon className="relative" style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.8} />
      </Tag>
      <span className={`mt-1 h-1 w-1 rounded-full bg-sky-950/70 transition-opacity dark:bg-white/85 ${running ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

const linksFor = (profile) => [
  { title: 'GitHub', icon: GithubIcon, gradient: 'from-slate-700 to-slate-900', href: profile.socials?.github },
  { title: 'LinkedIn', icon: LinkedinIcon, gradient: 'from-blue-500 to-blue-700', href: profile.socials?.linkedin },
  { title: 'Trash', icon: Trash2, gradient: 'from-slate-200 to-slate-400', href: undefined },
]

export default function Dock() {
  const dispatch = useAppDispatch()
  const windows = useAppSelector(selectWindowEntities)
  const bouncing = useAppSelector(selectBouncing)
  const compact = useAppSelector(selectIsMobile)
  const profile = useAppSelector(selectProfile)
  const links = useMemo(() => linksFor(profile), [profile])
  const [mouseX, setMouseX] = useState(null)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[9999] flex justify-center px-2">
      <div
        onMouseMove={(e) => setMouseX(e.clientX)}
        onMouseLeave={() => setMouseX(null)}
        className="glass pointer-events-auto relative flex max-w-full items-end gap-1.5 overflow-visible rounded-[28px] px-2.5 pt-2 pb-0.5 sm:gap-2"
      >
        {APPS.map((app) => (
          <DockItem
            key={app.id}
            item={app}
            mouseX={mouseX}
            compact={compact}
            running={windows[app.id].open}
            bouncing={bouncing === app.id}
            onClick={() => dispatch(openApp(app.id))}
          />
        ))}
        <div className="mx-1 mb-3 w-px self-stretch bg-sky-950/15 dark:bg-white/20" />
        {links.map((link) => (
          <DockItem key={link.title} item={link} mouseX={mouseX} compact={compact} />
        ))}
      </div>
    </div>
  )
}
