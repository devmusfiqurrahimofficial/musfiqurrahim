export interface ProfileStats {
  label: string
  value: string
}

export interface ProfileSocials {
  github?: string
  linkedin?: string
  [key: string]: string | undefined
}

export interface Profile {
  name: string
  role?: string
  location?: string
  bio: string[]
  stats: ProfileStats[]
  email?: string
  socials?: ProfileSocials
  image?: string
  siteTitle?: string
  contactTitle?: string
  contactText?: string
  toolsTitle?: string
}

export interface Project {
  id?: string
  _id?: string
  name: string
  category: string
  description?: string
  tags: string[]
  color?: string
  demo?: string
  code?: string
  image?: string
  order?: number
}

export interface SkillItem {
  name: string
  level: number
}

export interface SkillGroup {
  id?: string
  _id?: string
  group: string
  items: SkillItem[]
  order?: number
}

export interface Command {
  id?: string
  _id?: string
  name: string
  description?: string
  output: string
  order?: number
}

export interface MessageInput {
  name: string
  email: string
  message: string
  website?: string
}

export interface Message extends MessageInput {
  id: string
  _id?: string
  read?: boolean
  createdAt?: string | Date
}

export interface ToolsData {
  tools: string[]
}

export interface PortfolioData {
  profile: Profile
  projects: Project[]
  skills: SkillGroup[]
  commands: Command[]
  tools: string[]
  updatedAt?: string | Date | null
}

export interface AuthUser {
  uid: string
  email: string | null
  name: string | null
  picture: string | null
  provider: string | null
}

export interface ApiErrorResponse {
  error: string
  details?: Record<string, string>
}
