import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { Cpu, ExternalLink, FolderOpen, KeyRound, LayoutDashboard, LogOut, Mail, Moon, Search, Sun, SquareTerminal, User, Wrench } from 'lucide-react'
// side-effect import: registers the auth listeners
import '../features/auth/authListeners.js'
import { selectAuthStatus, selectUser } from '../features/auth/authSelectors.js'
import { endSession, watchAuthState } from '../features/auth/authThunks.js'
import { useGetMessagesQuery } from '../features/messages/messagesApi.js'
import { selectUnreadCount } from '../features/messages/messagesSelectors.js'
import { selectIsDark } from '../features/settings/settingsSelectors.js'
import { themeToggled } from '../features/settings/settingsSlice.js'
import { useAppDispatch, useAppSelector } from '../store/hooks.js'
import { ConfirmDialog, Loading, Panel, Toaster } from './ui.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProfilePage from './pages/Profile.jsx'
import ProjectsPage from './pages/Projects.jsx'
import SkillsPage from './pages/Skills.jsx'
import ToolsPage from './pages/Tools.jsx'
import AccountPage from './pages/Account.jsx'
import CommandsPage from './pages/Commands.jsx'
import MailPage from './pages/Mail.jsx'
import MessagesPage from './pages/Messages.jsx'

// Sidebar entries, grouped like System Settings. `tint` is the rounded-square icon's gradient.
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tint: 'from-sky-400 to-sky-600', group: 0, Page: Dashboard },
  { id: 'profile', label: 'Profile', icon: User, tint: 'from-blue-400 to-blue-600', group: 1, Page: ProfilePage },
  { id: 'projects', label: 'Projects', icon: FolderOpen, tint: 'from-indigo-400 to-indigo-600', group: 1, Page: ProjectsPage },
  { id: 'skills', label: 'Skills', icon: Cpu, tint: 'from-teal-400 to-cyan-600', group: 1, Page: SkillsPage },
  { id: 'tools', label: 'Tools', icon: Wrench, tint: 'from-slate-400 to-slate-600', group: 1, Page: ToolsPage },
  { id: 'mail', label: 'Mail', icon: Mail, tint: 'from-rose-400 to-rose-600', group: 1, Page: MailPage },
  { id: 'terminal', label: 'Terminal', icon: SquareTerminal, tint: 'from-slate-600 to-slate-900', group: 1, Page: CommandsPage },
  { id: 'messages', label: 'Messages', icon: Mail, tint: 'from-emerald-400 to-green-600', group: 2, Page: MessagesPage },
  { id: 'account', label: 'Account', icon: KeyRound, tint: 'from-zinc-400 to-zinc-600', group: 3, Page: AccountPage },
]

export const pathOf = (id) => (id === 'dashboard' ? '/admin' : `/admin/${id}`)

// The admin shares index.html with the portfolio, so set its own title and keep it out of search engines.
function useAdminDocument() {
  useEffect(() => {
    const title = document.title
    document.title = 'Portfolio Admin'
    const robots = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex' })
    document.head.append(robots)
    return () => {
      document.title = title
      robots.remove()
    }
  }, [])
}

// Old bookmarks used hash routes (/admin/#/projects); send them to the real path.
function useLegacyHashRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const id = window.location.hash.match(/^#\/([\w-]+)/)?.[1]
    if (id && NAV.some((n) => n.id === id)) navigate(pathOf(id), { replace: true })
  }, [navigate])
}

// The site wallpaper under soft colour blobs: the glass panels need something to refract.
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[url(/wallpaper.jpg)] bg-cover bg-center">
      <div className="absolute inset-0 bg-sky-950/10 transition-colors duration-700 dark:bg-slate-950/50" />
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/20" />
      <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-500/10" />
      <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl dark:bg-indigo-500/15" />
    </div>
  )
}

// Same cache entry as the Messages page, so reading a message there clears the badge right away.
function useUnreadCount() {
  useGetMessagesQuery(undefined, { pollingInterval: 60_000 })
  return useAppSelector(selectUnreadCount)
}

