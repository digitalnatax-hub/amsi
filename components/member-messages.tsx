'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import type { ContactRequest } from '@/lib/contact-request'
import { ContactThread } from '@/components/contact-thread'

type MessageRequest = Pick<ContactRequest, 'id' | 'message' | 'topic' | 'listingTitle' | 'createdAt' | 'status'>

export function MemberMessages({ initialRequestId = '' }: { initialRequestId?: string }) {
  const [requests, setRequests] = useState<MessageRequest[]>([])
  const [selectedId, setSelectedId] = useState(initialRequestId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/users/requests?kind=message')
      .then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load your messages.')
        return result as MessageRequest[]
      })
      .then(result => {
        if (!active) return
        setRequests(result)
        if (!selectedId && result.length > 0) setSelectedId(result[0].id)
      })
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Unable to load your messages.'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [initialRequestId])

  useEffect(() => {
    if (initialRequestId) setSelectedId(initialRequestId)
  }, [initialRequestId])

  const selected = requests.find(request => request.id === selectedId)
  return <div className="member-messages">
    <aside className="member-messages__list" aria-label="Your conversations">
      <h2>Listing enquiries</h2>
      {loading ? <p className="member-messages__empty">Loading conversations...</p> : error ? <p role="alert" className="member-messages__empty">{error}</p> : requests.length === 0 ? <p className="member-messages__empty">Your listing conversations will appear here.</p> : requests.map(request => <button key={request.id} type="button" aria-pressed={selectedId === request.id} onClick={() => setSelectedId(request.id)} className="member-messages__item">
        <span>{request.listingTitle || request.topic || 'Message to AMSI'}</span>
        <small>{request.message}</small>
        <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleDateString()}</time>
      </button>)}
    </aside>
    <div className="member-messages__thread">
      {selected ? <><div className="member-messages__heading"><MessageCircle size={18} /><div><span>Conversation</span><h2>{selected.listingTitle || selected.topic || 'Message to AMSI'}</h2></div><span className={`member-messages__status is-${selected.status}`}>{selected.status.replace('_', ' ')}</span></div><ContactThread key={selected.id} requestId={selected.id} mode="member" /></> : <div className="member-messages__placeholder"><MessageCircle size={25} /><p>Select a conversation to read and reply.</p></div>}
    </div>
  </div>
}