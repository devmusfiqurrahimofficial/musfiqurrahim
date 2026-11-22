# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

A unified Next.js 15 (App Router) project in full strict TypeScript (`src/`), featuring:
- **Frontend**: macOS desktop experience (`/`) and administrative dashboard (`/admin/*`).
- **Backend**: Next.js Route Handlers (`/api/*`) replacing standalone Express services.
- **State**: Redux Toolkit store (`src/store/`) with RTK Query and Redux Persist for offline-first caching.
- **Validation**: Zod schemas (`src/lib/schemas.ts`) enforcing input validation across all routes.
- **Security**: Strict CSP, HSTS, rate-limiting (`src/lib/rateLimit.ts`), Firebase Admin token verification (`src/lib/auth.ts`).
- **Logging**: Structured Pino logger (`src/lib/logger.ts`) with credential redaction.

## Commands

- `npm run dev` — Next.js development server at `http://localhost:3000`
- `npm run build` — Production build (`next build`)
- `npm start` — Production server
- `npm test` — Run unit and integration tests with Vitest
- `npm run typecheck` — Strict TypeScript type-checking (`tsc --noEmit`)
- `npm run screenshots` — Generate project previews using headless Chromium

## Project Structure

- `src/app/` — Next.js App Router pages, layout, and Route Handlers (`api/`)
- `src/apps/` — Desktop macOS applications (`About`, `Projects`, `Skills`, `Contact`, `Terminal`)
- `src/components/` — Desktop chrome (`Window`, `Dock`, `MenuBar`, `Lightbox`, `BrandIcons`)
- `src/admin/` — Administrative dashboard shell and pages
- `src/features/` — Redux slices, selectors, thunks, listeners, and RTK Query APIs
- `src/lib/` — Database (`db.ts`), auth (`auth.ts`), validation (`validation.ts`, `schemas.ts`), rate limiting (`rateLimit.ts`), mailer (`mailer.ts`), logger (`logger.ts`)
- `src/types/` — Strict TypeScript domain models, window types, and store types
- `public/` — Static assets (wallpapers, profile image, project previews, theme script)
