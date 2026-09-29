'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUp, Bot, Check, LoaderCircle, MessageCircle, Phone, X } from 'lucide-react'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function AdvisorChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [consultFormOpen, setConsultFormOpen] = useState(false)
  const [consultName, setConsultName] = useState('')
  const [consultEmail, setConsultEmail] = useState('')
  const [consultPhone, setConsultPhone] = useState('')
  const [consultMessage, setConsultMessage] = useState('')
  const [consultSent, setConsultSent] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy])

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = input.trim()
    if (!message || busy) return
    setInput('')
    setError('')
    setMessages(current => [...current, { role: 'user', content: message }])
    setBusy(true)
    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages }),
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Unable to reach the advisor.')
      }
      if (!response.body) throw new Error('The live response stream was unavailable. Please try again.')
      setMessages(current => [...current, { role: 'assistant', content: '' }])
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let pending = ''
      while (true) {
        const { done, value } = await reader.read()
        pending += decoder.decode(value || new Uint8Array(), { stream: !done })
        const lines = pending.split('\n')
        if (done) pending = ''
        else pending = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          const chunk = JSON.parse(payload)
          const text = chunk.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') || ''
          if (text) setMessages(current => current.map((item, index) => index === current.length - 1 && item.role === 'assistant' ? { ...item, content: item.content + text } : item))
        }
        if (done) break
      }
    } catch (sendError) {
      setMessages(current => current.at(-1)?.role === 'assistant' && !current.at(-1)?.content ? current.slice(0, -1) : current)
      setError(sendError instanceof Error ? sendError.message : 'Unable to reach the advisor.')
    } finally { setBusy(false) }
  }

  async function requestConsultation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'consultancy', fullName: consultName, email: consultEmail, phone: consultPhone, topic: 'AI advisor follow-up', preferredTime: '', message: consultMessage || 'I would like to speak with an AMSI consultant after using the AI advisor.' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send your consultation request.')
      setConsultSent(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send your consultation request.')
    } finally { setBusy(false) }
  }

  if (!open) return null
  return <div className="modal-backdrop z-[70]" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section aria-labelledby="advisor-title" className="flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden border border-white/20 bg-[#f8f9fa] shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-white/15 bg-[#062f4a] px-5 py-4 text-white sm:px-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white/10 text-[#e8d5a7]"><Bot size={20} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#e8d5a7]">AMSI intelligence</p><h2 id="advisor-title" className="mt-1 text-lg font-medium">AMSI AI assistant</h2></div></div><div className="flex items-center gap-1"><button onClick={() => { setConsultFormOpen(!consultFormOpen); setConsultSent(false); setError('') }} className="flex items-center gap-2 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"><Phone size={14} /><span className="hidden sm:inline">Talk to a consultant</span></button><button onClick={onClose} aria-label="Close advisor" className="p-2 text-white/70 hover:text-white"><X size={19} /></button></div></header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6" role="log" aria-live="polite">
        {consultFormOpen ? consultSent ? <div className="mx-auto max-w-md py-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#edf3ec] text-[#315c50]"><Check size={21} /></span><h3 className="serif mt-4 text-2xl text-[#173b38]">Request sent</h3><p className="mt-2 text-sm leading-6 text-[#64736a]">An AMSI consultant will follow up using the contact details you provided.</p><button onClick={() => { setConsultFormOpen(false); setConsultSent(false) }} className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-[#0a486f]"><ArrowLeft size={15} /> Back to chat</button></div> : <form onSubmit={requestConsultation} className="mx-auto max-w-lg space-y-4"><div><p className="eyebrow">Human support</p><h3 className="serif mt-2 text-2xl text-[#173b38]">Speak with our consultants</h3><p className="mt-2 text-sm text-[#64736a]">Leave your details and the team will get back to you.</p></div><input required maxLength={120} value={consultName} onChange={event => setConsultName(event.target.value)} className="field" placeholder="Full name" autoComplete="name" /><input required type="email" maxLength={254} value={consultEmail} onChange={event => setConsultEmail(event.target.value)} className="field" placeholder="Email address" autoComplete="email" /><input required type="tel" maxLength={40} value={consultPhone} onChange={event => setConsultPhone(event.target.value)} className="field" placeholder="Phone number" autoComplete="tel" /><textarea rows={3} maxLength={10000} value={consultMessage} onChange={event => setConsultMessage(event.target.value)} className="field resize-y" placeholder="What would you like help with? (optional)" /><button disabled={busy} className="flex items-center gap-2 bg-[#0a486f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending...' : 'Request a call'}<MessageCircle size={15} /></button></form> : <>{messages.length === 0 && <div className="max-w-lg"><p className="text-sm leading-6 text-[#52625b]">Hi! I can chat about a wide range of topics, and I specialize in AMSI properties, rentals, auctions, and project ideas. I’ll use live listings when recommending opportunities.</p><div className="mt-4 flex flex-wrap gap-2">{['Hi, how are you?', 'I have RWF 80M. What fits?', 'Explain buying vs renting'].map(prompt => <button key={prompt} onClick={() => setInput(prompt)} className="border border-[#d8e1e8] bg-white px-3 py-2 text-xs font-medium text-[#0a486f] hover:border-[#0a486f]">{prompt}</button>)}</div></div>}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] whitespace-pre-wrap px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[#0a486f] text-white' : 'border border-[#d8e1e8] bg-white text-[#253a43]'}`}>{message.content}</div></div>)}
        {busy && <div className="flex items-center gap-2 text-xs text-[#647889]"><LoaderCircle size={15} className="animate-spin" />Thinking...</div>}</>}
        <div ref={messagesEnd} />
      </div>
      {error && <p role="alert" className="mx-5 mb-3 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53] sm:mx-6">{error}</p>}
      {!consultFormOpen && <form onSubmit={send} className="border-t border-[#d8e1e8] bg-white p-4 sm:p-5"><label htmlFor="advisor-message" className="sr-only">Message the AI assistant</label><div className="flex items-end gap-3"><textarea id="advisor-message" rows={2} maxLength={2000} value={input} onChange={event => setInput(event.target.value)} placeholder="Ask anything, or ask about a listing..." className="field min-h-14 flex-1 resize-y" /><button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="grid size-12 shrink-0 place-items-center bg-[#0a486f] text-white transition hover:bg-[#07324f] disabled:opacity-40"><ArrowUp size={18} /></button></div><p className="mt-2 text-[10px] text-[#879087]">Google Gemini free tier may use prompts to improve products. Avoid sharing confidential information.</p></form>}
    </section>
  </div>
}