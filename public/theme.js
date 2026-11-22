// Runs before React to avoid a light/dark flash. redux-persist stores each field as its own JSON string, hence the double parse.
// A file rather than an inline <script> so the Content-Security-Policy (vercel.json) can forbid inline scripts.
let saved = null
try { saved = JSON.parse(JSON.parse(localStorage.getItem('persist:settings')).theme) } catch {}
// Light unless the visitor has picked dark (selectIsDark).
if (saved === 'dark') document.documentElement.classList.add('dark')
