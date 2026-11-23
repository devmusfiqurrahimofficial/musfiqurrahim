'use client'

import { useEffect } from 'react'
import { APPS, appById } from '@/apps/registry'
import Dock from '@/components/Dock'
import MenuBar from '@/components/MenuBar'
import Window from '@/components/Window'
import WhatsAppButton from '@/components/WhatsAppButton'
import { selectSiteTitle } from '@/features/content/contentSelectors'
import { useIsMobile } from '@/features/ui/useIsMobile'
import { DESKTOP_ICONS } from '@/features/windows/appList'
import { selectWindowEntities } from '@/features/windows/windowsSelectors'
import { allWindowsClosed } from '@/features/windows/windowsSlice'
import { minimizeActiveWindow, openApp } from '@/features/windows/windowsThunks'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { WindowId } from '@/types/window'

function Wallpaper() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[url(/wallpaper.jpg)] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-950/0 transition-colors duration-700 dark:bg-slate-950/35" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />
    </div>
  )
}

function DesktopIcons() {
  const dispatch = useAppDispatch()
  const isMobile = useIsMobile()
  return (
    <div className="absolute top-10 right-4 flex flex-col gap-4">
      {DESKTOP_ICONS.map((id) => {
        const app = appById(id)
        if (!app) return null
        const Icon = app.icon
        return (
          <button
            key={id}
            onDoubleClick={() => dispatch(openApp(id))}
            onClick={() => isMobile && dispatch(openApp(id))}
            className="group flex w-20 flex-col items-center gap-1 rounded-lg p-1 focus:outline-none"
          >
            <span
              className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br ${app.gradient} text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6),0_8px_20px_-6px_rgba(0,8,24,0.6)] ring-1 ring-white/25 group-focus:ring-2 group-focus:ring-white/80`}
            >
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
  )
}

export default function Home() {
  const dispatch = useAppDispatch()
  const windows = useAppSelector(selectWindowEntities)
  const siteTitle = useAppSelector(selectSiteTitle)

  useEffect(() => {
    document.title = siteTitle
  }, [siteTitle])

  useEffect(() => {
    dispatch(openApp('about'))
  }, [dispatch])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'w' && e.altKey) {
        e.preventDefault()
        dispatch(allWindowsClosed())
      }
      if (e.key === 'm') {
        e.preventDefault()
        dispatch(minimizeActiveWindow())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  return (
    <main className="relative h-full w-full overflow-hidden">
      <Wallpaper />
      <MenuBar />
      <DesktopIcons />

      {APPS.map(({ id, Component }) =>
        windows[id]?.open ? (
          <Window key={id} id={id as WindowId}>
            <Component />
          </Window>
        ) : null
      )}

      <Dock />
      <WhatsAppButton />
    </main>
  )
}
