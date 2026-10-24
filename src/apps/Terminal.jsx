import { useEffect, useRef, useState } from 'react'
import { usePortfolio } from '../PortfolioData.jsx'

const promptFor = (profile) => `${profile.name.split(' ')[0].toLowerCase() || 'guest'}@portfolio ~ %`
const APP_IDS = ['about', 'projects', 'terminal', 'skills', 'contact']

const banner = [
  `Last login: ${new Date().toDateString()} on ttys001`,
  `Welcome! Type "help" to see what I can do.`,
]

// Built-ins win over custom commands (managed in the admin panel); the server also refuses their names.
function run(input, openApp, { profile, projects, skills, commands = [] }) {
  const [cmd, ...args] = input.trim().split(/\s+/)
  switch (cmd) {
    case undefined:
    case '':
      return []
    case 'help':
      return [
        'Available commands:',
        '  whoami        who is behind this portfolio',
        '  about         short bio',
        '  skills        what I work with',
        '  projects      things I have built',
        '  contact       how to reach me',
        '  open <app>    open a window (about, projects, skills, contact)',
        '  ls            list desktop',
        '  date          print the date',
        '  echo <text>   print text',
        '  clear         clear the screen',
        ...(commands.length ? ['', 'More:', ...commands.map((c) => `  ${c.name.padEnd(14)}${c.description}`)] : []),
      ]
    case 'whoami':
      return [`${profile.name} — ${profile.role}, ${profile.location}`]
    case 'about':
      return profile.bio
    case 'skills':
      return skills.map((g) => `${g.group.padEnd(10)} ${g.items.map((s) => s.name).join(', ')}`)
    case 'projects':
      return projects.map((p) => `${p.name.padEnd(20)} ${p.tags.join(' · ')}`)
    case 'contact':
      return [`email     ${profile.email}`, `github    ${profile.socials.github}`, `linkedin  ${profile.socials.linkedin}`]
    case 'ls':
      return [APP_IDS.map((a) => `${a}.app`).join('   ')]
    case 'date':
      return [new Date().toString()]
    case 'echo':
      return [args.join(' ')]
    case 'open': {
      const id = args[0]?.replace(/\.app$/, '').toLowerCase()
      if (!APP_IDS.includes(id)) return [`open: unknown app "${args[0] ?? ''}". Try: ${APP_IDS.join(', ')}`]
      openApp(id)
      return [`Opening ${id}…`]
    }
    case 'sudo':
      return ['Nice try. This incident will be reported. 🙂']
    default: {
      const custom = commands.find((c) => c.name === cmd.toLowerCase())
      return custom ? custom.output.split('\n') : [`zsh: command not found: ${cmd}`]
    }
  }
}

export default function Terminal({ openApp }) {
  const data = usePortfolio()
  const PROMPT = promptFor(data.profile)
  const [lines, setLines] = useState(banner.map((text) => ({ type: 'out', text })))
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  const submit = (e) => {
    e.preventDefault()
    if (input.trim() === 'clear') {
      setLines([])
    } else {
      const out = run(input, openApp, data).map((text) => ({ type: 'out', text }))
      setLines((l) => [...l, { type: 'in', text: input }, ...out])
    }
    if (input.trim()) setHistory((h) => [input, ...h])
    setInput('')
    setCursor(-1)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(Math.max(cursor + (e.key === 'ArrowUp' ? 1 : -1), -1), history.length - 1)
      setCursor(next)
      setInput(next === -1 ? '' : history[next])
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="scroll-thin selectable h-full overflow-y-auto bg-[#060e1a]/80 p-3 font-mono text-[13px] leading-relaxed text-sky-100"
    >
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre-wrap break-words">
          {l.type === 'in' ? (
            <>
              <span className="text-sky-400">{PROMPT}</span> {l.text}
            </>
          ) : (
            l.text
          )}
        </div>
      ))}
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="term-input" className="shrink-0 text-sky-400">
          {PROMPT}
        </label>
        <input
          id="term-input"
          ref={inputRef}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sky-50 caret-sky-300 outline-none"
        />
      </form>
      <div ref={endRef} />
    </div>
  )
}
