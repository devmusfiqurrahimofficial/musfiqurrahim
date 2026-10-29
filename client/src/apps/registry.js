// The non-serializable half of features/windows/appList.js.
import { Cpu, FolderOpen, Mail, Terminal as TerminalIcon, User } from 'lucide-react'
import { APP_LIST } from '../features/windows/appList.js'
import About from './About.jsx'
import Contact from './Contact.jsx'
import Projects from './Projects.jsx'
import Skills from './Skills.jsx'
import Terminal from './Terminal.jsx'

const VIEW = {
  about: { icon: User, gradient: 'from-sky-300 to-sky-600', Component: About },
  projects: { icon: FolderOpen, gradient: 'from-blue-400 to-indigo-600', Component: Projects },
  terminal: { icon: TerminalIcon, gradient: 'from-slate-600 to-slate-900', Component: Terminal },
  skills: { icon: Cpu, gradient: 'from-cyan-300 to-teal-500', Component: Skills },
  contact: { icon: Mail, gradient: 'from-sky-400 to-blue-500', Component: Contact },
}

export const APPS = APP_LIST.map((app) => ({ ...app, ...VIEW[app.id] }))
export const appById = (id) => APPS.find((a) => a.id === id)
