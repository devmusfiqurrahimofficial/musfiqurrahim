import { z } from 'zod'

export const RESERVED_COMMANDS = [
  'help',
  'clear',
  'whoami',
  'about',
  'skills',
  'projects',
  'contact',
  'ls',
  'date',
  'echo',
  'open',
  'sudo',
]

// Safe URL validation: permits absolute http/https URLs or safe relative paths starting with /
export const safeUrlSchema = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    if (!val) return
    if (val.startsWith('/')) {
      if (val.startsWith('//') || /[\\\s\x00-\x1f]/.test(val)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a path like /image.png or a full URL' })
      }
      return
    }
    try {
      const parsed = new URL(val)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must start with http:// or https://' })
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid URL' })
    }
  })

export const emailSchema = z.string().trim().email('must be a valid email').max(254).toLowerCase()

export const gradientSchema = z
  .string()
  .regex(/^from-[a-z]+-\d{2,3} to-[a-z]+-\d{2,3}$/, 'must look like "from-sky-400 to-blue-600"')

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  role: z.string().trim().max(120).default(''),
  location: z.string().trim().max(120).default(''),
  bio: z.array(z.string().trim().min(1).max(1200)).max(10).default([]),
  stats: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'is required').max(40),
        value: z.string().trim().min(1, 'is required').max(20),
      })
    )
    .max(6)
    .default([]),
  email: emailSchema.optional().or(z.literal('')).default(''),
  socials: z
    .object({
      github: safeUrlSchema.optional().or(z.literal('')).default(''),
      linkedin: safeUrlSchema.optional().or(z.literal('')).default(''),
    })
    .default({ github: '', linkedin: '' }),
  image: safeUrlSchema.optional().or(z.literal('')).default(''),
  siteTitle: z.string().trim().max(120).optional().or(z.literal('')).default(''),
  contactTitle: z.string().trim().max(60).optional().or(z.literal('')).default(''),
  contactText: z.string().trim().max(300).optional().or(z.literal('')).default(''),
  toolsTitle: z.string().trim().max(60).optional().or(z.literal('')).default(''),
})

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  category: z.string().trim().min(1, 'is required').max(40),
  description: z.string().trim().max(600).default(''),
  tags: z.array(z.string().trim().min(1).max(30)).max(15).default([]),
  color: gradientSchema.optional().or(z.literal('')).default('from-sky-400 to-blue-600'),
  demo: safeUrlSchema.optional().or(z.literal('')).default(''),
  code: safeUrlSchema.optional().or(z.literal('')).default(''),
  image: safeUrlSchema.optional().or(z.literal('')).default(''),
})

export const skillGroupSchema = z.object({
  group: z.string().trim().min(1, 'is required').max(40),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'is required').max(60),
        level: z.number().int('must be a whole number').min(0).max(100),
      })
    )
    .max(30)
    .default([]),
})

export const toolsSchema = z.object({
  tools: z.array(z.string().trim().min(1).max(40)).max(80).default([]),
})

export const commandSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z][a-z0-9-]{0,23}$/, 'must be lowercase letters, digits or dashes, starting with a letter (max 24)')
    .refine((name) => !RESERVED_COMMANDS.includes(name), 'is a built-in command'),
  description: z.string().trim().max(100).default(''),
  output: z.string().min(1, 'is required').max(4000),
})

export const messageSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  email: emailSchema,
  message: z.string().trim().min(2, 'must be at least 2 characters').max(5000),
  website: z.string().max(200).optional().default(''),
})

export const messageUpdateSchema = z.object({
  read: z.boolean(),
})

export const mailSchema = z.object({
  from: emailSchema,
  subject: z.string().trim().min(1, 'is required').max(200),
  message: z.string().trim().min(1, 'is required').max(5000),
})

export type ProfileSchema = z.infer<typeof profileSchema>
export type ProjectSchema = z.infer<typeof projectSchema>
export type SkillGroupSchema = z.infer<typeof skillGroupSchema>
export type ToolsSchema = z.infer<typeof toolsSchema>
export type CommandSchema = z.infer<typeof commandSchema>
export type MessageSchema = z.infer<typeof messageSchema>
export type MailSchema = z.infer<typeof mailSchema>
