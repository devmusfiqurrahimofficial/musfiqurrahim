// Serializable half of the app list; icons and components get added in src/apps/registry.js.
export const APP_LIST = [
  { id: 'about', title: 'About Me', w: 600, h: 600 },
  { id: 'projects', title: 'Projects', w: 820, h: 540 },
  { id: 'terminal', title: 'Terminal', w: 640, h: 400 },
  { id: 'skills', title: 'Skills', w: 760, h: 460 },
  { id: 'contact', title: 'Contact', w: 700, h: 470 },
]

export const APP_IDS = APP_LIST.map((a) => a.id)
export const DESKTOP_ICONS = ['projects', 'terminal', 'contact']
