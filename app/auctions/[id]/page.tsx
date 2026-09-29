'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Check, Clock3, Gavel, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react'
import type { AuctionBid, AuctionRecord } from '@/lib/auction-types'

type BidSummary = { id: string; bidder: string; amount: number; placedAt: string }
type AuctionView = Omit<AuctionRecord, '_id'> & { id: string; bids: BidSummary[] }

export default function AuctionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [auction, setAuction] = useState<AuctionView | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [entered, setEntered] = useState(false)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now())

  async function refreshAuction() {
    const response = await fetch(`/api/auctions/${encodeURIComponent(id)}`)
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unable to load auction.')
    setAuction(result)
  }

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`/api/auctions/${encodeURIComponent(id)}`).then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load auction.')
        if (active) setAuction(result)
      }),
      fetch('/api/users/session').then(async response => {
        if (!response.ok) return
        const result = await response.json()
        if (!active) return
        setAuthenticated(true)
        const entry = await fetch(`/api/auctions/${encodeURIComponent(id)}/entry`)
        if (entry.ok) setEntered((await entry.json()).entered)
      }),
    ]).catch(loadError => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load auction.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function enterAuction() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/auctions/${id}/entry`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to enter auction.')
      setEntered(true)
      setNotice('Auction entry confirmed.')
    } catch (entryError) { setError(entryError instanceof Error ? entryError.message : 'Unable to enter auction.') }
    finally { setBusy(false) }
  }

  async function placeBid(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/auctions/${id}/bids`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(amount) }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to place your bid.')
      setAmount('')
      setNotice(`Your bid of RWF ${Number(result.bid).toLocaleString()} is recorded.`)
      await refreshAuction()
    } catch (bidError) { setError(bidError instanceof Error ? bidError.message : 'Unable to place your bid.') }
    finally { setBusy(false) }
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f3f4f0] text-[#173b38]">Loading auction room...</main>
  if (!auction) return <main className="min-h-screen bg-[#f3f4f0] p-8 text-center"><p className="serif text-3xl">Auction unavailable</p><p className="mt-3 text-sm text-[#78817a]">{error || 'This lot could not be found.'}</p><Link href="/" className="mt-6 inline-flex bg-[#173b38] px-5 py-3 text-sm text-white">Return to marketplace</Link></main>

  const secondsLeft = Math.max(0, Math.floor((Date.parse(auction.endsAt) - now) / 1000))
  const live = now >= Date.parse(auction.startsAt) && secondsLeft > 0
  const ended = secondsLeft === 0
  const minimumBid = auction.currentBid + auction.minimumIncrement
  const timeDisplay = `${String(Math.floor(secondsLeft / 3600)).padStart(2, '0')} : ${String(Math.floor(secondsLeft % 3600 / 60)).padStart(2, '0')} : ${String(secondsLeft % 60).padStart(2, '0')}`
  const media = auction.media[0]

  return <main className="min-h-screen bg-[#f3f4f0] text-[#17211f]"><header className="border-b border-[#d9ded7] bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/#auctions" className="flex items-center gap-2 text-sm font-semibold text-[#315c50]"><ArrowLeft size={16} /> All auctions</Link><span className="text-sm font-semibold tracking-[.14em] text-[#173b38]">AMSI <span className="font-normal text-[#78817a]">AUCTION ROOM</span></span></div></header><div className="mx-auto max-w-6xl px-5 py-8 sm:py-12"><div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]"><section><div className="relative aspect-[16/10] overflow-hidden bg-[#e2e5dc]">{media ? media.contentType.startsWith('video/') ? <video src={`/api/media/${media.id}`} controls className="h-full w-full object-cover" /> : <img src={`/api/media/${media.id}`} alt={auction.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Gavel size={40} className="text-[#0a486f]" /></div>}<span className="absolute left-4 top-4 bg-white/95 px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#315c50]">{live ? 'Live auction' : ended ? 'Bidding closed' : 'Upcoming'}</span></div><p className="eyebrow mt-7">{auction.category} <span className="px-1 text-[#b2a27b]">/</span> Private lot</p><h1 className="serif mt-3 text-4xl leading-tight text-[#173b38] sm:text-5xl">{auction.title}</h1><p className="mt-3 flex items-center gap-2 text-sm text-[#78817a]"><MapPin size={16} /> {auction.location || 'Location on request'}</p><p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#5c695f]">{auction.description}</p>{auction.rules && <section className="mt-8 border-t border-[#d9ded7] pt-6"><h2 className="serif text-2xl text-[#173b38]">Auction rules</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#5c695f]">{auction.rules}</p></section>}</section><aside className="h-fit border border-[#d9ded7] bg-white p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0a486f]">{ended ? 'Auction closed' : live ? 'Time remaining' : 'Opens'}</p><p className="serif mt-2 text-3xl text-[#173b38]">{live ? timeDisplay : ended ? 'Bidding closed' : new Date(auction.startsAt).toLocaleString()}</p><div className="my-6 border-y border-[#e5e7e0] py-5"><p className="text-[10px] font-bold uppercase tracking-wider text-[#879087]">Current highest bid</p><p className="serif mt-2 text-3xl text-[#173b38]">RWF {auction.currentBid.toLocaleString()}</p><p className="mt-2 text-xs text-[#78817a]">{auction.bidCount} bids recorded {auction.currentBidderName ? `· leading: ${auction.currentBidderName}` : ''}</p></div><div className="grid grid-cols-2 gap-3"><AuctionFact label="Starting price" value={`RWF ${auction.startingPrice.toLocaleString()}`} /><AuctionFact label="Minimum next bid" value={`RWF ${minimumBid.toLocaleString()}`} /><AuctionFact label="Entry fee" value={`RWF ${auction.entryFee.toLocaleString()}`} /><AuctionFact label="Closes" value={new Date(auction.endsAt).toLocaleString()} /></div>{!authenticated ? <div className="mt-6 border border-[#e5e7e0] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-[#173b38]"><LockKeyhole size={16} /> Sign in to participate.</p><Link href="/" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#315c50]">Sign in or create account <ArrowUpRight size={14} /></Link></div> : live && auction.entryFee > 0 ? <div className="mt-6 border border-[#e4c7c2] bg-[#fff7f5] p-4"><p className="text-sm font-semibold text-[#a35b47]">Bidding fee payment unavailable</p><p className="mt-2 text-xs leading-5 text-[#81584f]">No payment provider is connected. You will not be charged, and entry remains locked.</p></div> : live && !entered ? <button disabled={busy} onClick={enterAuction} className="mt-6 w-full bg-[#173b38] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Joining...' : 'Enter auction'}</button> : live && entered ? <form onSubmit={placeBid} className="mt-6 border-t border-[#e5e7e0] pt-5"><label className="text-sm font-semibold text-[#304a3e]">Your bid · RWF<input required type="number" min={minimumBid} step="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder={String(minimumBid)} className="field mt-2" /></label><button disabled={busy} className="mt-3 w-full bg-[#173b38] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Placing bid...' : 'Place bid'}</button></form> : null}<div className="mt-6 flex items-center gap-2 border-t border-[#e5e7e0] pt-4 text-xs text-[#55705f]"><ShieldCheck size={16} /> Bids are recorded to your account</div></aside></div><section className="mt-10 border border-[#d9ded7] bg-white p-6 sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Competition</p><h2 className="serif mt-2 text-3xl text-[#173b38]">Recent bids</h2></div><p className="flex items-center gap-2 text-xs text-[#78817a]"><Clock3 size={14} /> Highest first</p></div><div className="mt-5 divide-y divide-[#e5e7e0]">{auction.bids.map((bid, index) => <div key={bid.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-semibold text-[#344d40]">{index === 0 ? 'Leading bid' : `Bidder ${bid.bidder}`}</p><p className="mt-1 text-xs text-[#879087]">{new Date(bid.placedAt).toLocaleString()}</p></div><p className="text-sm font-bold text-[#173b38]">RWF {bid.amount.toLocaleString()}</p></div>)}{auction.bids.length === 0 && <p className="py-8 text-center text-sm text-[#78817a]">No bids yet. The opening bid is RWF {auction.startingPrice.toLocaleString()}.</p>}</div></section>{error && <p role="alert" className="mt-5 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}{notice && <p role="status" className="mt-5 flex items-center gap-2 bg-[#edf3ec] p-3 text-sm text-[#315c50]"><Check size={16} />{notice}</p>}</div></main>
}

function AuctionFact({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#f4f5f0] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#879087]">{label}</p><p className="mt-1 text-xs font-semibold text-[#344d40]">{value}</p></div>
}
