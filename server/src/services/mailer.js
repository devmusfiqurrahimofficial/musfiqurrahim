import nodemailer from 'nodemailer'
import { settings } from '../db/index.js'
import { HttpError } from '../utils/validation.js'

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])

// Sends a message to the site owner: the contact email saved in the profile.
export async function sendToOwner({ from, subject, message }) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) throw new HttpError(500, 'Email sending is not configured on the server.')

  const to = (await settings().findOne({ _id: 'profile' }, { projection: { email: 1 } }))?.email
  if (!to) throw new HttpError(422, 'Set a contact email in Profile first.')

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  await transporter.sendMail({
    // nodemailer quotes and encodes the name itself.
    from: { name: from, address: user },
    replyTo: from,
    to,
    subject,
    text: message,
    html: escapeHtml(message).replace(/\n/g, '<br>'),
  })
  return to
}
