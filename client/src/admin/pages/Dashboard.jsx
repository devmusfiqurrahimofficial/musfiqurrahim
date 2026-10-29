import { Cpu, FolderOpen, SquareTerminal, User, Wrench } from 'lucide-react'
import { Link } from 'react-router'
import {
  selectCategoriesByCount,
  selectCommands,
  selectProfile,
  selectProjects,
  selectSkillCount,
  selectSkills,
  selectTools,
  selectUpdatedAt,
} from '../../features/content/contentSelectors.js'
import { useAppSelector } from '../../store/hooks.js'
import { PageHeader, Panel } from '../ui.jsx'

// Same content the portfolio shows, so this updates by itself after a save.
export default function Dashboard() {
  const profile = useAppSelector(selectProfile)
  const projects = useAppSelector(selectProjects)
  const skills = useAppSelector(selectSkills)
  const skillCount = useAppSelector(selectSkillCount)
  const tools = useAppSelector(selectTools)
  const commands = useAppSelector(selectCommands)
  const updatedAt = useAppSelector(selectUpdatedAt)
  const categories = useAppSelector(selectCategoriesByCount)

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderOpen, to: '/admin/projects', tint: 'from-blue-400 to-indigo-600' },
    { label: 'Skill groups', value: skills.length, icon: Cpu, to: '/admin/skills', tint: 'from-cyan-300 to-teal-500' },
    { label: 'Skills', value: skillCount, icon: Cpu, to: '/admin/skills', tint: 'from-sky-300 to-sky-600' },
    { label: 'Tools', value: tools.length, icon: Wrench, to: '/admin/tools', tint: 'from-slate-500 to-slate-800' },
    { label: 'Terminal commands', value: commands.length, icon: SquareTerminal, to: '/admin/terminal', tint: 'from-slate-600 to-slate-900' },
  ]

  return (
    <>
      <PageHeader
        title={`Hi, ${profile.name.split(' ')[0] || 'there'}`}
        description={updatedAt ? `Content last saved ${new Date(updatedAt).toLocaleString()}.` : 'Your portfolio at a glance.'}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, to, tint }) => (
          <Panel as={Link} key={label} to={to} className="group p-5 transition hover:-translate-y-0.5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-3xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Projects by category</h2>
          <ul className="space-y-3">
            {categories.map(([name, count]) => (
              <li key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{name}</span>
                  <span className="tabular-nums text-slate-400">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/5 dark:bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${(count / projects.length) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel as={Link} to="/admin/profile" className="p-6 transition hover:-translate-y-0.5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <User className="h-4 w-4 text-sky-500" /> Profile
          </h2>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{profile.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {[profile.role, profile.location].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{profile.bio?.[0]}</p>
        </Panel>
      </div>
    </>
  )
}
