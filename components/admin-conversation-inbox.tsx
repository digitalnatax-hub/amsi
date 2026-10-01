'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import type { ContactRequest } from '@/lib/contact-request'
import { ContactThread } from '@/components/contact-thread'

export function AdminConversationInbox({ requests }: { requests: ContactRequest[] }) {
  const conversations = requests.filter(request => request.isAccountOwned)
  const [selectedId, setSelectedId] = useState(conversations[0]?.id || '')
  const selected = conversations.find(request => request.id === selectedId)

  useEffect(() => {
    if (conversations.length > 0 && !conversations.some(request => request.id === selectedId)) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  if (conversations.length === 0) return null
  return <section className="admin-conversation-inbox">
    <div className="admin-conversation-inbox__heading">
      <div><MessageCircle size={18} /><div><span>Member conversations</span><h2>Reply to listing enquiries</h2></div></div>
      <label>Conversation<select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
        {conversations.map(request => <option key={request.id} value={request.id}>{request.listingTitle || request.fullName} · {request.fullName}</option>)}
      </select></label>
    </div>
    {selected && <ContactThread key={selected.id} requestId={selected.id} mode="admin" />}
  </section>
}