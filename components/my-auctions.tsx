'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Gavel, RefreshCw } from 'lucide-react'

type UserAuction = {
  id: string
  title: string
  currentBid: number
  bidCount: number
  competitorCount: number
  startsAt: string
  endsAt: string
  entryFee: number
  paymentStatus: 'paid' | 'pending' | 'not_required'
  yourHighestBid: number
  status: 'leading' | 'outbid' | 'won' | 'ended'
}

export function MyAuctions() {
  const [auctions, setAuctions] = useState<UserAuction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAuctions() {
    setError('')
    try {
      const response = await fetch('/api/users/auctions')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load auction activity.')
      setAuctions(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load auction activity.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadAuctions() }, [])

  if (loading) return <p className="mt-8 text-sm text-[#718595]">Loading your auction activity...</p>
  return <section className="mt-8 border border-[#d8e1e8] bg-white p-5 sm:p-7"><div className="flex items-center justify-between gap-4 border-b border-[#e3ebf0] pb-5"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#6f8493]">Your activity</p><h2 className="serif mt-2 text-3xl text-[#173b38]">My auctions</h2></div><button onClick={() => void loadAuctions()} aria-label="Refresh auction activity" className="grid size-10 place-items-center border border-[#d8e1e8] text-[#315c50]"><RefreshCw size={16} /></button></div>{error && <p role="alert" className="mt-5 bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}{auctions.length === 0 ? <div className="py-12 text-center"><Gavel size={25} className="mx-auto text-[#0a486f]" /><h3 className="serif mt-4 text-2xl text-[#173b38]">No auction entries yet</h3><p className="mt-2 text-sm text-[#718595]">When you enter an auction, your bids and standing will appear here.</p><Link href="/#auctions" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#315c50]">Explore auctions <ArrowUpRight size={15} /></Link></div> : <div className="divide-y divide-[#e3ebf0]">{auctions.map(auction => <article key={auction.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="serif text-2xl text-[#173b38]">{auction.title}</h3><p className="mt-1 text-xs text-[#718595]">Ends {new Date(auction.endsAt).toLocaleString()}</p></div><span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${auction.status === 'leading' || auction.status === 'won' ? 'bg-[#e6efe8] text-[#416a50]' : 'bg-[#f3eddf] text-[#8b7040]'}`}>{auction.status === 'won' ? 'Auction won' : auction.status === 'ended' ? 'Auction ended' : auction.status === 'outbid' ? 'You have been outbid' : 'You are leading'}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><AuctionValue label="Your highest bid" value={auction.yourHighestBid ? `RWF ${auction.yourHighestBid.toLocaleString()}` : 'No bids yet'} /><AuctionValue label="Current highest" value={`RWF ${auction.currentBid.toLocaleString()}`} /><AuctionValue label="Competitors" value={`${auction.competitorCount} bidders`} /><AuctionValue label="Entry fee status" value={auction.entryFee === 0 ? 'No fee' : auction.paymentStatus} /></div><Link href={`/auctions/${auction.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#315c50]">Open auction room <ArrowUpRight size={15} /></Link></article>)}</div>}</section>
}

function AuctionValue({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#f1f6f8] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#6f8493]">{label}</p><p className="mt-2 text-sm font-bold text-[#0a486f]">{value}</p></div>
}
