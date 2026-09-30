'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Heart, MapPin, Share2, ShieldCheck, X } from 'lucide-react'
import type { MarketplaceListing } from '@/lib/listing-types'

type Listing = MarketplaceListing & { id: string }

export default function ListingDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMedia, setActiveMedia] = useState(0)
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetch(`/api/listings/${encodeURIComponent(slug)}`)
      .then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Listing not found.')
        setListing(result)
      })
      .catch(error => setNotice(error instanceof Error ? error.message : 'Unable to load this listing.'))
      .finally(() => setLoading(false))
  }, [slug])

  const media = listing ? listing.media.length > 0 ? listing.media : listing.imageUrl ? [{ id: listing.imageUrl, name: listing.title, contentType: 'image/jpeg' }] : [] : []
  const active = media[activeMedia]
  const location = listing ? [listing.district, listing.sector, listing.area].filter(Boolean).join(' · ') : ''

  async function shareListing() {
    if (!listing) return
    if (navigator.share) await navigator.share({ title: listing.title, url: window.location.href })
    else {
      await navigator.clipboard.writeText(window.location.href)
      setNotice('Listing link copied.')
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] text-[#173b38]">Loading opportunity...</main>
  if (!listing) return <main className="min-h-screen bg-[#f4f3ef] px-5 py-10 text-[#173b38]"><Link href="/" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Back to marketplace</Link><section className="mx-auto mt-28 max-w-xl text-center"><p className="eyebrow">Opportunity unavailable</p><h1 className="serif mt-3 text-4xl">We couldn't find this listing.</h1><p className="mt-4 text-sm text-[#78817a]">{notice || 'It may have been removed or is not published.'}</p><Link href="/" className="mt-7 inline-flex items-center gap-2 bg-[#173b38] px-5 py-3 text-sm font-semibold text-white">Browse marketplace <ArrowUpRight size={15} /></Link></section></main>

  return <main className="min-h-screen bg-[#f4f3ef] text-[#17211f]">
    {listing.isSample && <div role="note" className="border-b border-[#ead8a7] bg-[#fff9e8] px-5 py-3 text-center text-xs font-semibold text-[#745f2e]">Illustrative sample listing. Price, features and availability are fictional examples for demonstration.</div>}
    <header className="border-b border-[#dedfd7] bg-white"><div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-4 lg:px-10"><Link href="/" className="text-sm font-semibold tracking-[.14em] text-[#173b38]">AMSI <span className="font-normal tracking-normal text-[#78817a]">&amp; Co.</span></Link><Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#315c50]"><ArrowLeft size={16} /> Marketplace</Link></div></header>
    <div className="mx-auto max-w-[1360px] px-5 pb-20 pt-8 lg:px-10 lg:pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{listing.category} <span className="px-1 text-[#b2a27b]">/</span> {listing.purpose}</p><p className="mt-3 text-xs font-semibold uppercase tracking-[.14em] text-[#7e8780]">Reference {listing.reference || 'On request'}</p></div><div className="flex gap-2"><button onClick={() => setSaved(value => !value)} aria-label={saved ? 'Remove from saved listings' : 'Save listing'} className="grid size-11 place-items-center border border-[#d7d9d1] bg-white text-[#315c50]"><Heart size={18} fill={saved ? '#315c50' : 'none'} /></button><button onClick={shareListing} aria-label="Share listing" className="grid size-11 place-items-center border border-[#d7d9d1] bg-white text-[#315c50]"><Share2 size={18} /></button></div></div>
      <div className="grid gap-8 lg:grid-cols-[1.45fr_.55fr]">
        <section><div className="relative aspect-[4/3] max-h-[650px] overflow-hidden bg-[#e6e7df] sm:aspect-[16/10]">{active ? active.contentType.startsWith('video/') ? <video key={active.id} src={active.id.startsWith('https://') ? active.id : `/api/media/${active.id}`} controls className="h-full w-full object-cover" /> : <img src={active.id.startsWith('https://') ? active.id : `/api/media/${active.id}`} alt={`${listing.title}, view ${activeMedia + 1}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-[#78817a]">Media for this opportunity will be added shortly.</div>}{media.length > 1 && <><button aria-label="Previous media" onClick={() => setActiveMedia(index => (index + media.length - 1) % media.length)} className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center bg-white/90 text-[#173b38]"><ChevronLeft size={19} /></button><button aria-label="Next media" onClick={() => setActiveMedia(index => (index + 1) % media.length)} className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center bg-white/90 text-[#173b38]"><ChevronRight size={19} /></button><span className="absolute bottom-4 left-4 bg-[#173b38]/90 px-3 py-1.5 text-xs font-semibold text-white">{activeMedia + 1} / {media.length}</span></>}</div>{media.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">{media.map((item, index) => <button key={item.id} onClick={() => setActiveMedia(index)} className={`relative aspect-[4/3] overflow-hidden bg-[#e6e7df] ${activeMedia === index ? 'ring-2 ring-[#315c50]' : 'opacity-75 hover:opacity-100'}`}>{item.contentType.startsWith('video/') ? <video src={item.id.startsWith('https://') ? item.id : `/api/media/${item.id}`} className="h-full w-full object-cover" /> : <img src={item.id.startsWith('https://') ? item.id : `/api/media/${item.id}`} alt={`${listing.title} thumbnail ${index + 1}`} className="h-full w-full object-cover" />}</button>)}</div>}</section>
        <aside className="h-fit border border-[#dedfd7] bg-white p-6 sm:p-8"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#315c50]"><span className="size-2 rounded-full bg-[#6e9070]" /> Available opportunity</div><h1 className="serif mt-5 text-4xl leading-tight text-[#173b38]">{listing.title}</h1><p className="mt-3 flex items-center gap-2 text-sm text-[#77817a]"><MapPin size={15} /> {location || 'Location on request'}</p><div className="my-7 border-y border-[#e5e7e0] py-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#838c83]">{listing.purpose === 'For rent' ? 'Rental rate' : listing.purpose === 'For auction' ? 'Auction details' : 'Asking price'}</p><p className="serif mt-2 text-3xl text-[#173b38]">{listing.price || 'Price on request'}</p>{listing.negotiable && <p className="mt-2 text-xs text-[#77817a]">Negotiable</p>}</div><div className="grid grid-cols-2 gap-4"><Fact label="Plot size" value={listing.plotSize ? `${listing.plotSize.toLocaleString()} m²` : 'Not specified'} /><Fact label="Land use" value={listing.zoning || 'Not specified'} /><Fact label="District" value={listing.district || 'Not specified'} /><Fact label="Sector" value={listing.sector || 'Not specified'} /></div><div className="mt-7 flex items-center gap-2 border-t border-[#e5e7e0] pt-5 text-xs font-medium text-[#55705f]"><ShieldCheck size={16} /> Published by AMSI</div></aside>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]"><section className="border border-[#dedfd7] bg-white p-6 sm:p-9"><p className="eyebrow">Property record</p><h2 className="serif mt-2 text-3xl text-[#173b38]">Plot information</h2><div className="mt-7 grid gap-x-10 gap-y-5 border-y border-[#e5e7e0] py-6 sm:grid-cols-2"><Fact label="Category" value={listing.category} /><Fact label="Listed as" value={listing.purpose} /><Fact label="District" value={listing.district} /><Fact label="Sector" value={listing.sector} /><Fact label="Area" value={listing.area || 'Not specified'} /><Fact label="Reference" value={listing.reference || 'Not specified'} /><Fact label="UPI / Land title" value={listing.upi || 'Not provided'} /><Fact label="Zoning" value={listing.zoning || 'Not specified'} /><Fact label="Plot size" value={listing.plotSize ? `${listing.plotSize.toLocaleString()} m²` : 'Not specified'} /></div>{listing.features.length > 0 && <div className="border-b border-[#e5e7e0] py-6"><h3 className="serif text-2xl text-[#173b38]">Features</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{listing.features.map(feature => <p key={feature} className="flex items-center gap-2 text-sm text-[#52625b]"><Check size={15} className="text-[#0a486f]" /> {feature}</p>)}</div></div>}<div className="grid gap-8 py-7 sm:grid-cols-2"><div><h3 className="serif text-2xl text-[#173b38]">More details</h3><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5c695f]">{listing.descriptionEnglish || 'Additional details are available on request.'}</p></div>{listing.descriptionKinyarwanda && <div><h3 className="serif text-2xl text-[#173b38]">Ibisobanuro</h3><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5c695f]">{listing.descriptionKinyarwanda}</p></div>}</div></section><aside className="h-fit bg-[#e8e9e1] p-6 sm:p-7"><p className="eyebrow">A considered next step</p><h3 className="serif mt-3 text-2xl leading-tight text-[#173b38]">Interested in this opportunity?</h3><p className="mt-3 text-sm leading-6 text-[#657169]">Contact AMSI to arrange a viewing or request more information.</p><a href={`mailto:info@amsi.rw?subject=${encodeURIComponent(`Inquiry: ${listing.title}`)}`} className="mt-6 flex items-center justify-between bg-[#173b38] px-4 py-3.5 text-sm font-bold text-white">Request information <ArrowUpRight size={16} /></a><p className="mt-4 text-xs leading-5 text-[#7b857d]">Reference {listing.reference || listing.slug} · {listing.media.length} photos and videos</p></aside></div>
    </div>
    {notice && <div role="status" className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 bg-[#173b38] px-5 py-3 text-sm text-white shadow-xl"><Check size={16} className="text-[#e8d5a7]" /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15} /></button></div>}
  </main>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#879087]">{label}</p><p className="mt-1 text-sm font-semibold text-[#344d40]">{value}</p></div>
}
