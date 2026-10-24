import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Cpu, FolderOpen, Mail as MailIcon, Terminal as TerminalIcon, Trash2, User } from 'lucide-react'
import MenuBar from './components/MenuBar.jsx'
import Dock from './components/Dock.jsx'
import Window, { DOCK_SPACE, MENU_H } from './components/Window.jsx'
import { GithubIcon, LinkedinIcon } from './components/BrandIcons.jsx'
import About from './apps/About.jsx'
import Projects from './apps/Projects.jsx'
import Terminal from './apps/Terminal.jsx'
import Skills from './apps/Skills.jsx'
import Contact from './apps/Contact.jsx'
import { usePortfolio } from './PortfolioData.jsx'

const APPS = [
  { id: 'about', title: 'About Me', icon: User, gradient: 'from-sky-300 to-sky-600', Component: About, w: 600, h: 600 },
  { id: 'projects', title: 'Projects', icon: FolderOpen, gradient: 'from-blue-400 to-indigo-600', Component: Projects, w: 820, h: 540 },
  { id: 'terminal', title: 'Terminal', icon: TerminalIcon, gradient: 'from-slate-600 to-slate-900', Component: Terminal, w: 640, h: 400 },
  { id: 'skills', title: 'Skills', icon: Cpu, gradient: 'from-cyan-300 to-teal-500', Component: Skills, w: 760, h: 460 },
  { id: 'contact', title: 'Contact', icon: MailIcon, gradient: 'from-sky-400 to-blue-500', Component: Contact, w: 700, h: 470 },
]

const linksFor = (profile) => [
  { title: 'GitHub', icon: GithubIcon, gradient: 'from-slate-700 to-slate-900', href: profile.socials.github },
  { title: 'LinkedIn', icon: LinkedinIcon, gradient: 'from-blue-500 to-blue-700', href: profile.socials.linkedin },
  { title: 'Trash', icon: Trash2, gradient: 'from-slate-200 to-slate-400', href: undefined },
]

const DESKTOP_ICONS = ['projects', 'terminal', 'contact']

function useIsMobile() {
  const query = '(max-width: 767px)'
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#142c40' : '#2d597b')
  }, [dark])
  // Only an explicit choice is saved; until then the system setting wins.
  const toggle = () => {
    try {
      localStorage.setItem('theme', dark ? 'light' : 'dark')
    } catch {}
    setDark(!dark)
  }
  return [dark, toggle]
}

function placeWindow(app, index) {
  const w = Math.min(app.w, window.innerWidth - 40)
  const h = Math.min(app.h, window.innerHeight - MENU_H - DOCK_SPACE - 24)
  const x = Math.max(20, (window.innerWidth - w) / 2 + (index - 2) * 36)
  const y = Math.max(MENU_H + 12, (window.innerHeight - DOCK_SPACE - h) / 2 + (index - 2) * 24)
  return { x, y, w, h }
}

function Wallpaper() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[url(/wallpaper.jpg)] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-950/0 transition-colors duration-700 dark:bg-slate-950/35" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />
    </div>
  )
}

export default function App() {
  const isMobile = useIsMobile()
  const [dark, toggleDark] = useTheme()
  const { profile } = usePortfolio()
  const links = useMemo(() => linksFor(profile), [profile])
  const zTop = useRef(10)
  const [bouncing, setBouncing] = useState(null)
  const [windows, setWindows] = useState(() =>
    Object.fromEntries(APPS.map((a, i) => [a.id, { open: false, minimized: false, maximized: false, z: 0, ...placeWindow(a, i) }]))
  )

  const patch = useCallback((id, changes) => setWindows((ws) => ({ ...ws, [id]: { ...ws[id], ...changes } })), [])

  const focus = useCallback(
    (id) => {
      setWindows((ws) => (ws[id].z === zTop.current ? ws : { ...ws, [id]: { ...ws[id], z: ++zTop.current } }))
    },
    []
  )

  const windowsRef = useRef(windows)
  windowsRef.current = windows

  const openApp = useCallback(
    (id) => {
      if (!windowsRef.current[id].open) {
        setBouncing(id)
        setTimeout(() => setBouncing((b) => (b === id ? null : b)), 900)
      }
      setWindows((ws) => {
        if (!ws[id].open) {
          const index = APPS.findIndex((a) => a.id === id)
          return { ...ws, [id]: { ...ws[id], ...placeWindow(APPS[index], index), open: true, minimized: false, z: ++zTop.current } }
        }
        return { ...ws, [id]: { ...ws[id], minimized: false, z: ++zTop.current } }
      })
    },
    []
  )

  const activeId = useMemo(() => {
    const visible = Object.entries(windows).filter(([, w]) => w.open && !w.minimized)
    return visible.length ? visible.reduce((a, b) => (b[1].z > a[1].z ? b : a))[0] : null
  }, [windows])

  const close = (id) => patch(id, { open: false, minimized: false, maximized: false })
  const closeAll = () => APPS.forEach((a) => close(a.id))

  // Open the About window on first load, like a login item.
  useEffect(() => {
    openApp('about')
  }, [openApp])

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || !activeId) return
      if (e.key === 'w' && e.altKey) return e.preventDefault(), closeAll()
      if (e.key === 'm') return e.preventDefault(), patch(activeId, { minimized: true })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const activeTitle = APPS.find((a) => a.id === activeId)?.title ?? 'Finder'

  return (
    <main className="relative h-full w-full overflow-hidden">
      <Wallpaper />

      <MenuBar
        activeTitle={activeTitle}
        apps={APPS}
        openApp={openApp}
        closeAll={closeAll}
        closeActive={() => activeId && close(activeId)}
        minimizeActive={() => activeId && patch(activeId, { minimized: true })}
        dark={dark}
        onToggleDark={toggleDark}
      />

      <div className="absolute top-10 right-4 flex flex-col gap-4">
        {DESKTOP_ICONS.map((id) => {
          const app = APPS.find((a) => a.id === id)
          const Icon = app.icon
          return (
            <button
              key={id}
              onDoubleClick={() => openApp(id)}
              onClick={() => isMobile && openApp(id)}
              className="group flex w-20 flex-col items-center gap-1 rounded-lg p-1 focus:outline-none"
            >
              <span className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br ${app.gradient} text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6),0_8px_20px_-6px_rgba(0,8,24,0.6)] ring-1 ring-white/25 group-focus:ring-2 group-focus:ring-white/80`}>
                <span className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent to-55%" />
                <Icon className="relative h-7 w-7" strokeWidth={1.8} />
              </span>
              <span className="rounded-md px-1.5 text-xs font-medium text-white [text-shadow:0_1px_3px_rgba(0,8,24,0.8)] group-focus:bg-sky-500/80 group-focus:backdrop-blur">
                {app.title}
              </span>
            </button>
          )
        })}
      </div>

      {APPS.map((app) => {
        const win = windows[app.id]
        if (!win.open) return null
        const { Component } = app
        return (
          <Window
            key={app.id}
            app={app}
            win={win}
            active={activeId === app.id}
            isMobile={isMobile}
            onFocus={() => focus(app.id)}
            onClose={() => close(app.id)}
            onMinimize={() => patch(app.id, { minimized: true })}
            onMaximize={() => patch(app.id, { maximized: !win.maximized })}
            onMove={(x, y) => patch(app.id, { x, y })}
          >
            <Component openApp={openApp} />
          </Window>
        )
      })}

      <Dock apps={APPS} links={links} windows={windows} bouncing={bouncing} compact={isMobile} onLaunch={openApp} />
    </main>
  )
}
