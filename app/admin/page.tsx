'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, Building2, Check, ChevronRight, CircleDollarSign, FilePlus2, Gavel, LayoutDashboard, LogOut, MapPin, Megaphone, MessageCircle, Pencil, Plus, Search, ShieldCheck, Settings, Trash2, Upload, UserRound, Users, X } from 'lucide-react'
import type { ListingMedia, MarketplaceListing } from '@/lib/listing-types'
import type { ContactRequest } from '@/lib/contact-request'
import type { AuctionRecord } from '@/lib/auction-types'
import { AdminAuctionManager } from '@/components/admin-auction-manager'
import { AdminUsersManager } from '@/components/admin-users-manager'
import { AdminSettingsForm } from '@/components/admin-settings-form'
import { AdminAdsManager } from '@/components/admin-ads-manager'

type Listing = MarketplaceListing & { id: string }
type Auction = Omit<AuctionRecord, '_id'> & { id: string }
type View = 'Overview' | 'Inventory' | 'Auctions' | 'Ads' | 'Messages' | 'Consultancy' | 'Users' | 'Settings'
type AdminProfile = { siteName: string; logoImage: string; adminName: string; adminImage: string }

const categories = ['Plots / Land', 'Houses', 'Apartments', 'Commercial property', 'Vehicles', 'Equipment', 'Other']
const plotFeatures = ['Land title (UPI)', 'Water on site', 'Electricity on site', 'Near main road', 'Paved road access', 'Existing structure', 'Near market']
const adminNavigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Inventory', icon: Building2 },
  { label: 'Auctions', icon: Gavel },
  { label: 'Ads', icon: Megaphone },
  { label: 'Messages', icon: MessageCircle },
  { label: 'Consultancy', icon: Users },
  { label: 'Users', icon: UserRound },
  { label: 'Settings', icon: Settings },
] as const

