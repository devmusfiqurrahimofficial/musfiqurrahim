import nodemailer from 'nodemailer'
import { settings } from './db'
import { HttpError } from './validation'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] || c)

export interface SendMailParams {
  from: string
  subject: string
  message: string
}

export async function sendToOwner({ from, subject, message }: SendMailParams): Promise<string> {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new HttpError(500, 'Email sending is not configured on the server.')
  }

  const settingsColl = await settings()
  const profileDoc = await settingsColl.findOne({ _id: 'profile' as any }, { projection: { email: 1 } })
  const to = profileDoc?.email

  if (!to) {
    throw new HttpError(422, 'Set a contact email in Profile first.')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: { name: from, address: user },
    replyTo: from,
    to,
    subject,
    text: message,
    html: escapeHtml(message).replace(/\n/g, '<br>'),
  })

  return to
}
