import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from './config.js'
import { projects, settings, skills, touch } from './db.js'

// Fills an empty database. Content comes from the old JSON store (server/data/db.json) if it's
// still there, otherwise from the frontend's bundled src/data.js.
export async function seedIfEmpty() {
  if (await settings().findOne({ _id: 'profile' })) return

  const legacy = await readLegacyStore()
  const content = legacy ?? (await bundledContent())
  const label = legacy ? path.relative(process.cwd(), config.legacyDataFile) : 'src/data.js'
  const ordered = (list) => list.map(({ id, ...item }, order) => ({ ...item, order }))

  await settings().insertMany([
    { _id: 'profile', ...structuredClone(content.profile) },
    { _id: 'tools', tools: [...content.tools] },
  ])
  if (content.projects.length) await projects().insertMany(ordered(content.projects.map((p) => ({ code: '', image: '', ...p }))))
  if (content.skills.length) await skills().insertMany(ordered(content.skills))
  await touch()
  console.log(`[seed] Imported content from ${label}.`)
  if (legacy) console.log(`[seed] ${label} is no longer used and can be deleted.`)
}

async function readLegacyStore() {
  try {
    return JSON.parse(await readFile(config.legacyDataFile, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

async function bundledContent() {
  try {
    return await import('../../src/data.js')
  } catch (err) {
    console.warn(`[seed] Could not read src/data.js (${err.message}); starting empty.`)
    return { profile: { name: '', bio: [], stats: [], socials: {} }, projects: [], skills: [], tools: [] }
  }
}
