'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { selectContent } from '@/features/content/contentSelectors'
import { APP_IDS } from '@/features/windows/appList'
import { RESUME_FILENAME, resumeLink } from '@/lib/uploadUrl'
import { openApp } from '@/features/windows/windowsThunks'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { WindowId } from '@/types/window'

const promptFor = (profile: any) => `${profile?.name?.split(' ')[0]?.toLowerCase() || 'guest'}@portfolio ~ %`

const banner = [
  `Last login: ${new Date().toDateString()} on ttys001`,
  `Welcome! Type "help" to see what I can do.`,
]

function run(input: string, open: (id: WindowId) => void, { profile, projects, skills, commands = [] }: any): string[] {
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
        '  resume        download my resume (PDF)',
        '  open <app>    open a window (about, projects, skills, contact)',
        '  ls            list desktop',
        '  date          print the date',
        '  echo <text>   print text',
        '  clear         clear the screen',
        ...(commands.length
          ? ['', 'More:', ...commands.map((c: any) => `  ${c.name.padEnd(14)}${c.description || ''}`)]
          : []),
      ]
    case 'whoami':
      return [`${profile.name} — ${profile.role}, ${profile.location}`]
    case 'about':
      return profile.bio
    case 'skills':
      return skills.map((g: any) => `${g.group.padEnd(10)} ${g.items.map((s: any) => s.name).join(', ')}`)
    case 'projects':
      return projects.map((p: any) => `${p.name.padEnd(20)} ${p.tags.join(' · ')}`)
    case 'contact':
      return [
        `email     ${profile.email}`,
        `github    ${profile.socials?.github}`,
        `linkedin  ${profile.socials?.linkedin}`,
      ]
    case 'resume': {
      const { href, external } = resumeLink(profile.resumeUrl)
      if (typeof document !== 'undefined') {
        const a = Object.assign(document.createElement('a'), { href })
        if (external) Object.assign(a, { target: '_blank', rel: 'noopener noreferrer' })
        else a.download = RESUME_FILENAME
        a.click()
      }
      return [external ? `Opening resume: ${href}` : 'Downloading resume…']
    }
    case 'ls':
      return [APP_IDS.map((a) => `${a}.app`).join('   ')]
    case 'date':
      return [new Date().toString()]
    case 'echo':
      return [args.join(' ')]
    case 'open': {
      const id = args[0]?.replace(/\.app$/, '').toLowerCase() as WindowId
      if (!APP_IDS.includes(id)) return [`open: unknown app "${args[0] ?? ''}". Try: ${APP_IDS.join(', ')}`]
      open(id)
      return [`Opening ${id}…`]
    }
    case 'sudo':
      return ['Nice try. This incident will be reported. 🙂']
    default: {
      const custom = commands.find((c: any) => c.name === cmd.toLowerCase())
      return custom ? custom.output.split('\n') : [`zsh: command not found: ${cmd}`]
    }
  }
}

export default function Terminal() {
  const dispatch = useAppDispatch()
  const data = useAppSelector(selectContent)
  const PROMPT = promptFor(data.profile)
  const [lines, setLines] = useState<{ type: 'in' | 'out'; text: string }[]>(
    banner.map((text) => ({ type: 'out', text }))
  )
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() === 'clear') {
      setLines([])
    } else {
      const out = run(input, (id) => dispatch(openApp(id)), data).map(
        (text): { type: 'in' | 'out'; text: string } => ({ type: 'out', text })
      )
      setLines((l) => [...l, { type: 'in', text: input }, ...out])
    }
    if (input.trim()) setHistory((h) => [input, ...h])
    setInput('')
    setCursor(-1)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
