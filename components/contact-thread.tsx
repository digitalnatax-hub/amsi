'use client'

import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import type { ContactMessage } from '@/lib/contact-request'

export function ContactThread({ requestId, mode }: { requestId: string; mode: 'member' | 'admin' }) {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    async function loadMessages() {
      try {
        const response = await fetch(`/api/requests/${requestId}/messages`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load this conversation.')
        if (active) setMessages(Array.isArray(result.messages) ? result.messages : [])
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load this conversation.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadMessages()
    const timer = window.setInterval(() => void loadMessages(), 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [requestId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sending) return
    setSending(true)
    setError('')
    try {
      const response = await fetch(`/api/requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send this message.')
      setMessages(current => [...current, result.message])
      setDraft('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send this message.')
    } finally {
      setSending(false)
    }
  }

  return <section className="contact-thread" aria-label="Conversation with AMSI">
    <div className="contact-thread__messages" role="log" aria-live="polite">
      {loading ? <p className="contact-thread__empty">Loading conversation...</p> : messages.length === 0 ? <p className="contact-thread__empty">Start the conversation with AMSI.</p> : messages.map(message => {
        const ownMessage = message.sender === mode
        return <article key={message.id} className={`contact-thread__message ${ownMessage ? 'is-own' : ''}`}>
          <span>{message.sender === 'admin' ? 'AMSI team' : 'You'}</span>
          <p>{message.message}</p>
          <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
        </article>
      })}
      <div ref={bottomRef} />
    </div>
    {error && <p role="alert" className="contact-thread__error">{error}</p>}
    <form onSubmit={sendMessage} className="contact-thread__composer">
      <label className="sr-only" htmlFor={`contact-message-${requestId}`}>Your message</label>
      <textarea id={`contact-message-${requestId}`} rows={2} maxLength={5000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a message..." />
      <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" title="Send message">{sending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}</button>
    </form>
  </section>
}