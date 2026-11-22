import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">404 - Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        The requested desktop application or page could not be found.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 focus:outline-none"
      >
        Return to Desktop
      </Link>
    </div>
  )
}
