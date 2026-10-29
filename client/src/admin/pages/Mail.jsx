import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { useSendMailMutation } from '../../features/mail/mailApi.js'
import { useGetProfileQuery } from '../../features/profile/profileApi.js'
import { Button, Field, Input, PageHeader, Panel, TextArea } from '../ui.jsx'

const EMPTY = { from: '', subject: '', message: '' }

export default function MailPage() {
  // The recipient is the contact email in Profile; the server reads it from the database too.
  const { data: profile } = useGetProfileQuery()
  const [sendMail, { isLoading: sending }] = useSendMailMutation()
  const [form, setForm] = useState(EMPTY)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const result = await sendMail(form)
    if (!result.error) setForm(EMPTY)
  }

  return (
    <>
      <PageHeader
        title="Send Email"
        description={profile?.email ? `Send a message to ${profile.email}, the contact email in Profile.` : 'Sends to the contact email set in Profile.'}
      />
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