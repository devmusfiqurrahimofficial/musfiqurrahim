import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { api } from '../api.js'
import { Button, Field, Input, PageHeader, Panel, TextArea, useUi } from '../ui.jsx'

// Fixed recipient — always the site owner.
const TO_EMAIL = 'devmusfiqurrahimofficial@gmail.com'

export default function MailPage() {
  const { toast } = useUi()
  const [form, setForm] = useState({ from: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api('/mail', {
        method: 'POST',
        body: { from: form.from, subject: form.subject, message: form.message },
      })
      setForm({ from: '', subject: '', message: '' })
      toast(`Email sent to ${TO_EMAIL}`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHeader title="Send Email" description={`Send a message to ${TO_EMAIL}.`} />
      <Panel className="p-6 max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <Field label="From" hint="The email address shown as the sender.">
            <Input
              type="email"
              required
              value={form.from}
              onChange={update('from')}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Subject" required>
            <Input required value={form.subject} onChange={update('subject')} placeholder="Hello" />
          </Field>
          <Field label="Message" required>
            <TextArea
              required
              rows={10}
              value={form.message}
              onChange={update('message')}
              placeholder="Type your message…"
            />
          </Field>
          <Button type="submit" variant="primary" busy={sending} disabled={sending}>
            <Send className="h-4 w-4" /> Send Email
          </Button>
        </form>
      </Panel>
    </>
  )
}