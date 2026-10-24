import { useEffect, useState } from 'react'
import { usePortfolio } from '../PortfolioData.jsx'

export default function Skills() {
  const { skills, tools } = usePortfolio()
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="scroll-thin h-full overflow-y-auto p-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {skills.map((group) => (
          <section key={group.group} className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">{group.group}</h3>
            <ul className="space-y-3">
              {group.items.map((s, i) => (
                <li key={s.name}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{s.name}</span>
                    <span className="tabular-nums text-slate-400">{s.level}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-400/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-[width] duration-1000 ease-out"
                      style={{ width: filled ? `${s.level}%` : '0%', transitionDelay: `${i * 120}ms` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h3 className="mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">Also comfortable with</h3>
      <div className="flex flex-wrap gap-2">
        {tools.map((t) => (
          <span key={t} className="rounded-full border border-white/70 dark:border-white/15 bg-white/50 dark:bg-sky-400/10 px-3 py-1 text-[13px] text-sky-800 dark:text-sky-200">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
