'use client'

import Link from 'next/link'
import { AccountModal } from '@/components/account-modal'
import { AdvisorChat } from '@/components/advisor-chat'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import {
  ArrowUpRight,
  Bell,
  Building2,
  Check,
  ChevronLeft,
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
import { formatListingPrice } from '@/lib/format-listing-price'
import type { AuctionRecord } from '@/lib/auction-types'
import { getYouTubeEmbedUrl, type Advertisement } from '@/lib/advertisement-types'

type Mode = 'All' | 'Buy' | 'Rent' | 'Auction'
type Listing = MarketplaceListing & { id: string }
type Auction = Omit<AuctionRecord, '_id'> & { id: string }
type Ad = Advertisement & { id: string }

const categoryImages: Record<string, string> = {
  All: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=82',
  'Plots / Land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=82',
  Houses: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=82',
  Apartments: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=82',
  'Commercial property': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=700&q=82',
  Vehicles: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=82',
  Equipment: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=700&q=82',
  Other: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=82',
}

export default function Page() {
  const [mode, setMode] = useState<Mode>('All')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [listingError, setListingError] = useState('')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [brand, setBrand] = useState({ siteName: 'AMSI & Co.', logoImage: '' })
  const [ads, setAds] = useState<Ad[]>([])
  const homeRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = homeRef.current
    if (!root) return
    const motion = gsap.matchMedia(root)
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.home-page__hero-kicker', { autoAlpha: 0, y: 12, duration: 0.28 })
          .from('.home-page__hero-title', { autoAlpha: 0, y: 18, duration: 0.42 }, '-=0.08')
          .from('.home-page__hero-copy', { autoAlpha: 0, y: 10, duration: 0.32 }, '-=0.16')
          .from('.home-page__hero-actions', { autoAlpha: 0, y: 8, duration: 0.3 }, '-=0.14')
        gsap.fromTo('.home-page__hero-media', { scale: 1.025 }, { scale: 1, duration: 0.9, ease: 'power2.out' })
      }, root)
      return () => context.revert()
    })
    return () => motion.revert()
  }, [])

  useEffect(() => {
    if (!menuOpen || !homeRef.current) return
    const panel = homeRef.current.querySelector('.home-page__mobile-menu')
    if (!panel) return
    const motion = gsap.matchMedia(homeRef.current)
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const tween = gsap.fromTo(panel, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' })
      return () => tween.kill()
    })
    return () => motion.revert()
  }, [menuOpen])

  useEffect(() => {
    fetch('/api/listings')
      .then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Listings are temporarily unavailable.')
        if (!Array.isArray(result)) throw new Error('The listings response was not valid.')
        setListings(result.map((item: Listing) => ({ ...item, media: Array.isArray(item.media) ? item.media : [] })))
      })
      .catch(error => {
        setListings([])
        setListingError(error instanceof Error ? error.message : 'Listings are temporarily unavailable.')
      })
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

  const searchResults = useMemo(() => listings.filter((item) => {
    const purpose = mode === 'Buy' ? 'For sale' : mode === 'Rent' ? 'For rent' : 'For auction'
    const matchesMode = mode === 'All' || item.purpose === purpose
    const matchesQuery = !query || `${item.title} ${item.district} ${item.sector} ${item.area} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesMode && matchesQuery
  }), [listings, mode, query])
  const categories = useMemo(() => {
    const order = ['Plots / Land', 'Houses', 'Apartments', 'Commercial property', 'Vehicles', 'Equipment', 'Other']
    return Array.from(new Set(listings.map(item => item.category.trim()).filter(Boolean))).sort((left, right) => {
      const leftRank = order.indexOf(left)
      const rightRank = order.indexOf(right)
      return (leftRank < 0 ? order.length : leftRank) - (rightRank < 0 ? order.length : rightRank) || left.localeCompare(right)
    })
  }, [listings])
  const categoryCounts = useMemo(() => new Map([
    ['All', searchResults.length],
    ...categories.map(category => [category, searchResults.filter(item => item.category.trim() === category).length] as [string, number]),
  ]), [categories, searchResults])
  const filteredListings = useMemo(() => selectedCategory === 'All'
    ? searchResults
    : searchResults.filter(item => item.category.trim() === selectedCategory), [searchResults, selectedCategory])
  const listingGroups = useMemo(() => filteredListings.length > 0
    ? [{ category: selectedCategory === 'All' ? 'All opportunities' : selectedCategory, items: filteredListings }]
    : [], [filteredListings, selectedCategory])
  const heroAd = ads.find(ad => ad.placement === 'hero-poster')
  const leaderboardAds = ads.filter(ad => ad.placement === 'leaderboard')
  const mobileBannerAds = ads.filter(ad => ad.placement === 'mobile-leaderboard' || ad.placement === 'mobile-large-banner')
  const contentAds = ads.filter(ad => ['wide-post', 'medium-rectangle', 'large-rectangle', 'half-page'].includes(ad.placement))

  function openConsultant() {
    setAdvisorOpen(true)
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
    <main ref={homeRef} className="home-page min-h-screen bg-[#f8f9fa] text-[#131511]">
      <div className="home-page__banner">RWANDA · EAST AFRICA</div>
      <header className="home-page__header navbar text-white">
        <div className="home-page__nav-inner mx-auto flex max-w-[1440px] items-center justify-between px-5 lg:px-12">
          <a href="#top" className="home-page__brand flex items-center gap-3"><span className="home-page__brand-mark">{brand.logoImage ? <img src={brand.logoImage} alt="" className="h-full w-full object-contain" /> : <Crown size={17} />}</span><span className="serif text-xl tracking-wide text-white">{brand.siteName}</span></a>
          <nav className="home-page__nav-links nav hidden items-center gap-2 lg:flex" aria-label="Main navigation"><a href="#marketplace" className="nav-link home-page__nav-link">Marketplace</a><a href="#auctions" className="nav-link home-page__nav-link">Live auctions</a><a href="#services" className="nav-link home-page__nav-link">Consultancy</a><a href="#about" className="nav-link home-page__nav-link">About us</a></nav>
          <div className="home-page__nav-actions hidden items-center gap-2 lg:flex"><button onClick={openConsultant} className="btn btn-outline-light btn-amsi-nav">Talk to a consultant</button><button onClick={() => setAuthOpen(true)} className="btn btn-light btn-amsi-nav-primary"><UserRound size={15} /> Sign in</button></div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn btn-outline-light home-page__menu-toggle lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}><Menu size={19} /></button>
        </div>
        {menuOpen && <div className="home-page__mobile-menu px-5 py-5 lg:hidden"><nav className="nav flex-column gap-2" aria-label="Mobile navigation"><a href="#marketplace" className="nav-link home-page__nav-link" onClick={() => setMenuOpen(false)}>Marketplace</a><a href="#auctions" className="nav-link home-page__nav-link" onClick={() => setMenuOpen(false)}>Live auctions</a><a href="#services" className="nav-link home-page__nav-link" onClick={() => setMenuOpen(false)}>Consultancy</a><a href="#about" className="nav-link home-page__nav-link" onClick={() => setMenuOpen(false)}>About us</a><button onClick={openConsultant} className="btn btn-light btn-amsi-nav-primary mt-2 w-100"><MessageCircle size={14} /> Talk to a consultant</button><button onClick={() => setAuthOpen(true)} className="btn btn-outline-light btn-amsi-nav mt-2 w-100"><UserRound size={15} /> Sign in</button></nav></div>}
      </header>

      <section id="top" className="home-page__hero">
        {!heroAd && <div className="home-page__hero-media absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=90')] bg-cover bg-center" />}
        {heroAd && <div className="home-page__hero-media absolute inset-0"><AdvertisementCreative ad={heroAd} hero /></div>}
        <div className="home-page__hero-overlay" />
        {heroAd && <span className="home-page__sponsored">Sponsored</span>}
        <div className="home-page__hero-inner">
          <div className="home-page__hero-content">
            <p className="home-page__hero-kicker"><span /> Rwanda's marketplace for what's next</p>
            <h1 className="home-page__hero-title serif">Find your next<br /><em>big move.</em></h1>
            <p className="home-page__hero-copy">Homes, land, vehicles and auctions across Rwanda.</p>
            <div className="home-page__hero-actions">
              <a href="#marketplace" className="btn btn-amsi-gold">Explore listings <ArrowUpRight size={16} /></a>
              <button onClick={openConsultant} className="btn btn-amsi-hero-secondary">Sell with AMSI <ArrowUpRight size={15} /></button>
            </div>
          </div>
          <div className="home-page__hero-index" aria-label="Marketplace categories">
            <span>Properties</span><span>Vehicles</span><span>Auctions</span>
          </div>
        </div>
        <a href="#marketplace" className="home-page__hero-scroll" aria-label="Scroll to the marketplace"><span /> Scroll to explore</a>
      </section>

      {leaderboardAds.length > 0 && <section aria-label="Sponsored leaderboard advertisements" className="mx-auto hidden max-w-[1200px] space-y-3 px-5 py-6 md:block">{leaderboardAds.map(ad => <div key={ad.id}><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#8b9389]">Sponsored</p><AdvertisementCreative ad={ad} /></div>)}</section>}
      {mobileBannerAds.length > 0 && <section aria-label="Sponsored mobile advertisements" className="mx-auto space-y-3 px-5 py-4 md:hidden">{mobileBannerAds.map(ad => <div key={ad.id}><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#8b9389]">Sponsored</p><AdvertisementCreative ad={ad} /></div>)}</section>}

      <SearchPanel mode={mode} setMode={setMode} query={query} setQuery={setQuery} onSearch={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })} />

      <section id="marketplace" className="container-fluid mx-auto max-w-[1440px] px-5 py-14 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="eyebrow">The AMSI collection</p><h2 className="serif mt-2 text-4xl font-semibold leading-tight text-[#062f4a] sm:text-5xl">Find your next opportunity</h2><p className="mt-2 text-sm text-[#68777b]">A handpicked collection of places, vehicles and possibilities.</p></div>
          <a href="#marketplace" onClick={() => setSelectedCategory('All')} className="btn btn-link home-page__view-all">Browse all listings <ChevronRight size={17} /></a>
        </div>
        <div className="market-category-browser">
          <div className="market-category-intro"><div><p className="eyebrow">Explore the collection</p><h3 className="serif">A place for every next move</h3></div><span>{searchResults.length} opportunities</span></div>
          <div className="market-category-grid" role="group" aria-label="Browse listings by category">
            {['All', ...categories].map((category, index) => <button key={category} type="button" aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)} className="market-category-tile" style={{ animationDelay: `${index * 45}ms` }}>
              <span aria-hidden="true" className="market-category-tile__image" style={{ backgroundImage: `url("${categoryImages[category] || categoryImages.Other}")` }} />
              <span className="market-category-tile__top"><span>{category === 'All' ? 'The full collection' : 'Discover'}</span><ArrowUpRight size={17} /></span>
              <span className="market-category-tile__bottom"><span>{category === 'All' ? 'All opportunities' : category}</span><span>{categoryCounts.get(category) ?? 0}</span></span>
            </button>)}
          </div>
        </div>
        {listingGroups.map(group => {
          const railId = `listing-rail-${group.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          return <section key={group.category} className="listing-category-section" aria-label={`${group.category} listings`}>
            <div className="listing-category-heading">
              <div><h3 className="serif">{group.category}</h3><span>{group.items.length} {group.items.length === 1 ? 'opportunity' : 'opportunities'}</span></div>
              <div className="listing-rail-controls">
                <button type="button" className="btn btn-outline-primary listing-rail__control" aria-label={`Scroll ${group.category} listings left`} onClick={() => document.getElementById(railId)?.scrollBy({ left: -360, behavior: 'smooth' })}><ChevronLeft size={17} /></button>
                <button type="button" className="btn btn-outline-primary listing-rail__control" aria-label={`Scroll ${group.category} listings right`} onClick={() => document.getElementById(railId)?.scrollBy({ left: 360, behavior: 'smooth' })}><ChevronRight size={17} /></button>
              </div>
            </div>
            <div id={railId} className="listing-rail" tabIndex={0} aria-label={`${group.category} listings carousel`}>
              {group.items.map(item => <div key={item.id} className="listing-rail__item"><ListingCard item={item} isSaved={favoriteIds.has(item.id)} onFavorite={() => void toggleFavorite(item.id)} /></div>)}
            </div>
          </section>
        })}
        {listingsLoading && <div className="py-12 text-center text-sm text-[#727b70]">Loading current opportunities...</div>}
        {listingError && <div role="alert" className="mt-5 border border-[#e5c8c3] bg-[#fff8f6] px-5 py-4 text-sm text-[#9b4844]">Unable to load the collection: {listingError}</div>}
        {!listingsLoading && !listingError && filteredListings.length === 0 && <div className="border border-dashed border-[#d4d9d0] p-10 text-center"><Building2 className="mx-auto text-[#0a486f]" size={26} /><h3 className="serif mt-4 text-2xl text-[#173b38]">A new collection is taking shape.</h3><p className="mt-2 text-sm text-[#727b70]">There are no published {mode.toLowerCase()} listings matching this view yet.</p></div>}
      </section>

      {contentAds.length > 0 && <section aria-label="Sponsored campaign placements" className="mx-auto max-w-[1200px] px-5 pb-12"><div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">{contentAds.map(ad => <div key={ad.id} className={ad.placement === 'wide-post' ? 'md:col-span-2' : ad.placement === 'half-page' ? 'md:row-span-2 md:max-w-[300px]' : ''}><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#8b9389]">Sponsored</p><AdvertisementCreative ad={ad} /></div>)}</div></section>}

      <section id="auctions" className="auction-section px-5 py-16 lg:px-12"><div className="mx-auto max-w-[1440px]"><div className="auction-section__heading"><div><p className="eyebrow">Private collection</p><h2 className="serif">Auctions worth a closer look</h2><p>Review the lot, terms and timing before you take part.</p></div><div className="auction-section__count"><Gavel size={17} /> <span>{auctions.length} {auctions.length === 1 ? 'lot' : 'lots'} available</span></div></div><div className="auction-grid">{auctions.map(auction => <AuctionCard key={auction.id} auction={auction} />)}{auctions.length === 0 && <div className="auction-section__empty"><span className="auction-section__empty-icon"><Gavel size={23} /></span><h3 className="serif">No auctions are open yet</h3><p>New auction lots will appear here when published.</p></div>}</div></div></section>

      <section id="services" className="home-page__services mx-auto grid max-w-[1440px] gap-12 px-5 py-24 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-12">
        <div className="home-page__services-copy">
          <p className="eyebrow">Personal guidance</p>
          <h2 className="serif mt-4 text-5xl leading-tight text-[#0a486f]">A considered next step, with AMSI.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#6e776d]">Talk through a property, purchase or investment with our team, or get help exploring the collection.</p>
          <div className="mt-8 grid max-w-lg gap-4 sm:grid-cols-2">
            <Value icon={<ShieldCheck size={18} />} title="Vetted opportunities" />
            <Value icon={<Sparkles size={18} />} title="Intelligent matching" />
            <Value icon={<Star size={18} />} title="Private guidance" />
            <Value icon={<TrendingUp size={18} />} title="Market insight" />
          </div>
          <div className="home-page__service-actions">
            <button onClick={openConsultant} className="btn btn-primary btn-amsi-primary">Talk with a consultant <ArrowUpRight size={16} /></button>
            <button onClick={() => setAdvisorOpen(true)} className="btn btn-link home-page__advisor-link"><Sparkles size={16} /> Ask the AMSI assistant</button>
          </div>
        </div>
        <div className="home-page__services-image">
          <div className="home-page__services-image-content">
            <div className="home-page__services-image-shade" />
            <div className="home-page__services-image-caption"><span>AMSI &amp; Co.</span><p className="serif">Local expertise for your next move.</p></div>
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-[#dfe2da] bg-white px-5 py-14 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-8 sm:flex-row"><div><p className="eyebrow">In trusted company</p><p className="serif mt-3 text-2xl text-[#0a486f]">Chosen by people who choose well.</p></div><div className="flex flex-wrap items-center justify-center gap-8 text-xl font-semibold tracking-tight text-[#9aa198] sm:gap-12"><span>UMUCYO</span><span>IKAZE</span><span className="serif italic">NOVA</span><span>RIVIERA</span></div></div></section>
      <footer className="bg-[#0a486f] px-5 py-12 text-white lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-10 md:flex-row"><div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 text-white"><Crown size={15} /></span><span className="serif text-xl font-semibold text-white">AMSI <span className="text-white/75">&amp; Co.</span></span></div><p className="mt-4 max-w-xs text-sm leading-6 text-white/50">A considered marketplace for exceptional living, investing and moving forward.</p></div><div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-white/55"><a href="#marketplace" className="hover:text-white">Marketplace</a><a href="#auctions" className="hover:text-white">Auctions</a><a href="#services" className="hover:text-white">Consultancy</a><a href="#about" className="hover:text-white">Our partners</a></div></div><div className="mx-auto mt-12 max-w-[1440px] border-t border-white/10 pt-5 text-xs text-white/60">© 2026 AMSI All rights reserved.</div></footer>

      {notice && <div role="status" className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#0a486f] px-5 py-3 text-sm text-white shadow-xl"><Check className="text-[#f1d88a]" size={17} /> {notice}<button type="button" className="btn btn-link p-1 text-white" aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={15} /></button></div>}
      {authOpen && <AccountModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} notice={notice} />}
      <AdvisorChat open={advisorOpen} onClose={() => setAdvisorOpen(false)} />
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

function SearchPanel({ mode, setMode, query, setQuery, onSearch }: { mode: Mode; setMode: (mode: Mode) => void; query: string; setQuery: (query: string) => void; onSearch: () => void }) {
  return <form className="listing-search" role="search" onSubmit={event => { event.preventDefault(); onSearch() }}>
    <div className="listing-search__surface">
      <div className="row g-2 align-items-center">
        <div className="col-12 col-xl-5">
          <label className="input-group listing-search__input">
            <span className="input-group-text"><Search size={17} /></span>
            <input aria-label="Search homes, cars, land, opportunities" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search homes, cars, land, opportunities..." className="form-control" />
          </label>
        </div>
        <div className="col-8 col-xl-5">
          <div className="btn-group w-100 listing-search__modes" role="group" aria-label="Listing type">
            {(['All', 'Buy', 'Rent', 'Auction'] as Mode[]).map(item => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={`btn ${mode === item ? 'btn-primary' : 'btn-outline-primary'} listing-search__mode`}>{item === 'Auction' && <Gavel size={13} className="me-1" />}{item}</button>)}
          </div>
        </div>
        <div className="col-4 col-xl-2">
          <button type="submit" className="btn btn-primary listing-search__submit"><Search size={15} className="me-1" /><span className="d-none d-sm-inline">Search collection</span><span className="d-sm-none">Search</span></button>
        </div>
      </div>
    </div>
  </form>
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
  return (
    <article className="card listing-card h-100">
      <figure className="listing-card__media mb-0">
        {lead ? lead.contentType.startsWith('video/')
          ? <video src={`/api/media/${lead.id}`} aria-label={item.title} className="listing-card__image" />
          : <img src={`/api/media/${lead.id}`} alt={item.title} className="listing-card__image" />
          : item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="listing-card__image" /> : <div className="listing-card__empty"><Building2 size={32} /></div>}
        <span className="listing-card__category">{item.isSample ? 'Sample · ' : ''}{item.category}</span>
        <button type="button" onClick={onFavorite} aria-label={isSaved ? 'Remove saved listing' : 'Save listing'} className="btn btn-light listing-card__favorite">
          <Heart size={17} fill={isSaved ? '#c55349' : 'none'} className={isSaved ? 'text-danger' : ''} />
        </button>
        <Link href={`/listing/${item.slug}`} aria-label={`View ${item.title}`} className="listing-card__image-link" />
      </figure>
      <div className="card-body listing-card__body">
        <div className="listing-card__meta d-flex align-items-center justify-content-between gap-2">
          <span className="listing-card__purpose">{item.purpose}</span>
          <span className="listing-card__location"><MapPin size={13} /> {location || item.area}</span>
        </div>
        <h3 className="card-title listing-card__title"><Link href={`/listing/${item.slug}`}>{item.title}</Link></h3>
        <div className="listing-card__footer">
          <div className="min-w-0">
            <p className="listing-card__price-label">{item.purpose === 'For rent' ? 'Rental rate' : item.purpose === 'For auction' ? 'Opening bid' : 'Asking price'}</p>
            <p className="listing-card__price">{item.price ? formatListingPrice(item.price) : 'Price on request'}{item.negotiable ? <span className="ms-1 fw-normal text-secondary">negotiable</span> : null}</p>
          </div>
          <Link href={`/listing/${item.slug}`} className="btn btn-outline-primary listing-card__view">View details <ArrowUpRight size={14} /></Link>
        </div>
        {item.plotSize > 0 && <div className="listing-card__details"><span>{item.plotSize.toLocaleString()} m<sup>2</sup></span><span>{item.zoning || 'Land'}</span>{item.media.length > 0 && <span>{item.media.length} media</span>}</div>}
      </div>
    </article>
  )
}
function AuctionCard({ auction }: { auction: Auction }) {
  const lead = auction.media[0]
  const current = Date.now()
  const start = Date.parse(auction.startsAt)
  const end = Date.parse(auction.endsAt)
  const live = current >= start && current < end
  const ended = current >= end
  const status = ended ? 'Bidding closed' : live ? 'Live now' : 'Upcoming'
  const remaining = Math.max(0, end - current)
  const time = ended
    ? 'Auction ended'
    : live
      ? `${Math.floor(remaining / 3600000)}h ${Math.floor(remaining % 3600000 / 60000)}m remaining`
      : `Opens ${formatAuctionDate(auction.startsAt)}`
  return <article className="auction-card card">
    <div className="auction-card__media">
      {lead ? lead.contentType.startsWith('video/')
        ? <video src={`/api/media/${lead.id}`} aria-label={auction.title} className="auction-card__image" />
        : <img src={`/api/media/${lead.id}`} alt={auction.title} className="auction-card__image" />
        : <div className="auction-card__empty"><Gavel size={30} /></div>}
      <span className={`auction-card__status ${ended ? 'is-ended' : live ? 'is-live' : 'is-upcoming'}`}><span aria-hidden="true" />{status}</span>
      <span className="auction-card__category">{auction.category}</span>
    </div>
    <div className="auction-card__body card-body">
      <div className="auction-card__eyebrow"><span>Private auction</span><span className="auction-card__location"><MapPin size={14} /> {auction.location || 'Location on request'}</span></div>
      <h3 className="auction-card__title card-title">{auction.title}</h3>
      <p className="auction-card__time"><Clock3 size={15} /> {time}</p>
      <div className="auction-card__terms">
        <div><span>{auction.bidCount ? 'Current bid' : 'Opening bid'}</span><strong>RWF {auction.currentBid.toLocaleString()}</strong></div>
        <div><span>Entry fee</span><strong>RWF {auction.entryFee.toLocaleString()}</strong></div>
      </div>
      <div className="auction-card__footer"><span>{auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'}</span><span>Closes {formatAuctionDate(auction.endsAt)}</span></div>
      <Link href={`/auctions/${auction.id}`} className="btn btn-primary btn-amsi-primary auction-card__view">View auction details <ArrowUpRight size={16} /></Link>
    </div>
  </article>
}

function formatAuctionDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function Value({ icon, title }: { icon: React.ReactNode, title: string }) { return <div className="flex items-center gap-3 text-sm font-semibold text-[#334635]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0f5] text-[#0a486f]">{icon}</span>{title}</div> }
