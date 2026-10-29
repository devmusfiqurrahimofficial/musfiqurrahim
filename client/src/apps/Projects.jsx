import { useState } from 'react'
import { ExternalLink, Folder, FolderOpen } from 'lucide-react'
import { previewOf } from '../data.js'
import { selectProjectCategories, selectProjectsInCategory } from '../features/content/contentSelectors.js'
import { useAppSelector } from '../store/hooks.js'
import { GithubIcon } from '../components/BrandIcons.jsx'

// Screenshot of the live site, over the project's gradient so a missing image still looks intentional.
function Preview({ project }) {
  const [failed, setFailed] = useState(false)
  return (
    <a
      href={project.demo}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${project.name} live`}
      className={`relative block aspect-[16/10] overflow-hidden bg-gradient-to-br ${project.color}`}
    >
      {!failed && (
        <img
          src={project.image || previewOf(project)}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <span className="absolute bottom-2.5 left-3 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur-md">
        {project.category}
      </span>
    </a>
  )
}

export default function Projects() {
  const [category, setCategory] = useState('All')
  const categories = useAppSelector(selectProjectCategories)
  const shown = useAppSelector((state) => selectProjectsInCategory(state, category))

  return (
    <div className="flex h-full">
      <aside className="hidden w-44 shrink-0 border-r border-slate-900/[0.06] dark:border-white/[0.07] bg-white/30 dark:bg-black/15 p-3 sm:block">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Favorites</p>
        {categories.map(({ name: c, count }) => {
          const Icon = c === category ? FolderOpen : Folder
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] ${
                c === category ? 'bg-sky-500/15 font-medium text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-300 hover:bg-sky-500/10'
              }`}
            >
              <Icon className="h-4 w-4 text-sky-500" />
              {c}
              <span className="ml-auto text-xs text-slate-400">{count}</span>
            </button>
          )
        })}
      </aside>

      <div className="scroll-thin flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex gap-1.5 overflow-x-auto sm:hidden">
          {categories.map(({ name: c }) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${c === category ? 'bg-sky-500 text-white' : 'bg-white/60 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
          {shown.map((p) => (
            <article
              key={p.id ?? p.name}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Preview project={p} />
              <div className="flex flex-1 flex-col p-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</h3>
                <p className="selectable mt-1 flex-1 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(p.tags ?? []).map((t) => (
                    <span key={t} className="rounded bg-sky-50 dark:bg-sky-400/10 px-1.5 py-0.5 text-[11px] text-sky-700 dark:text-sky-300">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-3 text-[13px] font-medium">
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" /> Live
                    </a>
                  )}
                  {p.code && (
                    <a href={p.code} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:underline">
                      <GithubIcon className="h-3.5 w-3.5" /> Code
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
