'use client'

import { useRef, useState } from 'react'
import { Briefcase, Download, ExternalLink, MapPin } from 'lucide-react'
import Lightbox from '@/components/Lightbox'
import { selectProfile } from '@/features/content/contentSelectors'
import { RESUME_FILENAME, resumeLink } from '@/lib/uploadUrl'
import { openApp } from '@/features/windows/windowsThunks'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export default function About() {
  const dispatch = useAppDispatch()
  const profile = useAppSelector(selectProfile)
  const [viewingPhoto, setViewingPhoto] = useState(false)
  const photo = useRef<HTMLButtonElement>(null)
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')

  const resume = resumeLink(profile.resumeUrl)

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="h-24 bg-[url(/wallpaper.jpg)] bg-cover bg-[center_42%]" />
      <div className="px-6 pb-6 sm:px-8">
        <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/80 bg-gradient-to-br from-sky-400 to-blue-600 text-3xl font-bold text-white shadow-lg dark:border-white/20">
          {profile.image ? (
            <button
              ref={photo}
              onClick={() => setViewingPhoto(true)}
              aria-label={`View ${profile.name}'s photo`}
              className="h-full w-full cursor-zoom-in rounded-full transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <img
                src={profile.image}
                alt={profile.name}
                className={`h-full w-full rounded-full object-cover ${viewingPhoto ? 'invisible' : ''}`}
              />
            </button>
          ) : (
            initials
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{profile.name}</h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-sky-500" /> {profile.role}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-sky-500" /> {profile.location}
          </span>
        </div>

        <div className="selectable mt-5 space-y-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          {profile.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {profile.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/70 bg-white/50 p-3 text-center dark:border-white/10 dark:bg-white/5"
            >
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{s.value}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <a
            href={resume.href}
            {...(resume.external
              ? { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Open resume (opens in a new tab)' }
              : { download: RESUME_FILENAME, 'aria-label': 'Download resume (PDF)' })}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-700 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {resume.external ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            <span>Resume</span>
          </a>
          <button
            onClick={() => dispatch(openApp('projects'))}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            View projects
          </button>
          <button
            onClick={() => dispatch(openApp('contact'))}
            className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-white/15 dark:bg-white/10 dark:text-sky-300 dark:hover:bg-white/15"
          >
            Get in touch
          </button>
        </div>
      </div>
      {viewingPhoto && (
        <Lightbox src={profile.image} alt={profile.name} anchor={photo} onClose={() => setViewingPhoto(false)} />
      )}
    </div>
  )
}
