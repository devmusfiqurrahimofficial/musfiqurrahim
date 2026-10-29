// Fallbacks for the profile's site-text fields when they're empty. The admin shows them as placeholders.
export const CONTACT_TITLE = "Let's talk"
export const CONTACT_TEXT = 'Open to freelance work, full-time roles and interesting side projects.'
export const TOOLS_TITLE = 'Also comfortable with'
export const siteTitleOf = (profile) => profile.siteTitle || (profile.name ? `${profile.name} — Portfolio` : 'Portfolio')