export default function AdminDashboard() {
  const [view, setView] = useState<View>('Overview')
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [databaseStatus, setDatabaseStatus] = useState('Not checked')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [auctionFormOpen, setAuctionFormOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [adminProfile, setAdminProfile] = useState<AdminProfile>({ siteName: 'AMSI & Co.', logoImage: '', adminName: 'Administrator', adminImage: '' })

  useEffect(() => {
    fetch('/api/admin/session')
      .then(response => response.json())
      .then(result => {
        if (!result.authenticated) {
          window.location.replace('/?signin=1')
          return
        }
        setAuthenticated(true)
        void loadListings()
        void loadAuctions()
        fetch('/api/admin/settings').then(response => response.ok ? response.json() : null).then(settings => { if (settings) setAdminProfile(current => ({ ...current, ...settings })) }).catch(() => undefined)
      })
      .catch(() => setError('Unable to check the administrator session.'))
      .finally(() => setChecking(false))
  }, [])

  async function loadListings() {
    setDatabaseStatus('Connecting')
    const response = await fetch('/api/listings')
    const result = await response.json()
    if (!response.ok) {
      setDatabaseStatus('Unavailable')
      throw new Error(result.error || 'Unable to load listings.')
    }
    setDatabaseStatus('Connected')
    setListings(result)
  }

  async function loadAuctions() {
    const response = await fetch('/api/auctions')
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unable to load auctions.')
    setAuctions(result)
  }

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuthenticated(false)
    window.location.assign('/')
  }

  async function updateRequest(requestId: string, status: 'in_progress' | 'resolved') {
    const response = await fetch(`/api/admin/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await response.json()
    if (!response.ok) { setRequestError(result.error || 'Unable to update request.'); return }
    setRequests(current => current.map(item => item.id === requestId ? { ...item, status } : item))
  }

  async function deleteRequest(requestId: string) {
    if (!window.confirm('Delete this request permanently?')) return
    const response = await fetch(`/api/admin/requests/${requestId}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) { setRequestError(result.error || 'Unable to delete request.'); return }
    setRequests(current => current.filter(item => item.id !== requestId))
    setNotice('Request deleted.')
  }

  useEffect(() => {
    if (!authenticated || (view !== 'Messages' && view !== 'Consultancy')) return
    const kind = view === 'Messages' ? 'message' : 'consultancy'
    setRequestLoading(true)
    setRequestError('')
    fetch(`/api/admin/requests?kind=${kind}`)
      .then(async response => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load requests.')
        setRequests(result)
      })
      .catch(error => setRequestError(error instanceof Error ? error.message : 'Unable to load requests.'))
      .finally(() => setRequestLoading(false))
  }, [authenticated, view])

  async function publishListing(listing: MarketplaceListing, files: File[], listingId?: string) {
    const uploadedMedia: ListingMedia[] = [...(editingListing?.media || [])]
    for (const file of files) {
      const body = new FormData()
      body.set('file', file)
      const upload = await fetch('/api/media', { method: 'POST', body })
      const uploaded = await upload.json()
      if (!upload.ok) throw new Error(uploaded.error || `Unable to upload ${file.name}.`)
      uploadedMedia.push(uploaded)
    }

    const response = await fetch(listingId ? `/api/listings/${listingId}` : '/api/listings', {
      method: listingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...listing, media: uploadedMedia }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || (listingId ? 'Unable to update listing.' : 'Unable to publish listing.'))
    setListings(current => listingId ? current.map(item => item.id === listingId ? result : item) : [result, ...current])
    setFormOpen(false)
    setEditingListing(null)
    setNotice(listingId ? 'Listing updated.' : 'Listing published and visible to all visitors.')
    setTimeout(() => setNotice(''), 3500)
  }

  async function deleteListing(item: Listing) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    const response = await fetch(`/api/listings/${item.id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to delete listing.'); return }
    setListings(current => current.filter(listing => listing.id !== item.id))
    setNotice('Listing deleted.')
  }

  async function createAuction(auction: Omit<AuctionRecord, '_id' | 'currentBid' | 'bidCount' | 'createdAt'>, files: File[], auctionId?: string) {
    const uploadedMedia: ListingMedia[] = [...auction.media]
    for (const file of files) {
      const body = new FormData()
      body.set('file', file)
      const upload = await fetch('/api/media', { method: 'POST', body })
      const uploaded = await upload.json()
      if (!upload.ok) throw new Error(uploaded.error || `Unable to upload ${file.name}.`)
      uploadedMedia.push(uploaded)
    }
    const response = await fetch(auctionId ? `/api/auctions/${auctionId}` : '/api/auctions', {
      method: auctionId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...auction, media: uploadedMedia }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || (auctionId ? 'Unable to update auction.' : 'Unable to create auction.'))
    setAuctions(current => auctionId ? current.map(item => item.id === auctionId ? result : item) : [result, ...current])
    setAuctionFormOpen(false)
    setNotice(auctionId ? 'Auction updated.' : 'Auction created.')
  }

  async function deleteAuction(auction: Auction) {
    if (!window.confirm(`Delete “${auction.title}” and its bid and entry history? This cannot be undone.`)) return
    const response = await fetch(`/api/auctions/${auction.id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to delete auction.'); return }
    setAuctions(current => current.filter(item => item.id !== auction.id))
    setNotice('Auction and related activity deleted.')
  }

  if (checking) return <main className="grid min-h-screen place-items-center bg-[#f3f4f0] text-[#173b38]">Checking secure administrator access...</main>

  if (!authenticated) return <main className="grid min-h-screen place-items-center bg-[#f8f9fa] text-[#173b38]">Opening the shared sign-in... <a href="/?signin=1" className="mt-3 font-semibold text-[#0a486f] underline">Continue to sign in</a></main>

  const visibleListings = listings.filter(item => `${item.title} ${item.district} ${item.sector} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
  return <main data-dashboard="admin" className="min-h-screen bg-[#f8f9fa] text-[#17211f]">
    <header className="border-b border-[#124661] bg-[#062f4a] text-white shadow-sm"><div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 lg:px-10"><a href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center overflow-hidden rounded-full border border-white/50 bg-white/10 text-sm font-bold text-[#e8d5a7]">{adminProfile.logoImage ? <img src={adminProfile.logoImage} alt="" className="h-full w-full object-contain" /> : 'A'}</span><span className="text-sm font-semibold tracking-[.08em] text-white">{adminProfile.siteName}<span className="ml-2 text-[10px] font-medium tracking-[.16em] text-white/55">OPERATIONS</span></span></a><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-white">{adminProfile.adminName}</p><p className="text-[10px] font-medium uppercase tracking-[.14em] text-white/55">Operations account</p></div>{adminProfile.adminImage ? <img src={adminProfile.adminImage} alt="Administrator" className="size-10 rounded-full border border-white/40 object-cover" /> : <span className="grid size-10 place-items-center rounded-full bg-[#c29f55] text-xs font-bold text-[#062f4a]">{adminProfile.adminName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span>}<button onClick={signOut} title="Sign out" aria-label="Sign out" className="ml-2 border-l border-white/15 pl-4 text-white/65 transition hover:text-white"><LogOut size={17} /></button></div></div></header>
    <div className="container-fluid admin-layout py-4"><div className="row g-4">
      <aside className="col-12 col-lg-3 col-xl-2 flex flex-col overflow-hidden rounded-sm bg-[#062f4a] p-4 text-white shadow-[0_14px_35px_rgba(6,47,74,.12)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]"><div className="mb-4 border-b border-white/15 px-3 pb-4"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c29f55]">Workspace</p><p className="mt-1 text-xs text-white/50">Manage listings, accounts and sponsors.</p></div><nav className="admin-nav-scroll min-h-0 max-h-[55vh] flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 lg:max-h-none" aria-label="Admin sections">{adminNavigation.map(({ label, icon: Icon }) => <button key={label} onClick={() => setView(label)} className={`group flex min-h-11 w-full items-center gap-3 border-l-2 px-3 text-left text-[13px] font-medium transition ${view === label ? 'border-[#c29f55] bg-white/10 text-white' : 'border-transparent text-white/65 hover:bg-white/5 hover:text-white'}`}><Icon size={17} className={view === label ? 'text-[#e8d5a7]' : 'text-white/45 group-hover:text-white/80'} />{label === 'Inventory' ? 'Listings & inventory' : label === 'Messages' ? 'User messages' : label === 'Consultancy' ? 'Consultancy requests' : label}<span className="ml-auto text-[10px] tabular-nums text-white/40">{label === 'Inventory' ? listings.length : ''}</span></button>)}</nav><div className="mt-4 flex shrink-0 items-center gap-3 border-t border-white/15 px-3 pt-4"><span className={`size-2 rounded-full ${databaseStatus === 'Connected' ? 'bg-[#b7d9a7]' : databaseStatus === 'Unavailable' ? 'bg-[#e59a87]' : 'bg-[#c29f55]'}`} /><div><p className="text-xs font-semibold text-white">Database</p><p className="text-[10px] text-white/50">{databaseStatus}</p></div></div></aside>
      <section className="col-12 col-lg-9 col-xl-10 min-w-0"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">AMSI / Administration</p><h1 className="serif mt-2 text-4xl text-[#173b38] sm:text-5xl">{view === 'Overview' ? 'Good morning.' : view === 'Auctions' ? 'Auction room.' : view === 'Ads' ? 'Sponsor placements.' : view === 'Messages' ? 'User messages.' : view === 'Consultancy' ? 'Consultancy requests.' : view === 'Users' ? 'Member accounts.' : view === 'Settings' ? 'Platform settings.' : 'Your inventory.'}</h1><p className="mt-3 text-sm text-[#78817a]">{view === 'Overview' ? 'A clear view of the opportunities you manage.' : view === 'Users' ? 'Manage member access and account status.' : view === 'Ads' ? 'Publish sponsor logos, visual campaigns and video.' : view === 'Settings' ? 'Tune the public brand and administrator profile.' : 'Create and maintain the opportunities people come here to find.'}</p></div>{(view === 'Overview' || view === 'Inventory' || view === 'Auctions') && <button onClick={() => view === 'Auctions' ? setAuctionFormOpen(true) : setFormOpen(true)} className="flex items-center gap-2 bg-[#0a486f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#07324f]"><Plus size={17} /> {view === 'Auctions' ? 'Create auction' : 'Add listing'}</button>}</div>
        {error && <div role="alert" className="mb-5 border border-[#e4c7c2] bg-[#fff7f5] px-4 py-3 text-sm text-[#a64f53]">{error}</div>}
        {view === 'Users' && <AdminUsersManager onNotice={setNotice} />}
        {view === 'Ads' && <AdminAdsManager onNotice={setNotice} />}
        {view === 'Settings' && <AdminSettingsForm onSaved={settings => setAdminProfile(current => ({ ...current, ...settings }))} />}
        {view === 'Auctions' && <AdminAuctionManager auctions={auctions} formOpen={auctionFormOpen} setFormOpen={setAuctionFormOpen} onCreate={createAuction} onDelete={auction => void deleteAuction(auction)} />}
        {(view === 'Overview' || view === 'Inventory' || view === 'Auctions') && <div className="grid gap-3 sm:grid-cols-3"><Summary icon={<Building2 size={18} />} value={String(listings.length)} label="Published listings" /><Summary icon={<MapPin size={18} />} value={String(listings.filter(item => item.category.toLowerCase().includes('plot')).length)} label="Plots & land" /><Summary icon={<ShieldCheck size={18} />} value={databaseStatus} label="Database connection" /></div>}
        {view === 'Overview' && <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_.8fr]"><section className="border border-[#d9ded7] bg-white p-6 sm:p-8"><p className="eyebrow">Marketplace inventory</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><h2 className="serif text-3xl text-[#173b38]">Recently published</h2><button onClick={() => setView('Inventory')} className="flex items-center gap-2 text-sm font-semibold text-[#315c50]">Manage inventory <ChevronRight size={15} /></button></div><div className="mt-6 divide-y divide-[#e5e8e1]">{listings.slice(0, 4).map(item => <ListingRow key={item.id} item={item} onEdit={() => { setEditingListing(item); setFormOpen(true) }} onDelete={() => void deleteListing(item)} />)}{listings.length === 0 && <EmptyInventory onAdd={() => setFormOpen(true)} />}</div></section><aside className="flex flex-col justify-between bg-[#173b38] p-7 text-white sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#e8d5a7]">Your next step</p><h2 className="serif mt-4 text-3xl leading-tight">Bring your first opportunity to life.</h2><p className="mt-4 text-sm leading-6 text-white/65">Create a detailed listing with its location, land use, documentation and a complete media gallery.</p></div><button onClick={() => setFormOpen(true)} className="mt-10 flex items-center justify-between border-t border-white/20 pt-5 text-left text-sm font-semibold">Create a listing <FilePlus2 size={18} className="text-[#e8d5a7]" /></button></aside></div>}
        {view === 'Inventory' && <section className="mt-8 border border-[#d9ded7] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e3e6e0] pb-5"><div><p className="eyebrow">Live marketplace records</p><h2 className="serif mt-2 text-3xl text-[#173b38]">Listings & inventory</h2></div><label className="flex min-w-[220px] items-center gap-2 border border-[#d9ded7] px-3 py-2"><Search size={16} className="text-[#819087]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search inventory" className="min-w-0 bg-transparent text-sm outline-none" /></label></div><div className="mt-3 divide-y divide-[#e5e8e1]">{visibleListings.map(item => <ListingRow key={item.id} item={item} onEdit={() => { setEditingListing(item); setFormOpen(true) }} onDelete={() => void deleteListing(item)} />)}{visibleListings.length === 0 && <EmptyInventory onAdd={() => setFormOpen(true)} />}</div></section>}
        {(view === 'Messages' || view === 'Consultancy') && <section className="mt-8 border border-[#d9ded7] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e3e6e0] pb-5"><div><p className="eyebrow">Client communications</p><h2 className="serif mt-2 text-3xl text-[#173b38]">{view === 'Messages' ? 'User messages' : 'Consultancy requests'}</h2><p className="mt-2 text-sm text-[#78817a]">Contact details and messages submitted through the member dashboard.</p></div><span className="text-sm text-[#78817a]">{requests.length} requests</span></div>{requestError && <p role="alert" className="mt-5 bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{requestError}</p>}{requestLoading ? <p className="py-12 text-center text-sm text-[#78817a]">Loading requests...</p> : requests.length === 0 ? <div className="py-14 text-center"><MessageCircle size={24} className="mx-auto text-[#0a486f]" /><h3 className="serif mt-4 text-2xl text-[#173b38]">No requests yet</h3><p className="mt-2 text-sm text-[#78817a]">New {view === 'Messages' ? 'messages' : 'consultancy requests'} will appear here.</p></div> : <div className="mt-3 divide-y divide-[#e5e8e1]">{requests.map(item => <article key={item.id} className="grid gap-5 py-5 lg:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-3"><h3 className="serif text-xl text-[#173b38]">{item.fullName}</h3><span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.status === 'resolved' ? 'bg-[#e9eee8] text-[#4c6a52]' : item.status === 'in_progress' ? 'bg-[#f3eddf] text-[#8b7040]' : 'bg-[#f5e9e4] text-[#a35b47]'}`}>{item.status.replace('_', ' ')}</span></div><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#68756c]"><a href={`tel:${item.phone}`} className="font-semibold text-[#315c50]">{item.phone}</a><a href={`mailto:${item.email}`} className="hover:text-[#315c50]">{item.email}</a><time>{new Date(item.createdAt).toLocaleString()}</time></div>{(item.topic || item.preferredTime) && <p className="mt-3 text-xs font-semibold text-[#0a486f]">{[item.topic, item.preferredTime && `Preferred time: ${item.preferredTime}`].filter(Boolean).join(' · ')}</p>}<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#48594e]">{item.message}</p></div><div className="flex items-center gap-2 lg:self-start"><button onClick={() => void updateRequest(item.id, 'in_progress')} disabled={item.status === 'in_progress' || item.status === 'resolved'} className="border border-[#d9ded7] px-3 py-2 text-xs font-semibold text-[#52625b] disabled:opacity-40">In progress</button><button onClick={() => void updateRequest(item.id, 'resolved')} disabled={item.status === 'resolved'} className="bg-[#0a486f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Resolve</button><button onClick={() => void deleteRequest(item.id)} aria-label="Delete request" title="Delete request" className="p-2 text-[#a64f53] hover:bg-[#fff2ef]"><Trash2 size={16} /></button></div></article>)}</div>}</section>}
      </section>
    </div></div>
    {formOpen && <ListingForm listing={editingListing || undefined} onClose={() => { setFormOpen(false); setEditingListing(null) }} onPublish={publishListing} />}
    {notice && <div role="status" className="fixed bottom-5 right-5 z-40 flex max-w-sm items-center gap-3 bg-[#173b38] px-5 py-4 text-sm text-white shadow-xl"><Check size={17} className="shrink-0 text-[#e8d5a7]" />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15} /></button></div>}
  </main>
}

