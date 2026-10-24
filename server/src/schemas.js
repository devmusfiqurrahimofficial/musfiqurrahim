import { boolean, email, integer, list, object, pattern, refine, string, url } from './validation.js'

// Tailwind only ships classes it finds in the source, so the admin panel offers a fixed
// list of gradients (src/admin/gradients.js). This just checks the shape.
const gradient = pattern(/^from-[a-z]+-\d{2,3} to-[a-z]+-\d{2,3}$/, 'must look like "from-sky-400 to-blue-600"')

export const profileSchema = {
  name: string({ max: 80, required: true }),
  role: string({ max: 120 }),
  location: string({ max: 120 }),
  bio: list(string({ max: 1200, required: true }), { max: 10 }),
  stats: list(object({ label: string({ max: 40, required: true }), value: string({ max: 20, required: true }) }), { max: 6 }),
  email: email(),
  socials: object({ github: url(), linkedin: url() }),
}

export const projectSchema = {
  name: string({ max: 80, required: true }),
  category: string({ max: 40, required: true }),
  description: string({ max: 600 }),
  tags: list(string({ max: 30, required: true }), { max: 15, unique: true }),
  color: gradient,
  demo: url(),
  code: url(),
  image: url(),
}

export const skillGroupSchema = {
  group: string({ max: 40, required: true }),
  items: list(object({ name: string({ max: 60, required: true }), level: integer({ min: 0, max: 100 }) }), { max: 30 }),
}

export const toolsSchema = {
  tools: list(string({ max: 40, required: true }), { max: 80, unique: true }),
}

export const loginSchema = {
  email: email({ required: true }),
  password: string({ max: 200, required: true, trim: false }),
}

export const passwordSchema = {
  currentPassword: string({ max: 200, required: true, trim: false }),
  newPassword: string({ min: 10, max: 200, required: true, trim: false }),
}

// Built into the Terminal app (src/apps/Terminal.jsx). Custom commands can't reuse these names.
export const RESERVED_COMMANDS = ['help', 'clear', 'whoami', 'about', 'skills', 'projects', 'contact', 'ls', 'date', 'echo', 'open', 'sudo']

export const commandSchema = {
  name: refine(
    pattern(/^[a-z][a-z0-9-]{0,23}$/, 'must be lowercase letters, digits or dashes, starting with a letter (max 24)'),
    (name) => !RESERVED_COMMANDS.includes(name),
    'is a built-in command'
  ),
  description: string({ max: 100 }),
  output: string({ max: 4000, required: true }),
}

// What a visitor sends from the Contact window. `website` is a honeypot: hidden from people, filled in by bots.
export const messageSchema = {
  name: string({ max: 80, required: true }),
  email: email({ required: true }),
  message: string({ min: 2, max: 5000, required: true }),
  website: string({ max: 200 }),
}

export const messageUpdateSchema = {
  read: boolean(),
}
