import type { Profile } from '@/types/models'

const ABSOLUTE_UPLOAD = /^https?:\/\/[^/]+(\/api\/uploads\/[a-f\d]{24})(?:[?#].*)?$/i
const RELATIVE_UPLOAD = /^\/api\/uploads\/[a-f\d]{24}$/i

/**
 * Uploads are served by this app, so their link must not contain a host.
 * Older uploads were saved as "http://localhost:3000/api/uploads/<id>", which breaks
 * on the deployed site. This turns any host's upload link into "/api/uploads/<id>".
 * Other URLs (external links, /resume.pdf) are returned unchanged.
 */
export function relativeUploadUrl(url: string): string {
  return url.match(ABSOLUTE_UPLOAD)?.[1] ?? url
}

/** Apply relativeUploadUrl to the profile's own uploaded files. */
export function normalizeProfileUrls<T extends Pick<Profile, 'image' | 'resumeUrl'>>(profile: T): T {
  return {
    ...profile,
    image: profile.image ? relativeUploadUrl(profile.image) : profile.image,
    resumeUrl: profile.resumeUrl ? relativeUploadUrl(profile.resumeUrl) : profile.resumeUrl,
  }
}

export const RESUME_FALLBACK = '/resume.pdf'
export const RESUME_FILENAME = 'Musfiqur-Rahim-Resume.pdf'

/**
 * Link that downloads the resume instead of opening it.
 * - Our own uploads: "?download=1" makes the server send Content-Disposition: attachment.
 * - Same-site files (/resume.pdf): the <a download> attribute is enough.
 * - External links (Google Drive, CDN): browsers ignore `download` across origins,
 *   so those still open in a new tab.
 */
export function resumeLink(resumeUrl?: string): { href: string; external: boolean } {
  const url = relativeUploadUrl(resumeUrl || RESUME_FALLBACK)
  if (RELATIVE_UPLOAD.test(url)) return { href: `${url}?download=1`, external: false }
  return { href: url, external: !url.startsWith('/') }
}
