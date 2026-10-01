'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Building2, Check, ChevronLeft, ChevronRight, Heart, MapPin, Share2, X } from 'lucide-react'
import type { MarketplaceListing } from '@/lib/listing-types'
import { formatListingPrice } from '@/lib/format-listing-price'

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

  if (loading) return <main className="listing-detail__state"><div className="listing-detail__loading" role="status"><span className="listing-detail__spinner" aria-hidden="true" /><span>Preparing this opportunity…</span></div></main>
  if (!listing) return <main className="listing-detail"><header className="listing-detail__header"><div className="container-fluid listing-detail__container listing-detail__header-inner"><Link href="/" className="listing-detail__brand">AMSI <span>&amp; Co.</span></Link><Link href="/" className="btn btn-outline-light"><ArrowLeft size={16} /> Marketplace</Link></div></header><div className="container-fluid listing-detail__container py-5"><section className="listing-detail__empty card"><Building2 size={34} /><p className="eyebrow mt-4">Opportunity unavailable</p><h1 className="serif">We couldn't find this listing.</h1><p>{notice || 'It may have been removed or is not published.'}</p><Link href="/" className="btn btn-primary btn-amsi-primary">Browse marketplace <ArrowUpRight size={16} /></Link></section></div></main>

  const facts = [
    ['Category', listing.category],
    ['Listing type', listing.purpose],
    ...(listing.reference ? [['Reference', listing.reference]] : []),
    ...(listing.category === 'Plots / Land' && listing.upi ? [['UPI / land title', listing.upi]] : []),
  ]
  const priceLabel = listing.purpose === 'For rent' ? 'Rental rate' : listing.purpose === 'For auction' ? 'Opening bid' : 'Asking price'
  const displayPrice = listing.price ? formatListingPrice(listing.price) : 'Price on request'
  const description = listing.descriptionEnglish || 'Contact AMSI for more information about this opportunity.'
  const contactHref = `mailto:info@amsi.rw?subject=${encodeURIComponent(`Inquiry: ${listing.title}`)}`

  return <main className="listing-detail" data-sample={listing.isSample ? 'true' : 'false'}>
    <header className="listing-detail__header">
      <div className="container-fluid listing-detail__container listing-detail__header-inner">
        <Link href="/" className="listing-detail__brand">AMSI <span>&amp; Co.</span></Link>
        <div className="listing-detail__header-actions">
          <button type="button" onClick={shareListing} aria-label="Share listing" className="btn btn-outline-light listing-detail__icon-button"><Share2 size={17} /></button>
          <button type="button" onClick={() => setSaved(value => !value)} aria-label={saved ? 'Remove from saved listings' : 'Save listing'} aria-pressed={saved} className={`btn btn-outline-light listing-detail__icon-button ${saved ? 'is-saved' : ''}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
          <Link href="/#marketplace" className="btn btn-outline-light listing-detail__back"><ArrowLeft size={15} /><span>Marketplace</span></Link>
        </div>
      </div>
    </header>

    <div className="container-fluid listing-detail__container listing-detail__main">
      <nav className="listing-detail__breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/#marketplace">Marketplace</Link><span aria-hidden="true">/</span><span>{listing.category}</span></nav>
      <div className="listing-detail__heading">
        <div className="listing-detail__eyebrow"><span>{listing.purpose}</span>{listing.isSample && <span className="listing-detail__sample">Sample listing</span>}</div>
        <h1 className="serif listing-detail__title">{listing.title}</h1>
        <p className="listing-detail__location"><MapPin size={17} /> {location || 'Location on request'}</p>
      </div>

      <div className="row g-4 listing-detail__layout">
        <section className="col-12 col-lg-8 listing-detail__gallery-column order-1" aria-label="Listing photos">
          <div className="listing-detail__gallery">
            {active ? active.contentType.startsWith('video/')
              ? <video key={active.id} src={active.id.startsWith('https://') ? active.id : `/api/media/${active.id}`} controls className="listing-detail__hero-media" />
              : <img src={active.id.startsWith('https://') ? active.id : `/api/media/${active.id}`} alt={`${listing.title}, view ${activeMedia + 1}`} className="listing-detail__hero-media" />
              : <div className="listing-detail__placeholder"><Building2 size={46} /><span>Images for this opportunity are coming soon</span></div>}
            {active && <span className="listing-detail__gallery-category">{listing.category}</span>}
            {media.length === 1 && <span className="listing-detail__gallery-count">01 <span>/</span> 01</span>}
            {media.length > 1 && <>
              <button type="button" aria-label="Previous media" onClick={() => setActiveMedia(index => (index + media.length - 1) % media.length)} className="listing-detail__gallery-arrow listing-detail__gallery-arrow--previous"><ChevronLeft size={20} /></button>
              <button type="button" aria-label="Next media" onClick={() => setActiveMedia(index => (index + 1) % media.length)} className="listing-detail__gallery-arrow listing-detail__gallery-arrow--next"><ChevronRight size={20} /></button>
              <span className="listing-detail__gallery-count">{String(activeMedia + 1).padStart(2, '0')} <span>/</span> {String(media.length).padStart(2, '0')}</span>
            </>}
          </div>
          {media.length > 1 && <div className="listing-detail__thumbnails" aria-label="Listing media">{media.map((item, index) => <button key={item.id} type="button" onClick={() => setActiveMedia(index)} aria-label={`Show photo ${index + 1}`} aria-pressed={activeMedia === index} className="listing-detail__thumbnail">{item.contentType.startsWith('video/') ? <video src={item.id.startsWith('https://') ? item.id : `/api/media/${item.id}`} /> : <img src={item.id.startsWith('https://') ? item.id : `/api/media/${item.id}`} alt="" />}</button>)}</div>}
        </section>

        <aside className="col-12 col-lg-4 listing-detail__sidebar order-2">
          <div className="listing-detail__offer card">
            <div className="listing-detail__offer-status"><span /> {listing.isSample ? 'Sample opportunity' : 'Available opportunity'}</div>
            <div className="listing-detail__offer-price"><p className="listing-detail__price-label">{priceLabel}</p><p className="listing-detail__price">{displayPrice}</p>{listing.negotiable && <span className="listing-detail__negotiable">Negotiable</span>}</div>
            <a href={contactHref} className="btn btn-primary btn-amsi-primary listing-detail__primary"><span>Request information</span><ArrowUpRight size={17} /></a>
            <div className="listing-detail__sidefacts">
              <div><span><MapPin size={14} /> Location</span><strong>{location || 'On request'}</strong></div>
              {listing.plotSize > 0 && <div><span>Plot size</span><strong>{listing.plotSize.toLocaleString()} m²</strong></div>}
              {listing.zoning && <div><span>Land use</span><strong>{listing.zoning}</strong></div>}
            </div>
            <p className="listing-detail__assurance"><Check size={15} /> Private, no-obligation enquiry</p>
          </div>
        </aside>

        <section className="col-12 listing-detail__supporting order-3">
          <section className="listing-detail__about">
            <div className="listing-detail__section-heading"><span>01</span><div><p className="eyebrow">Description</p><h2>About this listing</h2></div></div>
            <div className="listing-detail__about-copy"><p>{description}</p>{!listing.isSample && listing.descriptionKinyarwanda && <div className="listing-detail__kinyarwanda"><h3 className="serif">Ibisobanuro</h3><p>{listing.descriptionKinyarwanda}</p></div>}</div>
            {listing.features.length > 0 && <div className="listing-detail__features"><h3 className="serif">Highlights</h3><div className="row g-2">{listing.features.map(feature => <div key={feature} className="col-12 col-sm-6"><span><Check size={15} /> {feature}</span></div>)}</div></div>}
          </section>

          <section className="listing-detail__specs" aria-label="Listing specifications">
            <div className="listing-detail__section-heading"><span>02</span><div><p className="eyebrow">Specifications</p><h2>Listing details</h2></div></div>
            <div className="row row-cols-2 row-cols-md-3 g-3">{facts.map(([label, value]) => <div className="col" key={label}><Fact label={label} value={value} /></div>)}</div>
          </section>
        </section>

      </div>
    </div>
    {notice && <div role="status" className="listing-detail__notice"><Check size={16} /> {notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15} /></button></div>}
  </main>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="listing-detail__fact"><span>{label}</span><strong>{value}</strong></div>
}