function Summary({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="admin-stat"><span className="admin-stat-icon">{icon}</span><p className="admin-stat-value">{value}</p><p className="admin-stat-label">{label}</p></div>
}

function ListingRow({ item, onEdit, onDelete }: { item: Listing; onEdit?: () => void; onDelete?: () => void }) {
  const lead = item.media[0]
  return <article className="flex gap-4 py-4"><div className="h-20 w-28 shrink-0 overflow-hidden bg-[#e8e9e3] sm:h-24 sm:w-36">{lead && (lead.contentType.startsWith('video/') ? <video src={`/api/media/${lead.id}`} className="h-full w-full object-cover" /> : <img src={`/api/media/${lead.id}`} alt={item.title} className="h-full w-full object-cover" />)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0a486f]">{item.category}</span><span className="text-[10px] text-[#9aa198]">·</span><span className="text-[10px] font-semibold uppercase tracking-wider text-[#52625b]">{item.purpose}</span></div><h3 className="serif mt-1 truncate text-xl text-[#173b38]">{item.title}</h3><p className="mt-1 flex items-center gap-1 text-xs text-[#78817a]"><MapPin size={12} /> {item.district}, {item.sector}{item.area ? ` · ${item.area}` : ''}</p></div><div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#173b38]">{item.price || 'Price on request'}</p><p className="mt-1 text-xs text-[#78817a]">{item.media.length} media file{item.media.length === 1 ? '' : 's'}</p></div>{(onEdit || onDelete) && <div className="flex items-center gap-1"><button onClick={onEdit} title="Edit listing" aria-label="Edit listing" className="p-2 text-[#0a486f] hover:bg-[#eaf1f4]"><Settings size={16} /></button><button onClick={onDelete} title="Delete listing" aria-label="Delete listing" className="p-2 text-[#a64f53] hover:bg-[#fff2ef]"><Trash2 size={16} /></button></div>}</article>
}

function EmptyInventory({ onAdd }: { onAdd: () => void }) {
  return <div className="py-14 text-center"><Building2 size={25} className="mx-auto text-[#0a486f]" /><h3 className="serif mt-4 text-2xl text-[#173b38]">Your collection starts here</h3><p className="mt-2 text-sm text-[#78817a]">No listings published yet.</p><button onClick={onAdd} className="mt-5 text-sm font-bold text-[#315c50]">Add your first listing <ArrowUpRight className="ml-1 inline" size={15} /></button></div>
}

function ListingForm({ listing, onClose, onPublish }: { listing?: Listing; onClose: () => void; onPublish: (listing: MarketplaceListing, files: File[], listingId?: string) => Promise<void> }) {
  const [title, setTitle] = useState(listing?.title || '')
  const [category, setCategory] = useState(listing?.category || categories[0])
  const [purpose, setPurpose] = useState<MarketplaceListing['purpose']>(listing?.purpose || 'For sale')
  const [price, setPrice] = useState(listing?.price || '')
  const [negotiable, setNegotiable] = useState(listing?.negotiable ?? true)
  const [district, setDistrict] = useState(listing?.district || '')
  const [sector, setSector] = useState(listing?.sector || '')
  const [area, setArea] = useState(listing?.area || '')
  const [reference, setReference] = useState(listing?.reference || '')
  const [upi, setUpi] = useState(listing?.upi || '')
  const [plotSize, setPlotSize] = useState(listing?.plotSize ? String(listing.plotSize) : '')
  const [zoning, setZoning] = useState(listing?.zoning || '')
  const [features, setFeatures] = useState<string[]>(listing?.features || [])
  const [descriptionEnglish, setDescriptionEnglish] = useState(listing?.descriptionEnglish || '')
  const [descriptionKinyarwanda, setDescriptionKinyarwanda] = useState(listing?.descriptionKinyarwanda || '')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const listingData: MarketplaceListing = {
      title, slug: '', category, purpose, price, negotiable, district, sector, area, reference,
      plotSize: Number(plotSize) || 0, zoning, upi, features, descriptionEnglish,
      descriptionKinyarwanda, media: listing?.media || [], status: 'published', createdAt: listing?.createdAt || new Date().toISOString(),
    }
    try { await onPublish(listingData, files, listing?.id) } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Unable to publish listing.')
    } finally { setSaving(false) }
  }

  const fieldClass = 'mt-2 w-full border border-[#d9ded7] bg-white px-3 py-3 text-sm outline-none focus:border-[#315c50]'
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101d18]/65 p-3 backdrop-blur-sm sm:p-6"><form onSubmit={submit} className="my-3 w-full max-w-4xl bg-[#f7f7f3] shadow-2xl sm:my-6"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d9ded7] bg-[#f7f7f3] px-5 py-4 sm:px-8"><div><p className="eyebrow">Inventory / New opportunity</p><h2 className="serif mt-1 text-2xl text-[#173b38]">Create a listing</h2></div><button type="button" onClick={onClose} aria-label="Close form" className="p-2 text-[#6f7970]"><X size={20} /></button></div><div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
    <FormSection number="01" title="Basic data" note="The essential details shown in search results."><div className="grid gap-4 sm:grid-cols-2"><FormInput label="Listing title" value={title} onChange={setTitle} placeholder="Kibagabaga residential plot" required /><FormInput label="Reference" value={reference} onChange={setReference} placeholder="Optional internal reference" /><FormSelect label="Category" value={category} onChange={setCategory} options={categories} /><FormSelect label="Listed as" value={purpose} onChange={value => setPurpose(value as MarketplaceListing['purpose'])} options={['For sale', 'For rent', 'For auction']} /><FormInput label={purpose === 'For rent' ? 'Rental rate and period' : 'Price'} value={price} onChange={setPrice} placeholder={purpose === 'For rent' ? 'RWF 500,000 / month' : 'RWF 165,000,000'} /><label className="flex items-center gap-3 self-end pb-3 text-sm text-[#52625b]"><input type="checkbox" checked={negotiable} onChange={event => setNegotiable(event.target.checked)} className="size-4 accent-[#315c50]" /> Price is negotiable</label></div></FormSection>
    <FormSection number="02" title="Location & plot data" note="Specific location, land use and measurements help buyers assess the opportunity."><div className="grid gap-4 sm:grid-cols-2"><FormInput label="District" value={district} onChange={setDistrict} placeholder="Gasabo" required /><FormInput label="Sector" value={sector} onChange={setSector} placeholder="Kimironko" required /><FormInput label="Area / cell" value={area} onChange={setArea} placeholder="Kibagabaga" /><FormInput label="Plot size (m²)" value={plotSize} onChange={setPlotSize} placeholder="1883" type="number" /><FormSelect label="Zoning / land use" value={zoning} onChange={setZoning} options={['Residential', 'Agricultural', 'Building area · R1', 'Building area · R2', 'Building area · R3', 'Industrial', 'Commercial', 'Mixed use', 'Other']} /><FormInput label="UPI / land title" value={upi} onChange={setUpi} placeholder="1/02/09/02/2788" /></div><fieldset className="mt-5"><legend className="text-sm font-semibold text-[#304a3e]">Plot features</legend><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{plotFeatures.map(feature => <label key={feature} className="flex items-center gap-2 text-sm text-[#59665d]"><input type="checkbox" checked={features.includes(feature)} onChange={event => setFeatures(current => event.target.checked ? [...current, feature] : current.filter(value => value !== feature))} className="size-4 accent-[#315c50]" />{feature}</label>)}</div></fieldset></FormSection>
    <FormSection number="03" title="Description" note="Share useful context in both languages for a clear, welcoming listing."><label className="block text-sm font-semibold text-[#304a3e]">Description · English<textarea required value={descriptionEnglish} onChange={event => setDescriptionEnglish(event.target.value)} rows={6} className={`${fieldClass} resize-y`} placeholder={'Location: Gasabo, Kimironko, Kibagabaga\n\nDescribe the property, access, utilities, nearby places and any included structures.'} /></label><label className="mt-4 block text-sm font-semibold text-[#304a3e]">Ibisobanuro · Kinyarwanda <span className="font-normal text-[#879087]">(optional)</span><textarea value={descriptionKinyarwanda} onChange={event => setDescriptionKinyarwanda(event.target.value)} rows={5} className={`${fieldClass} resize-y`} placeholder="Sobanura aho ubutaka buherereye n'ibindi by'ingenzi." /></label></FormSection>
    <FormSection number="04" title="Photography & video" note="Add as many original photos and videos as you need. Each file can be up to 100 MB."><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-[#aeb8ae] bg-white px-5 py-6 text-center"><Upload size={20} className="text-[#0a486f]" /><span className="mt-3 text-sm font-semibold text-[#304a3e]">Choose photos and videos</span><span className="mt-1 text-xs text-[#879087]">JPEG, PNG, WebP, MP4 and other browser-supported formats</span><input type="file" accept="image/*,video/*" multiple onChange={event => setFiles(current => [...current, ...Array.from(event.target.files ?? [])])} className="sr-only" /></label>{files.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{files.map((file, index) => <div key={`${file.name}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-[#e5e7e0]">{file.type.startsWith('video/') ? <video src={URL.createObjectURL(file)} className="h-full w-full object-cover" /> : <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />}<button type="button" onClick={() => setFiles(current => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-2 top-2 bg-white/90 p-1.5 text-[#173b38]" aria-label={`Remove ${file.name}`}><X size={14} /></button></div>)}</div>}</FormSection>
    {error && <p role="alert" className="border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}
  </div><div className="flex flex-col-reverse justify-between gap-3 border-t border-[#d9ded7] bg-white px-5 py-4 sm:flex-row sm:items-center sm:px-8"><span className="flex items-center gap-2 text-xs text-[#78817a]"><CircleDollarSign size={15} /> Public to visitors when published</span><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-3 text-sm font-semibold text-[#65716a]">Cancel</button><button disabled={saving} className="flex items-center gap-2 bg-[#173b38] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Uploading & publishing...' : 'Publish listing'} {!saving && <ArrowUpRight size={15} />}</button></div></div></form></div>
}

function FormSection({ number, title, note, children }: { number: string; title: string; note: string; children: React.ReactNode }) {
  return <section className="grid gap-4 border-b border-[#e2e5de] pb-7 last:border-0 sm:grid-cols-[170px_1fr]"><div><p className="text-[10px] font-bold tracking-[.14em] text-[#0a486f]">{number} / DETAILS</p><h3 className="serif mt-2 text-xl text-[#173b38]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#818a82]">{note}</p></div><div>{children}</div></section>
}

function FormInput({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-[#304a3e]">{label}<input required={required} type={type} min={type === 'number' ? '0' : undefined} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="field mt-2 rounded-none border-[#d9ded7] bg-white" /></label>
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="block text-sm font-semibold text-[#304a3e]">{label}<select value={value} onChange={event => onChange(event.target.value)} className="field mt-2 rounded-none border-[#d9ded7] bg-white">{options.map(option => <option key={option}>{option}</option>)}</select></label>
}
