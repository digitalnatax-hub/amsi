'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'

type Participant = {
  id: string
  fullName: string
  email: string
  phone: string
  entryFee: number
  paymentStatus: string
  highestBid: number
  outcome: string
}

export function AuctionParticipants({ auctionId }: { auctionId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [winner, setWinner] = useState<{ name: string | null; amount: number | null }>({ name: null, amount: null })

  async function toggle() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/auctions/${auctionId}/participants`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load entrants.')
      setParticipants(result.participants)
      setWinner({ name: result.winnerName, amount: result.winnerAmount })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load entrants.')
    } finally { setLoading(false) }
  }

  return <div className="mt-4 border-t border-[#e5e8e1] pt-4"><button onClick={toggle} className="flex items-center gap-2 text-xs font-bold text-[#315c50]"><Users size={15} /> {open ? 'Hide entrants' : 'Entrants & bid history'} {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>{open && <div className="mt-4">{winner.name && <p className="mb-4 bg-[#e9eee8] px-4 py-3 text-sm font-semibold text-[#315c50]">Auction winner: {winner.name} · RWF {winner.amount?.toLocaleString()}</p>}{error && <p role="alert" className="text-sm text-[#a64f53]">{error}</p>}{loading ? <p className="py-4 text-sm text-[#78817a]">Loading auction entrants...</p> : participants.length === 0 ? <p className="py-4 text-sm text-[#78817a]">No registered entrants.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="text-[9px] uppercase tracking-wider text-[#879087]"><tr><th className="pb-2">Participant</th><th className="pb-2">Phone</th><th className="pb-2">Email</th><th className="pb-2">Entry fee</th><th className="pb-2">Highest bid</th><th className="pb-2">Standing</th></tr></thead><tbody>{participants.map(person => <tr key={person.id} className="border-t border-[#e5e8e1]"><td className="py-3 font-semibold text-[#344d40]">{person.fullName}</td><td className="py-3"><a href={`tel:${person.phone}`} className="text-[#315c50]">{person.phone}</a></td><td className="py-3"><a href={`mailto:${person.email}`} className="text-[#315c50]">{person.email}</a></td><td className="py-3">RWF {person.entryFee.toLocaleString()} · {person.paymentStatus}</td><td className="py-3">{person.highestBid ? `RWF ${person.highestBid.toLocaleString()}` : 'No bid'}</td><td className="py-3 font-semibold capitalize">{person.outcome}</td></tr>)}</tbody></table></div>}</div>}</div>
}