function NavIcon({ icon: Icon, tint }) {
  return (
    <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-gradient-to-br ${tint} text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(3,105,161,0.25)]`}>
      <span className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent to-60%" />
      <Icon className="relative h-3.5 w-3.5" strokeWidth={2.2} />
    </span>
  )
}

const sidebarRow = 'flex shrink-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition'
const sidebarIdle = 'text-slate-700 hover:bg-white/45 dark:text-slate-200 dark:hover:bg-white/10'

// The admin is one System Settings-style window: sidebar on the left, the selected pane on the right.
function Shell() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const dark = useAppSelector(selectIsDark)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const route = NAV.find((n) => pathOf(n.id) === pathname.replace(/\/+$/, ''))?.id
  const [query, setQuery] = useState('')
  const unread = useUnreadCount()

  const q = query.trim().toLowerCase()
  const visible = NAV.filter((n) => !q || n.label.toLowerCase().includes(q))
  const groups = [...new Set(visible.map((n) => n.group))].map((g) => visible.filter((n) => n.group === g))

  return (
    <div className="flex min-h-full justify-center sm:p-4 lg:p-8">
      <Panel className="flex w-full max-w-6xl flex-col overflow-hidden rounded-none sm:rounded-[26px] lg:h-[calc(100vh-4rem)] lg:flex-row">
        <aside className="relative z-[2] flex shrink-0 flex-col border-b border-sky-900/10 bg-white/25 lg:w-64 lg:border-r lg:border-b-0 dark:border-white/10 dark:bg-white/[0.03]">
          <div aria-hidden="true" className="hidden gap-2 px-4 pt-4 lg:flex">
            <span className="h-3 w-3 rounded-full border border-[#e0443e] bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full border border-[#dea123] bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full border border-[#1aab29] bg-[#28c840]" />
          </div>

          <div className="relative mx-3 mt-3 lg:mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && visible[0] && navigate(pathOf(visible[0].id))}
              placeholder="Search"
              aria-label="Search settings"
              className="w-full rounded-lg bg-slate-900/[0.06] py-1.5 pr-2 pl-8 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400/60 dark:bg-white/10 dark:text-slate-100"
            />
          </div>

          <Link to={pathOf('account')} className={`${sidebarRow} mx-2 mt-3 py-2 ${route === 'account' ? 'bg-sky-500 text-white' : sidebarIdle}`}>
            {user.picture ? (
              <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/60" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-semibold text-white uppercase">
                {(user.name || user.email || 'A')[0]}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{user.name || 'Portfolio Admin'}</span>
              <span className={`block truncate text-[11px] ${route === 'account' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{user.email}</span>
            </span>
          </Link>

          <nav aria-label="Settings" className="scroll-thin flex gap-1 overflow-x-auto px-2 py-2 lg:flex-1 lg:flex-col lg:gap-3 lg:overflow-y-auto">
            {groups.map((items, i) => (
              <div key={i} className="flex gap-1 lg:flex-col lg:gap-0.5">
                {items.map(({ id, label, icon, tint }) => (
                  <Link key={id} to={pathOf(id)} aria-current={route === id ? 'page' : undefined} className={`${sidebarRow} ${route === id ? 'bg-sky-500 text-white' : sidebarIdle}`}>
                    <NavIcon icon={icon} tint={tint} />
                    {label}
                    {id === 'messages' && unread > 0 && (
                      <span className={`ml-auto rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${route === id ? 'bg-white/25' : 'bg-sky-500 text-white'}`}>{unread}</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
            {!visible.length && <p className="px-2 py-1 text-xs text-slate-500">No results</p>}
          </nav>

          <div className="flex gap-1 border-t border-sky-900/10 p-2 lg:flex-col dark:border-white/10">
            <a href="/" target="_blank" rel="noreferrer" className={`${sidebarRow} flex-1 ${sidebarIdle}`}>
              <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View site</span>
            </a>
            <button onClick={() => dispatch(themeToggled(dark))} className={`${sidebarRow} flex-1 text-left ${sidebarIdle}`}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{dark ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button onClick={() => dispatch(endSession())} className={`${sidebarRow} flex-1 text-left ${sidebarIdle}`}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </aside>

        <main className="settings-pane scroll-thin relative z-[2] min-w-0 flex-1 px-4 pb-10 sm:px-6 lg:overflow-y-auto">
          <Outlet />
        </main>
      </Panel>
    </div>
  )
}

function Checking() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Loading label="Checking your session…" />
    </div>
  )
}

// The private route: only an account the API accepted as admin gets past this.
// Anyone else goes to the login page, which sends them back here once they're in.
function RequireAdmin() {
  const status = useAppSelector(selectAuthStatus)
  const location = useLocation()
  if (status === 'checking') return <Checking />
  if (status !== 'signedIn') return <Navigate to="/admin/login" replace state={{ from: location }} />
  return <Outlet />
}

function LoginRoute() {
  const status = useAppSelector(selectAuthStatus)
  const { state } = useLocation()
  if (status === 'checking') return <Checking />
  if (status === 'signedIn') {
    const from = state?.from
    return <Navigate to={from && from.pathname !== '/admin/login' ? `${from.pathname}${from.search}` : '/admin'} replace />
  }
  return <Login />
}

export default function AdminApp() {
  useAdminDocument()
  useLegacyHashRedirect()
  const dispatch = useAppDispatch()

  useEffect(() => dispatch(watchAuthState()), [dispatch])

  return (
    <div className="scroll-thin h-full overflow-y-auto select-text">
      <Backdrop />
      <Routes>
        <Route path="login" element={<LoginRoute />} />
        <Route element={<RequireAdmin />}>
          <Route element={<Shell />}>
            {NAV.map(({ id, Page }) => (id === 'dashboard' ? <Route key={id} index element={<Page />} /> : <Route key={id} path={id} element={<Page />} />))}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
      <ConfirmDialog />
    </div>
  )
}
