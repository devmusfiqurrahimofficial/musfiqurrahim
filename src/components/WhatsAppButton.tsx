import { WhatsappIcon } from './BrandIcons'

// International format without "+" or spaces, as wa.me expects.
const WHATSAPP_NUMBER = '8801632911828'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

/** Floating "Chat on WhatsApp" button, bottom-right of the desktop. */
export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp (opens in a new tab)"
      title="Chat on WhatsApp"
      className="group fixed right-3 bottom-[5.5rem] z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6),0_10px_24px_-6px_rgba(0,8,24,0.55)] ring-1 ring-white/30 transition-transform duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:right-5 sm:bottom-5 sm:h-14 sm:w-14"
    >
      {/* Soft attention ring; hidden for users who prefer reduced motion. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.4s] motion-reduce:hidden"
      />
      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent to-55%" />
      <WhatsappIcon className="relative h-6 w-6 drop-shadow-sm sm:h-7 sm:w-7" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-full mr-3 hidden rounded-lg bg-slate-900/85 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
      >
        Chat on WhatsApp
      </span>
    </a>
  )
}
