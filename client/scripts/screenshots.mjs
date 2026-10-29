// Screenshots each project's live site into public/projects/<slug>.webp.
// Needs a Chromium binary (CHROME env var, or Playwright's cached one) and ImageMagick.
// Usage: npm run screenshots [-- "Project Name" ...]
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { previewOf, projects } from '../src/data.js'

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME
  const cache = join(homedir(), '.cache/ms-playwright')
  for (const dir of existsSync(cache) ? readdirSync(cache) : []) {
    if (!dir.startsWith('chromium-')) continue
    for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      if (existsSync(join(cache, dir, sub))) return join(cache, dir, sub)
    }
  }
  throw new Error('No Chromium found. Set CHROME=/path/to/chrome or run `npx playwright install chromium`.')
}

const chrome = findChrome()
const only = process.argv.slice(2)
mkdirSync('public/projects', { recursive: true })

for (const project of projects) {
  if (!project.demo || (only.length && !only.includes(project.name))) continue
  const out = join('public', previewOf(project))
  const png = join(tmpdir(), `shot-${process.pid}.png`)
  try {
    execFileSync(chrome, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
      '--window-size=1280,800', '--virtual-time-budget=8000', `--screenshot=${png}`, project.demo,
    ], { stdio: 'ignore', timeout: 60_000 })
    execFileSync('magick', [png, '-resize', '640x400', '-quality', '78', out])
    console.log(`✓ ${project.name} → ${out}`)
  } catch (err) {
    console.error(`✗ ${project.name}: ${err.message.split('\n')[0]}`)
  } finally {
    rmSync(png, { force: true })
  }
}
