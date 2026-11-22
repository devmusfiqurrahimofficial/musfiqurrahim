# macOS Desktop Portfolio — Next.js 15 & TypeScript

A modern personal portfolio built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, and Redux Toolkit, featuring a macOS desktop experience (draggable windows, dock with magnification, menu bar, live terminal) and an administrative dashboard for content management.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) with custom glassmorphism
- **State Management**: Redux Toolkit (RTK) + RTK Query + Redux Persist
- **Database**: MongoDB (Connection pooling, indexing, aggregation)
- **Authentication**: Firebase Authentication + Firebase Admin SDK
- **Validation**: Zod (Strict schema validation & type inference)
- **Logging**: Pino (Structured JSON logging with sensitive data redaction)
- **Testing**: Vitest 3

---

## Getting Started

### 1. Prerequisites

- Node.js 18.17+ or 20+
- MongoDB instance (local or MongoDB Atlas)
- Firebase project for admin authentication

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:
- `MONGODB_URI`: MongoDB connection string
- `FIREBASE_*`: Firebase Client & Admin SDK configuration
- `ADMIN_EMAILS` or `ADMIN_UIDS`: Comma-separated list of authorized administrator accounts
- `SMTP_*`: (Optional) SMTP settings for contact form email forwarding

### 3. Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run test suite
npm test

# Type-check with TypeScript
npm run typecheck

# Production build
npm run build
npm start
```

---

## Features

- **macOS Desktop UI**: Draggable, resizable, minimizable windows with pointer-capture, window manager, menu bar with live clock, and animated dock with spring physics.
- **Built-in Interactive Terminal**: Command interpreter supporting commands (`about`, `skills`, `projects`, `contact`, `whoami`, `clear`, `echo`, `open`, etc.) and dynamic custom commands editable via the admin panel.
- **Admin Control Center**: Secure administration panel at `/admin` protected by Firebase Admin with RBAC to edit profile, manage projects, sort skills with drag-and-drop, review received messages, configure mail settings, and manage terminal commands.
- **Real-time Server-Sent Events (SSE)**: Instant synchronization across clients when portfolio content is updated in the admin panel.
- **Production Hardened Security**:
  - OWASP-compliant Content Security Policy (CSP), HSTS, and strict HTTP headers.
  - Zod validation on all API endpoints.
  - Per-IP rate limiting with header-injection protection.
  - Secure image upload validation with binary magic-byte sniffing.
  - Structured logging with automatic sensitive credential redaction.
