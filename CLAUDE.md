# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal portfolio site styled as a macOS desktop (menu bar, dock, draggable windows), plus an admin panel and an Express API for editing its content. React 19 + Vite 8 + Tailwind CSS v4, plain JSX (no TypeScript); the server in `server/` is plain Node.js ES modules. Icons come from `lucide-react`; brand logos (GitHub, LinkedIn) are hand-written SVGs in `src/components/BrandIcons.jsx`.

## Commands

- `npm run dev` — Vite dev server (portfolio at `/`, admin at `/admin`); proxies `/api` to port 4000
- `npm run dev:server` — API server with `node --watch` (needs MongoDB and `server/.env`; see `server/.env.example`)

Two env files, both gitignored: the root `.env` holds the `VITE_FIREBASE_*` web config the admin panel signs in with (it's baked into the admin bundle; Vite needs a restart after changes), and `server/.env` holds the server settings. Each has a committed `.env.example`.
- `npm run build` — production build to `dist/` (the admin is a separate lazy-loaded chunk)
- `npm start` — production: the Express server serves `/api` and the built `dist/`
- `npm run preview` — serve the built `dist/` without the API

The server has its own `package.json`; run `npm install` in `server/` too.

There is no test suite, linter, or formatter configured.

## Architecture

**Content vs. UI.** The wallpaper is `public/wallpaper.jpg`. Portfolio content (profile, bio, socials, projects, skills, tools) is stored in MongoDB, served by the API and edited through the admin panel. `src/PortfolioData.jsx` renders immediately with the bundled `src/data.js`, then swaps in `GET /api/portfolio`; if the API is unreachable the bundled copy stays, so a static-only deploy still works. Components read content through `usePortfolio()`, never by importing `data.js` directly (only `previewOf` is imported from it). `data.js` is also the seed: when the database is empty, the server copies it in. After that, `data.js` is only the fallback and edits there don't reach the API. The Terminal app reads the same data for `whoami`, `projects`, `skills`.

**Window manager lives in `src/App.jsx`.** The `APPS` array is the single registry of apps: `id`, `title`, icon, dock gradient, the component to render, and default `w`/`h`. Window state is one object keyed by app id (`open`, `minimized`, `maximized`, `z`, `x`, `y`, `w`, `h`). Focus is a monotonically increasing `zTop` ref; the active window is derived as the visible window with the highest `z`. `openApp(id)` is the one entry point for launching/restoring a window and is passed down to every app component (as a prop) as well as to `MenuBar`, `Dock`, and desktop icons.

**Adding an app** means: create a component in `src/apps/`, add an entry to `APPS` in `App.jsx`, and — if it should be reachable from the terminal's `open` command — add its id to `APP_IDS` in `src/apps/Terminal.jsx` (that list is duplicated there, not imported).

**`src/components/Window.jsx`** renders the chrome (traffic lights, title bar), handles pointer-capture dragging with clamping, and drives open/close/minimize animations. It exports `MENU_H` and `DOCK_SPACE`, which `App.jsx` uses for window placement — keep those in sync with the actual menu bar and dock sizes. Close is delayed ~170ms so the close animation plays before the parent unmounts the window.

**Mobile.** `useIsMobile()` (max-width 767px) forces every window maximized, makes desktop icons single-tap instead of double-click, and switches the dock to compact mode.

**Styling.** Tailwind v4 via `@tailwindcss/vite` — there is no `tailwind.config.js`. Theme tokens (fonts, custom animations/keyframes such as `animate-window-open`, `animate-dock-bounce`) are defined in the `@theme` block of `src/index.css`; the liquid-glass materials (`.glass` for the dock and icons, `.glass-panel` for anything holding text) are plain CSS below it — see the comment there. Text selection is disabled globally; add the `selectable` class (or use an input) to re-enable it. Use `scroll-thin` for scrollable panes.

**Project previews.** Each card shows `public/projects/<slug>.webp` (path from `previewOf()` in `data.js`), falling back to the project's `color` gradient if the file is missing. `npm run screenshots` regenerates them with headless Chromium + ImageMagick; pass project names to redo only those. Re-run it after adding a project or renaming one (the filename is derived from `name`).

**Contact form** POSTs to `/api/messages`, which the admin reads under Messages. It falls back to a `mailto:` URL to `profile.email` only when the API is unreachable or answers without JSON (static-only deploy). A hidden `website` field is a honeypot.

**Live updates.** After the first successful `/api/portfolio` fetch, `PortfolioData.jsx` opens an `EventSource` on `/api/events` and refetches (debounced) on each `content` event, so admin saves show up in open portfolio tabs without a reload. On the server, `touch()` in `db.js` both records `meta.updatedAt` and broadcasts that event (`src/events.js`). Any new write to public content must call `touch()`.

**Terminal custom commands** come from `commands` in the portfolio data. Built-ins are checked first; the server also refuses built-in names (`RESERVED_COMMANDS` in `server/src/schemas.js`). Keep that list in sync when adding a built-in to `src/apps/Terminal.jsx`.

**Theme.** The sky-blue liquid glass lives in `src/index.css`: `.glass` (dock, icons), `.glass-panel` (windows, menus, admin window) and `.glass-bar` (menu bar). Shadow colour comes from `--glass-shadow` so dark mode can swap it. Windows override `--glass-drop` with `rgb(var(--glass-shadow) / a)` for active and inactive depth. Inside the admin window, `.settings-pane .glass-panel` flattens nested panels (no second blur); dialogs keep full glass.

## Backend (`server/`)

Express 5 (async errors reach the error handler without try/catch), MongoDB through the official `mongodb` driver (no Mongoose: `src/schemas.js` is the only place fields are defined). `src/index.js` connects first and exits with a clear message if MongoDB is unreachable (`MONGODB_URI`, default `mongodb://127.0.0.1:27017/portfolio`).

**Data model** (`src/db.js`): collections `projects`, `skills` (one document per skill group), `commands` (custom Terminal commands, unique `name`), `messages` (contact form; admin-only), `uploads` (admin-uploaded images, served publicly by `GET /api/uploads/:id` and linked by absolute URL so they work from another domain) and `settings`, which holds single documents with string ids: `profile`, `tools` (`{ tools: [] }`) and `meta` (`updatedAt`, bumped by `touch()` after every write). Projects and skill groups carry an internal `order` field. `toApi()` turns `_id` into a string `id` and hides `order`, so the frontend never sees Mongo types. `parseId()` turns malformed ids into 404s.

**Seeding** (`src/seed.js`) runs only when there's no `profile` document. It imports content from the old JSON store `server/data/db.json` if present, otherwise from `src/data.js`.

The database name comes from the URI path; if the URI has none (typical for Atlas `mongodb+srv://…/`), it's `MONGODB_DB` or else `portfolio`.

**Kernel caveat:** MongoDB 8.0+ won't start on Linux kernels 6.19–7.0.13 (SERVER-121912, an allocator/rseq bug). On such a machine, run MongoDB 7.0 locally, e.g. `podman run -d --name portfolio-mongo -p 127.0.0.1:27017:27017 -v portfolio-mongo:/data/db docker.io/library/mongo:7.0`, or use Atlas.

- **Auth is Firebase.** The admin panel signs in with the Firebase JS SDK (Google popup, or email/password) and sends the Firebase ID token as `Authorization: Bearer`. `requireAuth` (in `src/auth.js`) verifies it with `firebase-admin`, which needs only `FIREBASE_PROJECT_ID`, no service-account key, and then applies `isAdmin()`. A valid token alone is not enough, since anyone can sign in to the project with Google. Access comes from `ADMIN_UIDS`, or from `ADMIN_EMAILS` when Firebase has verified the email. The server refuses to start without one of them. Failures return 401 (bad or expired token) or 403 (valid, but not allowed). `GET /api/auth/me` is the only auth route. Passwords, resets and sessions belong to Firebase; the server stores no users.
- **Routes:** public `GET`s for `/api/portfolio` (includes `commands`), `/api/profile`, `/api/projects`, `/api/skills`, `/api/tools`, `/api/commands` and `/api/events` (SSE). Projects, skill groups and commands use `collectionRouter(collection, schema)` in `routes/content.js`: list/get/create/`PUT` replace/`PATCH` merge/delete, plus `POST /reorder` with `{ ids }`, which rewrites `order` in one `bulkWrite`. `/api/messages` (`routes/messages.js`): `POST` is public and rate-limited (5 per 10 minutes per IP, `src/rateLimit.js`; set `TRUST_PROXY` behind a proxy), while `GET`/`PATCH {read}`/`DELETE` are admin-only.
- **Writes are protected by default:** a guard in `index.js` runs `requireAuth` on every non-GET `/api` request unless it's in `PUBLIC_WRITES` (only `POST /api/messages`). Routers still call `requireAuth` themselves; it skips re-verifying when `req.user` is already set. Mongo duplicate-key errors (code 11000) become 422 `{ field: 'is already used' }`.
- **Validation:** every write goes through `validate(schema, body)` with the schemas in `src/schemas.js`. Unknown fields are dropped. Failures return 422 with `details` keyed by field, which the admin forms show inline. Only schema keys are ever written, so request bodies can't inject Mongo operators or extra fields. URLs must be http(s) or a root-relative path.

## Deployment

The site is on Vercel (static `dist/`, SPA rewrite in `vercel.json`); the API runs separately on Render (`render.yaml`, `rootDir: server`) against MongoDB Atlas. Vercel builds with `VITE_API_URL` set to the Render URL, and the API's `CORS_ORIGIN` lists the site's domains. Render's free tier sleeps when idle, so the first request can take ~50s; the portfolio shows the bundled `data.js` meanwhile. Nothing may be stored on the Render disk (it's wiped on restart), which is why uploads live in MongoDB.

