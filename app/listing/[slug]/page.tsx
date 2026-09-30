'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Building2, Check, ChevronLeft, ChevronRight, Heart, MapPin, Share2, X } from 'lucide-react'
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

  if (loading) return <main className="listing-detail__state"><span className="listing-detail__spinner" role="status"><span className="visually-hidden">Loading opportunity...</span></span></main>
  if (!listing) return <main className="listing-detail"><div className="container-fluid listing-detail__container py-5"><Link href="/" className="listing-detail__back"><ArrowLeft size={16} /> Marketplace</Link><section className="listing-detail__empty"><Building2 size={34} /><p className="eyebrow mt-4">Opportunity unavailable</p><h1 className="serif">We couldn't find this listing.</h1><p>{notice || 'It may have been removed or is not published.'}</p><Link href="/" className="listing-detail__primary">Browse marketplace <ArrowUpRight size={16} /></Link></section></div></main>

  const facts = [
    ['Category', listing.category],
    ['Listing type', listing.purpose],
    ...(listing.reference ? [['Reference', listing.reference]] : []),
    ...(listing.category === 'Plots / Land' && listing.upi ? [['UPI / land title', listing.upi]] : []),
  ]
  const priceLabel = listing.purpose === 'For rent' ? 'Rental rate' : listing.purpose === 'For auction' ? 'Opening bid' : 'Asking price'
  const description = listing.descriptionEnglish || 'Contact AMSI for more information about this opportunity.'
  const contactHref = `mailto:info@amsi.rw?subject=${encodeURIComponent(`Inquiry: ${listing.title}`)}`

  return <main className="listing-detail" data-sample={listing.isSample ? 'true' : 'false'}>
    <header className="listing-detail__header">
      <div className="container-fluid listing-detail__container d-flex align-items-center justify-content-between">
        <Link href="/" className="listing-detail__brand">AMSI <span>&amp; Co.</span></Link>
        <div className="d-flex align-items-center gap-2">
          <button type="button" onClick={shareListing} aria-label="Share listing" className="listing-detail__icon-button"><Share2 size={17} /></button>
          <button type="button" onClick={() => setSaved(value => !value)} aria-label={saved ? 'Remove from saved listings' : 'Save listing'} className={`listing-detail__icon-button ${saved ? 'is-saved' : ''}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
          <Link href="/" className="listing-detail__back"><ArrowLeft size={15} /><span>Marketplace</span></Link>
        </div>
      </div>
    </header>

    <div className="container-fluid listing-detail__container listing-detail__main">
      <div className="listing-detail__eyebrow"><span>{listing.category}</span><span aria-hidden="true">/</span><span>{listing.purpose}</span>{listing.isSample && <span className="listing-detail__sample">Sample</span>}</div>
      <div className="row align-items-end gy-2 mb-3">
        <div className="col-12 col-md"><h1 className="serif listing-detail__title">{listing.title}</h1><p className="listing-detail__location"><MapPin size={16} /> {location || 'Location on request'}</p></div>
        <div className="col-12 col-md-auto"><span className="listing-detail__reference">REF {listing.reference || 'ON REQUEST'}</span></div>
      </div>

      <div className="row g-3">
        <section className="col-12 col-lg-8" aria-label="Listing photos">
          <div className="listing-detail__gallery">
            {active ? active.contentType.startsWith('video/')
              ? <video key={active.id} src={active.id.startsWith('https://') ? active.id : `/api/media/${active.id}`} controls className="listing-detail__hero-media" />
              : <img src={active.id.startsWith('https://') ? active.id : `/api/media/${active.id}`} alt={`${listing.title}, view ${activeMedia + 1}`} className="listing-detail__hero-media" />
              : <div className="listing-detail__placeholder"><Building2 size={46} /><span>Images for this opportunity are coming soon</span></div>}
            {media.length > 1 && <>
              <button aria-label="Previous media" onClick={() => setActiveMedia(index => (index + media.length - 1) % media.length)} className="listing-detail__gallery-arrow listing-detail__gallery-arrow--previous"><ChevronLeft size={20} /></button>
              <button aria-label="Next media" onClick={() => setActiveMedia(index => (index + 1) % media.length)} className="listing-detail__gallery-arrow listing-detail__gallery-arrow--next"><ChevronRight size={20} /></button>
              <span className="listing-detail__gallery-count">{activeMedia + 1} / {media.length}</span>
            </>}
          </div>
          {media.length > 1 && <div className="listing-detail__thumbnails">{media.map((item, index) => <button key={item.id} type="button" onClick={() => setActiveMedia(index)} aria-label={`Show photo ${index + 1}`} aria-pressed={activeMedia === index} className="listing-detail__thumbnail">{item.contentType.startsWith('video/') ? <video src={item.id.startsWith('https://') ? item.id : `/api/media/${item.id}`} /> : <img src={item.id.startsWith('https://') ? item.id : `/api/media/${item.id}`} alt="" />}</button>)}</div>}
        </section>

        <aside className="col-12 col-lg-4">
          <div className="listing-detail__offer">
            <div className="listing-detail__offer-status"><span /> {listing.isSample ? 'Sample listing' : 'Available opportunity'}</div>
            <p className="listing-detail__price-label">{priceLabel}</p>
            <p className="listing-detail__price">{listing.price || 'Price on request'}</p>
            {listing.negotiable && <span className="listing-detail__negotiable">Negotiable</span>}
            <a href={contactHref} className="btn listing-detail__primary"><span>Request information</span><ArrowUpRight size={17} /></a>
          </div>
          <div className="listing-detail__sidefacts">
            <div><span>Location</span><strong>{location || 'On request'}</strong></div>
            {listing.plotSize > 0 && <div><span>Plot size</span><strong>{listing.plotSize.toLocaleString()} m²</strong></div>}
            {listing.zoning && <div><span>Land use</span><strong>{listing.zoning}</strong></div>}
          </div>
        </aside>
      </div>

      <section className="listing-detail__about">
        <p className="eyebrow">Description</p>
        <h2 className="serif">About this listing</h2>
        <div className="listing-detail__about-copy"><p>{description}</p>{!listing.isSample && listing.descriptionKinyarwanda && <div className="listing-detail__kinyarwanda"><h3 className="serif">Ibisobanuro</h3><p>{listing.descriptionKinyarwanda}</p></div>}</div>
        {listing.features.length > 0 && <div className="listing-detail__features"><h3 className="serif">Highlights</h3><div className="row g-2">{listing.features.map(feature => <div key={feature} className="col-12 col-sm-6"><span><Check size={15} /> {feature}</span></div>)}</div></div>}
      </section>

      <section className="listing-detail__specs" aria-label="Listing specifications">
        <div className="listing-detail__specs-heading"><p className="eyebrow">Specifications</p><h2 className="serif">Listing details</h2></div>
        <div className="row row-cols-2 row-cols-md-3 row-cols-xl-5 g-3">{facts.map(([label, value]) => <div className="col" key={label}><Fact label={label} value={value} /></div>)}</div>
      </section>
    </div>
    {notice && <div role="status" className="listing-detail__notice"><Check size={16} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15} /></button></div>}
  </main>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="listing-detail__fact"><span>{label}</span><strong>{value}</strong></div>
}