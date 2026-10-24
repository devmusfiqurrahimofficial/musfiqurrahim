import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { email, string, validate, HttpError } from '../validation.js'
import nodemailer from 'nodemailer'

// Always send to this address.
const TO_EMAIL = 'devmusfiqurrahimofficial@gmail.com'

export function mailRouter() {
  const router = Router()

  router.post('/', requireAuth, async (req, res) => {
    const { from, subject, message } = validate(
      {
        from: email({ required: true }),
        subject: string({ min: 1, max: 200, required: true }),
        message: string({ min: 1, max: 5000, required: true }),
      },
      req.body
    )

    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT) || 587
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
      throw new HttpError(500, 'Email sending is not configured on the server.')
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: `"${from}" <${user}>`,
      replyTo: from,
      to: TO_EMAIL,
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    })

    res.json({ ok: true })
  })

  return router
}