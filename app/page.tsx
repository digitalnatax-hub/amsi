'use client'

import Link from 'next/link'
import { AccountModal } from '@/components/account-modal'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Building2,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Crown,
  Gavel,
  Heart,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import type { MarketplaceListing } from '@/lib/listing-types'
import type { AuctionRecord } from '@/lib/auction-types'
import { getYouTubeEmbedUrl, type Advertisement } from '@/lib/advertisement-types'

type Mode = 'Buy' | 'Rent' | 'Auction'
type Listing = MarketplaceListing & { id: string }
type Auction = Omit<AuctionRecord, '_id'> & { id: string }
type Ad = Advertisement & { id: string }

export default function Page() {
  const [mode, setMode] = useState<Mode>('Buy')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [brand, setBrand] = useState({ siteName: 'AMSI & Co.', logoImage: '' })
  const [ads, setAds] = useState<Ad[]>([])

  useEffect(() => {
    fetch('/api/listings')
      .then(response => response.json())
      .then(result => { if (Array.isArray(result)) setListings(result) })
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/settings').then(response => response.json()).then(settings => {
      setBrand({ siteName: settings.siteName || 'AMSI & Co.', logoImage: settings.logoImage || '' })
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    fetch('/api/ads').then(response => response.ok ? response.json() : []).then(result => {
      if (Array.isArray(result)) setAds(result)
    }).catch(() => setAds([]))
  }, [])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('signin') !== '1') return
    setAuthMode('login')
    setAuthOpen(true)
    window.history.replaceState(null, '', '/')
  }, [])

  useEffect(() => {
    fetch('/api/auctions')
      .then(response => response.json())
      .then(result => { if (Array.isArray(result)) setAuctions(result) })
      .catch(() => setAuctions([]))
  }, [])

  useEffect(() => {
    fetch('/api/users/favorites')
      .then(async response => response.ok ? response.json() : [])
      .then((saved: Listing[]) => setFavoriteIds(new Set(saved.map(item => item.id))))
      .catch(() => setFavoriteIds(new Set()))
  }, [])

  const filteredListings = useMemo(() => listings.filter((item) => {
    const purpose = mode === 'Buy' ? 'For sale' : mode === 'Rent' ? 'For rent' : 'For auction'
    const matchesMode = item.purpose === purpose
    const matchesQuery = !query || `${item.title} ${item.district} ${item.sector} ${item.area} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesMode && matchesQuery
  }), [mode, query])
  const heroAd = ads.find(ad => ad.placement === 'hero-poster')
  const leaderboardAds = ads.filter(ad => ad.placement === 'leaderboard')
  const mobileBannerAds = ads.filter(ad => ad.placement === 'mobile-leaderboard' || ad.placement === 'mobile-large-banner')
  const contentAds = ads.filter(ad => ['wide-post', 'medium-rectangle', 'large-rectangle', 'half-page'].includes(ad.placement))

  function openConsultant() {
    setNotice('Please log in or create an account to speak with our consultants.')
    setAuthMode('login')
    setAuthOpen(true)
  }

  async function toggleFavorite(listingId: string) {
    const remove = favoriteIds.has(listingId)
    const response = await fetch('/api/users/favorites', {
      method: remove ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
    if (response.status === 401) {
      setNotice('Sign in to save listings to your account.')
      setAuthMode('login')
      setAuthOpen(true)
      return
    }
    const result = await response.json()
    if (!response.ok) { setNotice(result.error || 'Unable to update saved listings.'); return }
    setFavoriteIds(current => {
      const next = new Set(current)
      if (remove) next.delete(listingId)
      else next.add(listingId)
      return next
    })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f9fa] text-[#131511]">
      <div className="bg-[#0a486f] px-5 py-2 text-center text-[11px] font-medium tracking-[0.18em] text-white">PRIVATE ACCESS · CURATED OPPORTUNITIES · RWANDA & EAST AFRICA</div>
      <header className="absolute left-0 right-0 top-9 z-30 border-b border-white/15 bg-[#0a486fd9] text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 lg:px-12">
          <a href="#top" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/70 text-white">{brand.logoImage ? <img src={brand.logoImage} alt="" className="h-full w-full object-contain" /> : <Crown size={17} />}</span><span className="serif text-xl tracking-wide text-white">{brand.siteName}</span></a>
          <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.16em] text-white/75 lg:flex"><a href="#marketplace" className="transition hover:text-[#ffffff]">Marketplace</a><a href="#auctions" className="transition hover:text-[#ffffff]">Live auctions</a><a href="#services" className="transition hover:text-[#ffffff]">Consultancy</a><a href="#about" className="transition hover:text-[#ffffff]">About us</a></nav>
          <div className="hidden items-center gap-3 sm:flex"><button onClick={openConsultant} className="rounded-full border border-white/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white hover:text-[#0a486f]">Talk to a consultant</button><button onClick={() => setAuthOpen(true)} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#0a486f] transition hover:bg-[#dcebf3]"><UserRound size={14} /> Sign in</button></div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-white/20 p-2 lg:hidden" aria-label="Open menu"><Menu size={19} /></button>
        </div>
        {menuOpen && <div className="border-t border-white/10 bg-[#0a486f] px-5 py-5 lg:hidden"><div className="flex flex-col gap-4 text-sm text-white/80"><a href="#marketplace" onClick={() => setMenuOpen(false)}>Marketplace</a><a href="#auctions" onClick={() => setMenuOpen(false)}>Live auctions</a><a href="#services" onClick={() => setMenuOpen(false)}>Consultancy</a><button onClick={openConsultant} className="w-fit rounded-full bg-[#0a486f] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0a486f]">Talk to a consultant</button></div></div>}
      </header>

      <section id="top" className="relative flex min-h-[650px] items-end overflow-hidden bg-[#0a486f] pb-14 pt-32 text-white lg:min-h-[700px] lg:pb-20">
        {!heroAd && <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=90')] bg-cover bg-center opacity-55" />}{heroAd && <AdvertisementCreative ad={heroAd} hero />}<div className="absolute inset-0 bg-gradient-to-r from-[#07324fdd] via-[#0a486f99] to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-[#0a486f] via-transparent to-[#0a486f33]" />{heroAd && <span className="absolute right-5 top-28 z-10 bg-[#062f4a]/75 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-white/75">Sponsored</span>}
        <div className="relative mx-auto grid w-full max-w-[1440px] gap-12 px-5 lg:grid-cols-[1fr_480px] lg:px-12"><div className="max-w-3xl"><div className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#ffffff]"><span className="h-px w-10 bg-[#0a486f]" /> The distinguished marketplace</div><h1 className="serif max-w-3xl text-6xl leading-[0.93] tracking-[-0.04em] sm:text-7xl lg:text-[104px]">Discover.<br /><em className="font-normal text-[#ffffff]">Invest.</em><br />Experience more.</h1><p className="mt-8 max-w-xl text-base leading-7 text-white/70 sm:text-lg">A private collection of exceptional properties, vehicles and opportunities — paired with intelligent guidance for every move that matters.</p><div className="mt-10 flex flex-wrap gap-4"><a href="#marketplace" className="group flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-bold text-[#0a486f] shadow-lg shadow-[#062f4a]/20 transition hover:bg-[#eaf3f7]">Explore the collection <ArrowUpRight size={17} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" /></a><button onClick={openConsultant} className="flex items-center gap-2 rounded-full border border-white/30 px-6 py-4 text-sm font-semibold text-white transition hover:border-[#ffffff] hover:text-[#ffffff]"><MessageCircle size={17} /> Talk to a consultant</button></div></div><div className="hidden self-end rounded-2xl border border-white/25 bg-[#0a486fcc] p-5 backdrop-blur-md lg:block"><div className="mb-5 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">Market pulse · Kigali</span><span className="flex items-center gap-1 text-xs text-[#b7d9a7]"><span className="h-2 w-2 rounded-full bg-[#0a486f]" /> Live</span></div><div className="grid grid-cols-2 gap-y-6"><div><p className="serif text-3xl font-semibold tracking-tight text-white">{listings.length.toLocaleString()}</p><p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75">Curated listings</p></div><div><p className="text-3xl font-light">{auctions.length}</p><p className="mt-1 text-xs uppercase tracking-wider text-white/50">Auction lots</p></div><div><p className="text-3xl font-light">{listings.filter(item => item.category.toLowerCase().includes("plot")).length}</p><p className="mt-1 text-xs uppercase tracking-wider text-white/50">Published plots</p></div><div><p className="text-3xl font-light">{listings.filter(item => item.purpose === "For rent").length}</p><p className="mt-1 text-xs uppercase tracking-wider text-white/50">Available rentals</p></div></div></div></div>
      </section>

      {leaderboardAds.length > 0 && <section aria-label="Sponsored leaderboard advertisements" className="mx-auto hidden max-w-[1200px] space-y-3 px-5 py-6 md:block">{leaderboardAds.map(ad => <div key={ad.id}><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#8b9389]">Sponsored</p><AdvertisementCreative ad={ad} /></div>)}</section>}
      {mobileBannerAds.length > 0 && <section aria-label="Sponsored mobile advertisements" className="mx-auto space-y-3 px-5 py-4 md:hidden">{mobileBannerAds.map(ad => <div key={ad.id}><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#8b9389]">Sponsored</p><AdvertisementCreative ad={ad} /></div>)}</section>}

      <section className="relative z-10 mx-auto -mt-8 max-w-[1240px] px-5"><div className="rounded-2xl bg-white p-3 shadow-[0_20px_60px_rgba(30,45,28,0.14)]"><div className="flex flex-col gap-3 lg:flex-row"><div className="flex items-center gap-2 rounded-xl bg-[#f4f4f0] px-5 py-4 lg:flex-1"><Search size={19} className="text-[#7f887c]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search homes, cars, land, opportunities..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#92988f]" /></div><div className="flex gap-2 overflow-x-auto rounded-xl bg-[#f4f4f0] p-1">{(['Buy', 'Rent', 'Auction'] as Mode[]).map((item) => <button key={item} onClick={() => setMode(item)} className={`whitespace-nowrap rounded-lg px-5 py-3 text-sm font-semibold transition ${mode === item ? 'bg-[#0a486f] text-white shadow-sm' : 'text-[#737b70] hover:text-[#0a486f]'}`}>{item === 'Auction' && <Gavel size={14} className="mr-2 inline" />}{item}</button>)}</div><button onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl bg-[#0a486f] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#07324f]">Search collection</button></div></div></section>

      <section id="marketplace" className="mx-auto max-w-[1440px] px-5 py-24 lg:px-12"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">The AMSI collection</p><h2 className="serif mt-3 text-4xl font-semibold leading-tight tracking-[-0.025em] text-[#062f4a] sm:text-5xl">Selected opportunities</h2></div><a href="#marketplace" className="flex items-center gap-2 text-sm font-bold text-[#0a486f]">View all listings <ChevronRight size={17} /></a></div>{mode === 'Auction' ? <div className="rounded-2xl border border-dashed border-[#bdc8b8] bg-white p-10 text-center"><Gavel className="mx-auto text-[#c29f55]" size={34} /><h3 className="serif mt-4 text-2xl">Live auctions are below</h3><p className="mt-2 text-sm text-[#747d73]">Explore private lots and place your next winning bid.</p><a href="#auctions" className="mt-5 inline-flex rounded-full bg-[#0a486f] px-5 py-3 text-sm font-semibold text-white">View live auctions</a></div> : <div className="mx-auto grid max-w-[1000px] gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredListings.map((item) => <ListingCard key={item.id} item={item} isSaved={favoriteIds.has(item.id)} onFavorite={() => void toggleFavorite(item.id)} />)}</div>}{listingsLoading && <div className="py-12 text-center text-sm text-[#727b70]">Loading current opportunities...</div>}{!listingsLoading && filteredListings.length === 0 && mode !== 'Auction' && <div className="border border-dashed border-[#d4d9d0] p-10 text-center"><Building2 className="mx-auto text-[#0a486f]" size={26} /><h3 className="serif mt-4 text-2xl text-[#173b38]">A new collection is taking shape.</h3><p className="mt-2 text-sm text-[#727b70]">There are no published {mode.toLowerCase()} listings matching this view yet.</p></div>}</section>

      {contentAds.length > 0 && <section aria-label="Sponsored campaign placements" className="mx-auto max-w-[1200px] px-5 pb-12"><div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">{contentAds.map(ad => <div key={ad.id} className={ad.placement === 'wide-post' ? 'md:col-span-2' : ad.placement === 'half-page' ? 'md:row-span-2 md:max-w-[300px]' : ''}><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#8b9389]">Sponsored</p><AdvertisementCreative ad={ad} /></div>)}</div></section>}

      <section id="auctions" className="bg-[#f8f9fa] px-5 py-16 text-[#0a486f] lg:px-12"><div className="mx-auto max-w-[1440px]"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow text-[#0a486f]">The gavel is live</p><h2 className="serif mt-3 text-4xl tracking-tight sm:text-5xl">Private auctions</h2></div><div className="flex items-center gap-2 text-sm text-[#536b7d]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#0a486f]" /> {auctions.length} scheduled lots</div></div><div className="mx-auto grid max-w-[900px] gap-4 lg:grid-cols-2">{auctions.map(auction => <AuctionCard key={auction.id} auction={auction} onBid={() => window.location.assign(`/auctions/${auction.id}`)} />)}{auctions.length === 0 && <div className="border border-dashed border-[#d4d9d0] p-10 text-center lg:col-span-2"><Gavel className="mx-auto text-[#0a486f]" size={26} /><h3 className="serif mt-4 text-2xl text-[#173b38]">No auctions are open yet</h3><p className="mt-2 text-sm text-[#727b70]">New auction lots will appear here when published.</p></div>}</div></div></section>

      <section id="services" className="mx-auto grid max-w-[1440px] gap-12 px-5 py-24 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-12"><div><p className="eyebrow">Beyond the transaction</p><h2 className="serif mt-4 text-5xl leading-tight text-[#0a486f]">A trusted advisor for your next chapter.</h2><p className="mt-6 max-w-xl text-base leading-7 text-[#6e776d]">Some decisions deserve more than a search bar. Our specialists bring local intelligence, discretion and an uncompromising eye to every property, purchase and investment.</p><div className="mt-8 grid max-w-lg gap-4 sm:grid-cols-2"><Value icon={<ShieldCheck size={18} />} title="Vetted opportunities" /><Value icon={<Sparkles size={18} />} title="Intelligent matching" /><Value icon={<Star size={18} />} title="Private guidance" /><Value icon={<TrendingUp size={18} />} title="Market insight" /></div><button onClick={openConsultant} className="mt-10 rounded-full bg-[#0a486f] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#07324f]">Start a private conversation <ArrowUpRight className="ml-2 inline" size={16} /></button></div><div className="relative overflow-hidden rounded-[2rem] bg-[#0a486f] p-5 sm:p-8"><div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-[url('/amsi-consultants.png')] bg-cover bg-center"><div className="absolute inset-0 bg-gradient-to-t from-[#07324fcc] via-transparent" /><div className="absolute bottom-7 left-7 right-7"><p className="text-xs uppercase tracking-[0.2em] text-[#e7cb80]">AMSI intelligence</p><p className="serif mt-2 max-w-md text-3xl text-white">Your ambition, considered from every angle.</p></div></div></div></section>

      <section id="about" className="border-t border-[#dfe2da] bg-white px-5 py-14 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-8 sm:flex-row"><div><p className="eyebrow">In trusted company</p><p className="serif mt-3 text-2xl text-[#0a486f]">Chosen by people who choose well.</p></div><div className="flex flex-wrap items-center justify-center gap-8 text-xl font-semibold tracking-tight text-[#9aa198] sm:gap-12"><span>UMUCYO</span><span>IKAZE</span><span className="serif italic">NOVA</span><span>RIVIERA</span></div></div></section>
      <footer className="bg-[#0a486f] px-5 py-12 text-white lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-10 md:flex-row"><div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 text-white"><Crown size={15} /></span><span className="serif text-xl font-semibold text-white">AMSI <span className="text-white/75">&amp; Co.</span></span></div><p className="mt-4 max-w-xs text-sm leading-6 text-white/50">A considered marketplace for exceptional living, investing and moving forward.</p></div><div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-white/55"><a href="#marketplace" className="hover:text-white">Marketplace</a><a href="#auctions" className="hover:text-white">Auctions</a><a href="#services" className="hover:text-white">Consultancy</a><a href="#about" className="hover:text-white">Our partners</a></div></div><div className="mx-auto mt-12 max-w-[1440px] border-t border-white/10 pt-5 text-xs text-white/60">© 2026 AMSI All rights reserved.</div></footer>

      <button onClick={() => setAdvisorOpen(true)} className="fixed bottom-6 right-6 z-20 flex items-center gap-3 rounded-full bg-white px-5 py-4 text-sm font-bold text-[#0a486f] shadow-xl ring-1 ring-[#0a486f]/15 transition hover:scale-105"><Sparkles size={17} /> Ask our AI advisor</button>
      {notice && <div className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#0a486f] px-5 py-3 text-sm text-white shadow-xl"><Check className="text-[#0a486f]" size={17} /> {notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
      {authOpen && <AccountModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} notice={notice} />}
      {advisorOpen && <AdvisorModal onClose={() => setAdvisorOpen(false)} onConsult={openConsultant} />}
    </main>
  )
}

const adAspectClasses: Record<Advertisement['placement'], string> = {
  'hero-poster': 'aspect-video',
  leaderboard: 'aspect-[728/90]',
  'wide-post': 'aspect-[1200/630]',
  'medium-rectangle': 'aspect-[6/5]',
  'large-rectangle': 'aspect-[6/5]',
  'half-page': 'aspect-[1/2]',
  'mobile-leaderboard': 'aspect-[32/5]',
  'mobile-large-banner': 'aspect-[16/5]',
}

function AdvertisementCreative({ ad, hero = false }: { ad: Ad; hero?: boolean }) {
  const className = hero ? 'absolute inset-0' : `relative w-full ${adAspectClasses[ad.placement]}`
  const contain = ['leaderboard', 'mobile-leaderboard', 'mobile-large-banner'].includes(ad.placement)
  return <div className={`${className} overflow-hidden bg-[#eaf1f4]`}>
    {ad.format === 'youtube' && ad.youtubeUrl ? <iframe src={getYouTubeEmbedUrl(ad.youtubeUrl)} title={ad.title} className="h-full w-full border-0" loading={hero ? 'eager' : 'lazy'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : ad.format === 'video' && ad.asset ? <video src={`/api/media/${ad.asset.id}`} aria-label={ad.title} autoPlay={hero} muted={hero} loop={hero} controls={!hero} playsInline className="h-full w-full object-cover" /> : ad.asset ? <img src={`/api/media/${ad.asset.id}`} alt={ad.title} loading={hero ? 'eager' : 'lazy'} className={`h-full w-full ${contain ? 'object-contain p-2' : 'object-cover'}`} /> : null}
    {ad.linkUrl && ad.format !== 'youtube' && <a href={ad.linkUrl} target="_blank" rel="noreferrer" aria-label={`Visit sponsor: ${ad.title}`} className="absolute inset-0 z-10" />}
  </div>
}

function ListingCard({ item, isSaved, onFavorite }: { item: Listing; isSaved: boolean; onFavorite: () => void }) {
  const lead = item.media[0]
  const location = [item.district, item.sector].filter(Boolean).join(', ')
  return <article className="group overflow-hidden border border-[#e1e3dc] bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(30,45,28,0.13)]"><div className="relative aspect-[4/3] overflow-hidden bg-[#e5e7df]">{lead ? lead.contentType.startsWith('video/') ? <video src={`/api/media/${lead.id}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <img src={`/api/media/${lead.id}`} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Building2 size={32} className="text-[#a2a99f]" /></div>}<div className="absolute left-4 top-4 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#315c50]">{item.category}</div><button type="button" onClick={onFavorite} aria-label={isSaved ? 'Remove saved listing' : 'Save listing'} className="absolute right-4 top-4 z-10 rounded-full bg-white/95 p-2.5 text-[#315c50]"><Heart size={16} fill={isSaved ? '#c55349' : 'none'} className={isSaved ? 'text-[#c55349]' : ''} /></button><Link href={`/listing/${item.slug}`} aria-label={`View ${item.title}`} className="absolute inset-0" /></div><div className="p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#315c50]">{item.purpose}</span><span className="flex items-center gap-1 text-xs text-[#8b9389]"><MapPin size={13} /> {location || item.area}</span></div><h3 className="serif mt-3 text-[1.35rem] font-semibold leading-tight text-[#173b38]"><Link href={`/listing/${item.slug}`} className="hover:text-[#597761]">{item.title}</Link></h3><div className="mt-5 flex items-end justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wide text-[#6d7d75]">{item.purpose === 'For rent' ? 'Rental rate' : item.purpose === 'For auction' ? 'Current offer' : 'Asking price'}</p><p className="mt-1 text-lg font-bold text-[#173b38]">{item.price || 'Price on request'}{item.negotiable ? <span className="ml-1 text-xs font-normal text-[#7e877f]">negotiable</span> : null}</p></div><Link href={`/listing/${item.slug}`} className="flex items-center gap-2 border border-[#aebdb1] px-3 py-2 text-xs font-bold text-[#315c50] transition hover:bg-[#edf1eb]">View <ArrowUpRight size={14} /></Link></div>{item.plotSize > 0 && <p className="mt-3 border-t border-[#e6e8e2] pt-3 text-xs text-[#6f7b72]">{item.plotSize.toLocaleString()} m² <span className="mx-2 text-[#b4baaf]">·</span>{item.zoning || 'Land'}{item.media.length > 0 && <span className="ml-2">· {item.media.length} media</span>}</p>}</div></article>
}
function AuctionCard({ auction, onBid }: { auction: Auction; onBid: () => void }) {
  const lead = auction.media[0]
  const secondsLeft = Math.max(0, Math.floor((Date.parse(auction.endsAt) - Date.now()) / 1000))
  const time = secondsLeft === 0 ? 'Ended' : `${Math.floor(secondsLeft / 3600)}h ${Math.floor(secondsLeft % 3600 / 60)}m left`
  return <article className="grid overflow-hidden border border-[#d9ded7] bg-white text-[#173b38] sm:grid-cols-[.85fr_1.15fr]">{lead ? lead.contentType.startsWith('video/') ? <video src={`/api/media/${lead.id}`} className="h-48 w-full bg-[#e4e6de] object-cover sm:h-full" /> : <img src={`/api/media/${lead.id}`} alt={auction.title} className="h-48 w-full bg-[#e4e6de] object-cover sm:h-full" /> : <div className="grid min-h-40 place-items-center bg-[#e8e9e1]"><Gavel size={28} className="text-[#0a486f]" /></div>}<div className="p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#0a486f]">{auction.category}</span><span className="text-xs text-[#78817a]">{time}</span></div><h3 className="serif mt-3 text-2xl">{auction.title}</h3><p className="mt-1 text-xs text-[#78817a]">{auction.location}</p><div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#e5e7e0] py-3"><div><p className="text-[9px] font-bold uppercase tracking-wider text-[#879087]">Current bid</p><p className="mt-1 text-sm font-bold">RWF {auction.currentBid.toLocaleString()}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wider text-[#879087]">Entry fee</p><p className="mt-1 text-sm font-bold">RWF {auction.entryFee.toLocaleString()}</p></div></div><div className="mt-3 flex items-center justify-between text-xs text-[#78817a]"><span>{auction.bidCount} bids</span><span>Closes {new Date(auction.endsAt).toLocaleString()}</span></div><button onClick={onBid} className="mt-4 w-full bg-[#173b38] py-3 text-sm font-bold text-white">View auction <ArrowUpRight className="ml-2 inline" size={15} /></button></div></article>
}function Value({ icon, title }: { icon: React.ReactNode, title: string }) { return <div className="flex items-center gap-3 text-sm font-semibold text-[#334635]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0f5] text-[#0a486f]">{icon}</span>{title}</div> }
function AdvisorModal({ onClose, onConsult }: { onClose: () => void, onConsult: () => void }) { const [question, setQuestion] = useState(''); const [asked, setAsked] = useState(false); return <div className="modal-backdrop"><div className="modal-card max-w-lg"><button onClick={onClose} className="absolute right-5 top-5 text-[#8b9389]"><X size={20} /></button><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9efe5] text-[#5f8256]"><Sparkles size={20} /></span><div><p className="eyebrow">AMSI intelligence</p><h2 className="serif text-3xl text-[#0a486f]">Ask our AI advisor</h2></div></div>{!asked ? <><p className="mt-5 text-sm leading-6 text-[#687267]">Tell me what you are looking for and I’ll match your priorities with our current collection.</p><textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="field mt-5 min-h-28 resize-none" placeholder="E.g. I need a modern family home in Kigali under RWF 300M..." /><button onClick={() => setAsked(true)} className="mt-4 w-full rounded-full bg-[#0a486f] py-3.5 text-sm font-bold text-white">Find my opportunities <Sparkles className="ml-2 inline" size={15} /></button></> : <div className="mt-6 rounded-xl bg-[#f1f4ef] p-5"><p className="text-sm leading-6 text-[#315d78]">Based on your request, I’d start with <strong>The Olive Residence</strong> and our private collection of Kigali family homes. Both align with your location and lifestyle priorities. I can also connect you with a specialist to refine the shortlist.</p><button onClick={onConsult} className="mt-5 rounded-full bg-[#0a486f] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#0a486f]">Speak with a consultant</button></div>}</div></div> }
