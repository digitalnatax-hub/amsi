'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, LoaderCircle, X } from 'lucide-react'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function AdvisorChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
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
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to reach the advisor.')
      setMessages(current => [...current, { role: 'assistant', content: result.reply }])
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to reach the advisor.')
    } finally { setBusy(false) }
  }

  if (!open) return null
  return <div className="modal-backdrop z-[70]" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section aria-labelledby="advisor-title" className="flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden border border-white/20 bg-[#f8f9fa] shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/15 bg-[#062f4a] px-5 py-4 text-white sm:px-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white/10 text-[#e8d5a7]"><Bot size={20} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#e8d5a7]">AMSI intelligence</p><h2 id="advisor-title" className="mt-1 text-lg font-medium">Property advisor</h2></div></div><button onClick={onClose} aria-label="Close advisor" className="p-2 text-white/70 hover:text-white"><X size={19} /></button></header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6" role="log" aria-live="polite">
        {messages.length === 0 && <div className="max-w-lg"><p className="text-sm leading-6 text-[#52625b]">Ask about properties, rentals, active auctions, or how your budget could fit the current collection. I’ll use live AMSI listings to make specific comparisons.</p><div className="mt-4 flex flex-wrap gap-2">{['I have RWF 80M. What fits?', 'Compare rentals in Kigali', 'Which auctions are still open?'].map(prompt => <button key={prompt} onClick={() => setInput(prompt)} className="border border-[#d8e1e8] bg-white px-3 py-2 text-xs font-medium text-[#0a486f] hover:border-[#0a486f]">{prompt}</button>)}</div></div>}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] whitespace-pre-wrap px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[#0a486f] text-white' : 'border border-[#d8e1e8] bg-white text-[#253a43]'}`}>{message.content}</div></div>)}
        {busy && <div className="flex items-center gap-2 text-xs text-[#647889]"><LoaderCircle size={15} className="animate-spin" />Checking the current collection...</div>}
        <div ref={messagesEnd} />
      </div>
      {error && <p role="alert" className="mx-5 mb-3 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53] sm:mx-6">{error}</p>}
      <form onSubmit={send} className="border-t border-[#d8e1e8] bg-white p-4 sm:p-5"><label htmlFor="advisor-message" className="sr-only">Message the property advisor</label><div className="flex items-end gap-3"><textarea id="advisor-message" rows={2} maxLength={2000} value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about your budget or a listing..." className="field min-h-14 flex-1 resize-y" /><button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="grid size-12 shrink-0 place-items-center bg-[#0a486f] text-white transition hover:bg-[#07324f] disabled:opacity-40"><ArrowUp size={18} /></button></div><p className="mt-2 text-[10px] text-[#879087]">Recommendations are based on current published listings and upcoming auctions.</p></form>
    </section>
  </div>
}