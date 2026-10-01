'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Check, Clock3, Gavel, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react'
import type { AuctionRecord } from '@/lib/auction-types'

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

  if (loading) return <main className="auction-detail__state"><span className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading auction room...</span></span><p>Preparing the auction room…</p></main>
  if (!auction) return <main className="auction-detail"><AuctionHeader /><section className="auction-detail__unavailable card"><Gavel size={34} /><p className="eyebrow">Auction unavailable</p><h1 className="serif">This lot could not be found.</h1><p>{error || 'It may have been removed or is no longer published.'}</p><Link href="/#auctions" className="btn btn-primary btn-amsi-primary"><ArrowLeft size={16} /> Return to auctions</Link></section></main>

  const secondsLeft = Math.max(0, Math.floor((Date.parse(auction.endsAt) - now) / 1000))
  const live = now >= Date.parse(auction.startsAt) && secondsLeft > 0
  const ended = secondsLeft === 0
  const minimumBid = auction.currentBid + auction.minimumIncrement
  const timeDisplay = `${String(Math.floor(secondsLeft / 3600)).padStart(2, '0')} : ${String(Math.floor(secondsLeft % 3600 / 60)).padStart(2, '0')} : ${String(secondsLeft % 60).padStart(2, '0')}`
  const media = auction.media[0]
  const bidLabel = auction.bidCount > 0 ? 'Current highest bid' : 'Opening bid'

  return <main className="auction-detail">
    <AuctionHeader />
    <div className="auction-detail__container">
      <nav className="auction-detail__breadcrumb" aria-label="Breadcrumb"><Link href="/#auctions">Auctions</Link><span aria-hidden="true">/</span><span>{auction.category}</span><span aria-hidden="true">/</span><span>Private lot</span></nav>
      <div className="auction-detail__title-row"><div><span className={`auction-detail__status ${ended ? 'is-ended' : live ? 'is-live' : 'is-upcoming'}`}><span aria-hidden="true" />{live ? 'Live auction' : ended ? 'Bidding closed' : 'Upcoming auction'}</span><h1 className="serif">{auction.title}</h1><p className="auction-detail__location"><MapPin size={16} />{auction.location || 'Location on request'}</p></div><span className="auction-detail__lot-label">Private lot</span></div>

      <div className="auction-detail__layout">
        <aside className="auction-detail__bid-panel card order-1 order-lg-2" aria-label="Auction status and bidding">
          <div className="auction-detail__timer-block"><span className="auction-detail__eyebrow"><Clock3 size={14} />{ended ? 'Auction closed' : live ? 'Time remaining' : 'Auction opens'}</span><p className="auction-detail__timer">{live ? timeDisplay : ended ? 'Bidding closed' : formatAuctionDate(auction.startsAt, true)}</p>{!ended && <span className="auction-detail__timer-caption">{live ? 'Time left to place a bid' : 'Bidding has not started'}</span>}</div>
          <div className="auction-detail__current-bid"><span>{bidLabel}</span><strong>RWF {auction.currentBid.toLocaleString()}</strong><small>{auction.bidCount} {auction.bidCount === 1 ? 'bid recorded' : 'bids recorded'}{auction.currentBidderName ? ` · leading: ${auction.currentBidderName}` : ''}</small></div>
          <div className="auction-detail__facts"><AuctionFact label="Starting price" value={`RWF ${auction.startingPrice.toLocaleString()}`} /><AuctionFact label="Minimum next bid" value={`RWF ${minimumBid.toLocaleString()}`} /><AuctionFact label="Entry fee" value={`RWF ${auction.entryFee.toLocaleString()}`} /><AuctionFact label="Closes" value={formatAuctionDate(auction.endsAt, true)} /></div>
          {!authenticated ? <div className="auction-detail__participation"><p><LockKeyhole size={17} /> Sign in to participate</p><Link href="/?signin=1" className="btn btn-primary btn-amsi-primary">Sign in or create an account <ArrowUpRight size={15} /></Link></div> : live && auction.entryFee > 0 ? <div className="auction-detail__fee-notice" role="status"><strong>Bidding fee payment unavailable</strong><span>No payment provider is connected. You will not be charged, and entry remains locked.</span></div> : live && !entered ? <button disabled={busy} onClick={enterAuction} className="btn btn-primary btn-amsi-primary auction-detail__action">{busy ? 'Joining…' : 'Enter auction'} <ArrowUpRight size={16} /></button> : live && entered ? <form onSubmit={placeBid} className="auction-detail__bid-form"><label htmlFor="auction-bid-amount">Your bid <span>RWF</span></label><input id="auction-bid-amount" required type="number" min={minimumBid} step="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder={String(minimumBid)} className="form-control" /><button disabled={busy} className="btn btn-primary btn-amsi-primary auction-detail__action">{busy ? 'Placing bid…' : 'Place bid'} <ArrowUpRight size={16} /></button></form> : <div className="auction-detail__closed-note"><ShieldCheck size={17} /> {ended ? 'Bidding has closed for this lot.' : 'Registration will be available when bidding opens.'}</div>}
          <p className="auction-detail__assurance"><ShieldCheck size={15} /> Bids are recorded to your account</p>
        </aside>

        <section className="auction-detail__lot order-2 order-lg-1" aria-label="Auction lot details">
          <div className="auction-detail__media">{media ? media.contentType.startsWith('video/') ? <video src={`/api/media/${media.id}`} controls className="auction-detail__media-content" /> : <img src={`/api/media/${media.id}`} alt={auction.title} className="auction-detail__media-content" /> : <div className="auction-detail__media-empty"><Gavel size={42} /></div>}<span className="auction-detail__media-category">{auction.category}</span></div>
          <section className="auction-detail__description"><p className="eyebrow">The lot</p><h2 className="serif">About this item</h2><p>{auction.description || 'Contact AMSI for more information about this auction lot.'}</p></section>
          {auction.rules && <section className="auction-detail__rules"><p className="eyebrow">Before bidding</p><h2 className="serif">Auction rules</h2><p>{auction.rules}</p></section>}
        </section>
      </div>

      <section className="auction-detail__recent card"><div className="auction-detail__recent-heading"><div><p className="eyebrow">Competition</p><h2 className="serif">Recent bids</h2></div><span><Clock3 size={14} /> Highest first</span></div><div className="auction-detail__bid-list">{auction.bids.map((bid, index) => <div key={bid.id} className="auction-detail__bid-row"><div><strong>{index === 0 ? 'Leading bid' : `Bidder ${bid.bidder}`}</strong><span>{formatAuctionDate(bid.placedAt, true)}</span></div><strong>RWF {bid.amount.toLocaleString()}</strong></div>)}{auction.bids.length === 0 && <p className="auction-detail__no-bids">No bids yet. The opening bid is RWF {auction.startingPrice.toLocaleString()}.</p>}</div></section>
      {error && <p role="alert" className="auction-detail__message is-error">{error}</p>}{notice && <p role="status" className="auction-detail__message"><Check size={16} />{notice}</p>}
    </div>
  </main>
}

function AuctionHeader() {
  return <header className="auction-detail__header"><div className="auction-detail__header-inner"><Link href="/#auctions" className="btn btn-outline-light"><ArrowLeft size={16} /><span>All auctions</span></Link><Link href="/" className="auction-detail__brand">AMSI <span>&amp; Co.</span></Link></div></header>
}

function AuctionFact({ label, value }: { label: string; value: string }) {
  return <div className="auction-detail__fact"><span>{label}</span><strong>{value}</strong></div>
}

function formatAuctionDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(value))
}
