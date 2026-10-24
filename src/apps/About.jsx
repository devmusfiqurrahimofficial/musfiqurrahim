import { Briefcase, MapPin } from 'lucide-react'
import { usePortfolio } from '../PortfolioData.jsx'

export default function About({ openApp }) {
  const { profile } = usePortfolio()
  const initials = profile.name.split(' ').map((w) => w[0]).join('')
  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="h-24 bg-[url(/wallpaper.jpg)] bg-cover bg-[center_42%]" />
      <div className="px-6 pb-6 sm:px-8">
        <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/80 dark:border-white/20 bg-gradient-to-br from-sky-400 to-blue-600 text-3xl font-bold text-white shadow-lg">
          {profile.image ? (
            <img src={profile.image} alt={profile.name} className="h-full w-full rounded-full object-cover" />
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
            <div key={s.label} className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/50 dark:bg-white/5 p-3 text-center">
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{s.value}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => openApp('projects')}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600"
          >
            View projects
          </button>
          <button
            onClick={() => openApp('contact')}
            className="rounded-full border border-white/70 dark:border-white/15 bg-white/60 dark:bg-white/10 px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 transition hover:bg-white/90 dark:hover:bg-white/15"
          >
            Get in touch
          </button>
        </div>
      </div>
    </div>
  )
}
