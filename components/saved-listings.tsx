'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Building2, Heart, MapPin } from 'lucide-react'
import type { MarketplaceListing } from '@/lib/listing-types'

type Listing = MarketplaceListing & { id: string }

export function SavedListings({ compact = false, onViewAll }: { compact?: boolean; onViewAll?: () => void }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadFavorites() {
    try {
      const response = await fetch('/api/users/favorites')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load saved listings.')
      setListings(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load saved listings.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadFavorites() }, [])

  if (loading) return <p className="mt-8 text-sm text-[#718595]">Loading saved listings...</p>
  const visible = compact ? listings.slice(0, 3) : listings
  return <section className={compact ? 'mt-4 space-y-3' : 'mt-8 border border-[#d8e1e8] bg-white p-5 sm:p-7'}>{!compact && <div className="flex items-center justify-between border-b border-[#e3ebf0] pb-5"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#6f8493]">Your collection</p><h2 className="serif mt-2 text-3xl text-[#173b38]">Saved listings</h2></div><span className="text-sm text-[#718595]">{listings.length} saved</span></div>}{error && <p role="alert" className="mt-4 text-sm text-[#a64f53]">{error}</p>}{visible.length === 0 ? <div className="py-10 text-center"><Heart size={24} className="mx-auto text-[#0a486f]" /><h3 className="serif mt-3 text-2xl text-[#173b38]">No saved listings yet</h3><p className="mt-2 text-sm text-[#718595]">Save an opportunity from the marketplace to keep it here.</p><Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#315c50]">Explore listings <ArrowUpRight size={15} /></Link></div> : <div className={compact ? 'space-y-3' : 'mt-4 divide-y divide-[#e3ebf0]'}>{visible.map(item => { const lead = item.media[0]; const location = [item.district, item.sector].filter(Boolean).join(' · '); return <article key={item.id} className={compact ? 'flex gap-4 border border-[#e3ebf0] p-3' : 'flex gap-4 py-4'}><div className="grid h-20 w-24 shrink-0 place-items-center overflow-hidden bg-[#e8e9e1] sm:h-24 sm:w-32">{lead ? lead.contentType.startsWith('video/') ? <video src={`/api/media/${lead.id}`} className="h-full w-full object-cover" /> : <img src={`/api/media/${lead.id}`} alt={item.title} className="h-full w-full object-cover" /> : <Building2 size={23} className="text-[#0a486f]" />}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-[#0a486f]">{item.purpose} · {item.category}</p><Link href={`/listing/${item.slug}`} className="serif mt-1 block truncate text-xl text-[#173b38]">{item.title}</Link><p className="mt-1 flex items-center gap-1 text-xs text-[#718595]"><MapPin size={12} />{location || item.area}</p><p className="mt-2 text-sm font-bold text-[#315c50]">{item.price || 'Price on request'}</p></div></article>})}</div>}{compact && listings.length > 3 && onViewAll && <button onClick={onViewAll} className="text-sm font-semibold text-[#315c50]">View all {listings.length} saved listings</button>}</section>
}
