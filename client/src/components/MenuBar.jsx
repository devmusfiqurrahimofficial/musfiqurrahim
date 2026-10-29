import { useEffect, useRef, useState } from 'react'
import { BatteryFull, Moon, Search, Sun, Wifi } from 'lucide-react'
import { APPS } from '../apps/registry.js'
import { selectIsDark } from '../features/settings/settingsSelectors.js'
import { themeToggled } from '../features/settings/settingsSlice.js'
import { selectActiveTitle } from '../features/windows/windowsSelectors.js'
import { allWindowsClosed } from '../features/windows/windowsSlice.js'
import { closeActiveWindow, minimizeActiveWindow, openApp } from '../features/windows/windowsThunks.js'
import { useAppDispatch, useAppSelector } from '../store/hooks.js'
import { MonogramLogo } from './BrandIcons.jsx'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15)
    return () => clearInterval(id)
  }, [])
  return now
}

function Menu({ label, items, open, onOpen, onHover, onClose, bold }) {
  return (
    <div className="relative">
      <button
        onClick={onOpen}
        onMouseEnter={onHover}
        className={`flex h-6 items-center rounded-full px-2.5 text-[13px] ${bold ? 'font-semibold' : ''} ${
          open ? 'bg-white/55 dark:bg-white/20' : 'hover:bg-white/35 dark:hover:bg-white/10'
        }`}
      >
        {label}
      </button>
      {open && (
        <div className="glass-panel animate-menu absolute left-0 top-8 min-w-56 rounded-2xl p-1.5 text-slate-800 [text-shadow:none] dark:text-slate-100">
          {items.map((item, i) =>
            item === '-' ? (
              <div key={i} className="relative z-[2] mx-2.5 my-1 h-px bg-slate-900/10 dark:bg-white/10" />
            ) : (
              <button
                key={item.label}
                disabled={!item.action}
                onClick={() => {
                  item.action()
                  onClose()
                }}
                className="relative z-[2] flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-[13px] enabled:hover:bg-sky-500 enabled:hover:text-white disabled:text-slate-400 dark:disabled:text-slate-500"
              >
                <span>{item.label}</span>
                {item.shortcut && <span className="ml-6 text-xs opacity-60">{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function MenuBar() {
  const dispatch = useAppDispatch()
  const activeTitle = useAppSelector(selectActiveTitle)
  const dark = useAppSelector(selectIsDark)
  const now = useClock()
  const [openMenu, setOpenMenu] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => !ref.current?.contains(e.target) && setOpenMenu(null)
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  const open = (id) => () => dispatch(openApp(id))
  const menus = [
    {
      id: 'apple',
      label: <MonogramLogo className="h-3.5 w-3.5" />,
      items: [
        { label: 'About This Portfolio', action: open('about') },
        '-',
        { label: 'Contact Me…', action: open('contact') },
        '-',
        { label: 'Close All Windows', action: () => dispatch(allWindowsClosed()), shortcut: '⌥⌘W' },
      ],
    },
    { id: 'app', label: activeTitle, bold: true, items: [{ label: `About ${activeTitle}`, action: open('about') }] },
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Terminal', action: open('terminal'), shortcut: '⌘T' },
        { label: 'Close Window', action: () => dispatch(closeActiveWindow()), shortcut: '⌘W' },
      ],
    },
    { id: 'edit', label: 'Edit', items: [{ label: 'Undo', shortcut: '⌘Z' }, { label: 'Copy', shortcut: '⌘C' }] },
    {
      id: 'window',
      label: 'Window',
      items: [{ label: 'Minimize', action: () => dispatch(minimizeActiveWindow()), shortcut: '⌘M' }, '-', ...APPS.map((a) => ({ label: a.title, action: open(a.id) }))],
    },
    { id: 'help', label: 'Help', items: [{ label: 'Get in Touch', action: open('contact') }] },
  ]

  return (
    <nav
      ref={ref}
      className="glass-bar absolute inset-x-0 top-0 z-[10000] flex h-7 items-center justify-between px-2 text-slate-800 dark:text-white"
    >
      <div className="flex items-center">
        {menus.map((m, i) => (
          <div key={m.id} className={i > 1 ? 'hidden sm:block' : ''}>
            <Menu
              label={m.label}
              items={m.items}
              bold={m.bold}
              open={openMenu === m.id}
              onOpen={() => setOpenMenu(openMenu === m.id ? null : m.id)}
              onHover={() => openMenu && setOpenMenu(m.id)}
              onClose={() => setOpenMenu(null)}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pr-2 text-[13px]">
        <button
          onClick={() => dispatch(themeToggled(dark))}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
          className="-mx-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/35 dark:hover:bg-white/10"
        >
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <BatteryFull className="hidden h-4 w-4 sm:block" />
        <Wifi className="h-3.5 w-3.5" />
        <Search className="hidden h-3.5 w-3.5 sm:block" />
        <span className="hidden sm:inline">
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    </nav>
  )
}