## Routing

One page (`index.html`) and one React Router app, set up in `src/main.jsx`: `/` is the portfolio (wrapped in `PortfolioProvider`), `/admin/*` lazy-loads `src/admin/AdminApp.jsx` (so Firebase never reaches visitors), and anything else redirects to `/`. The portfolio itself has no routes; its windows are state, not URLs. Because paths like `/admin/projects` must load `index.html`, the Express server falls back to it for any GET without a file extension (Vite's dev and preview servers already do this). A static host needs the same rewrite; for Vercel it's in `vercel.json`, which also skips `/api/` and sends the admin's `noindex` header.

## Admin panel (`src/admin/`)

`AdminApp` owns the session and defines nested routes relative to `/admin`: `login`, then everything else behind `RequireAdmin`, the private route. While the session is being checked it shows a spinner; when signed out it redirects to `/admin/login` with `state.from`, and `LoginRoute` sends the user back there once signed in. Pages are children of the `Shell` layout (rendered through `<Outlet />`), one per `NAV` entry: `dashboard` is the index route, the rest are `/admin/<id>`; build links with `pathOf(id)`. Old `/admin/#/<id>` bookmarks are redirected. The admin sets its own document title and a `noindex` meta tag, and the server also sends `X-Robots-Tag: noindex` under `/admin`. The guard only controls what the UI shows; the API still checks the token on every write. `firebase.js` initialises Firebase from `VITE_FIREBASE_*` (`auth` is null if any are missing, and the login screen lists them), and maps Firebase error codes to messages. `AdminApp` follows `onAuthStateChanged`. For each Firebase user it calls `/api/auth/me`, and on 401/403 signs out of Firebase and shows the server's message. `api.js` gets a fresh ID token from `auth.currentUser.getIdToken()` for every request; Firebase handles refresh and storage. `ui.jsx` holds the shared glass components (`Panel`, `Button`, `Field`, `TagInput`, `Modal`), `useResource(path)`, and `UiProvider` (toasts + promise-based `confirm`).

**Project colours** must come from `src/admin/gradients.js`. Tailwind only generates classes it finds in the source, so a gradient that isn't listed there (or in `data.js`) won't render. The server only checks the `from-x-N to-y-N` shape.
