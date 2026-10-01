'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Check, Gavel, Heart, LayoutDashboard, LogOut, MessageCircle, Search, Send } from 'lucide-react'
import { MyAuctions } from '@/components/my-auctions'
import { MemberMessages } from '@/components/member-messages'
import { SavedListings } from '@/components/saved-listings'
import { ProfileForm } from '@/components/profile-form'
import { useTimeGreeting } from '@/lib/time-greeting'

export default function UserDashboard() {
  const greeting = useTimeGreeting()
  const router = useRouter()
  const [section, setSection] = useState('Overview')
  const [bid, setBid] = useState('')
  const [message, setMessage] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [siteName, setSiteName] = useState('AMSI & Co.')
  const [logoImage, setLogoImage] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [initialMessageId, setInitialMessageId] = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const [consultationCount, setConsultationCount] = useState(0)
  const [auctionCount, setAuctionCount] = useState(0)
  const nav = ['Overview', 'Saved listings', 'My auctions', 'Messages', 'Consultancy', 'Profile']
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('section') !== 'Messages') return
    setSection('Messages')
    setInitialMessageId(params.get('message') || '')
    window.history.replaceState(null, '', '/dashboard')
  }, [])
  useEffect(() => {
    fetch('/api/users/session')
      .then(async response => {
        if (!response.ok) { router.replace('/'); return }
        const result = await response.json()
        setFullName(result.user.fullName)
        setEmail(result.user.email)
        setPhone(result.user.phone)
        setProfileImage(result.user.profileImage || '')
      })
      .catch(() => router.replace('/'))
      .finally(() => setCheckingSession(false))
  }, [router])
  useEffect(() => {
    fetch('/api/settings').then(response => response.json()).then(settings => {
      setSiteName(settings.siteName || 'AMSI & Co.')
      setLogoImage(settings.logoImage || '')
    }).catch(() => undefined)
  }, [])
  useEffect(() => {
    if (!fullName) return
    let active = true
    Promise.all([
      fetch('/api/users/favorites').then(response => response.ok ? response.json() : []),
      fetch('/api/users/requests?kind=consultancy').then(response => response.ok ? response.json() : []),
      fetch('/api/users/auctions').then(response => response.ok ? response.json() : []),
    ]).then(([favorites, consultations, auctions]) => {
      if (!active) return
      setSavedCount(favorites.length)
      setConsultationCount(consultations.length)
      setAuctionCount(auctions.length)
    }).catch(() => undefined)
    return () => { active = false }
  }, [fullName])
  if (checkingSession) return <main className="grid min-h-screen place-items-center bg-[#f8f9fa] text-[#173b38]">Loading your account...</main>
  if (!fullName) return null
  async function signOut() {
    await fetch('/api/users/session', { method: 'DELETE' })
    router.replace('/')
  }
  return <main data-dashboard="member" className="min-h-screen bg-[#f8f9fa] text-[#172534]">
    <header className="border-b border-[#07324f] bg-[#0a486f] text-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><a href="/" className="flex items-center gap-3 text-sm font-semibold text-white"><ArrowLeft size={16} /><span className="grid size-9 place-items-center overflow-hidden rounded-full border border-white/50">{logoImage ? <img src={logoImage} alt="" className="h-full w-full object-contain" /> : <span className="serif text-xl">A</span>}</span><span className="serif text-lg">{siteName}</span></a><div className="flex items-center gap-4"><Bell size={18} className="text-white/70" /><span className="hidden text-sm font-semibold sm:block">{fullName}</span>{profileImage ? <img src={profileImage} alt="Your profile" className="size-9 rounded-full border border-white/50 object-cover" /> : <span className="flex size-9 items-center justify-center rounded-full bg-[#c29f55] text-sm font-semibold text-[#062f4a]">{fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span>}</div></div></header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[220px_1fr]"><aside><p className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#6f8493]">Member area</p><nav className="space-y-1">{nav.map(item => <button key={item} onClick={() => setSection(item)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === item ? 'bg-[#0a486f] text-white' : 'text-[#526777] hover:bg-[#e8f0f5]'}`}><LayoutDashboard size={16} />{item}</button>)}</nav><button onClick={signOut} className="mt-10 flex items-center gap-3 px-3 text-sm font-semibold text-[#6f8493]"><LogOut size={16} /> Sign out</button></aside>
      <section><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#6f8493]">{section}</p><h1 className="serif mt-2 text-4xl text-[#0a486f]">{section === 'Overview' ? `${greeting}, ${fullName.split(" ")[0]}.` : section}</h1><p className="mt-2 text-sm text-[#687783]">Your AMSI account, opportunities and private requests.</p></div><button onClick={() => setSection('Profile')} className="w-fit rounded-lg border border-[#9fb7c7] px-4 py-2 text-sm font-semibold text-[#0a486f]">Edit profile</button></div>
        {section === 'Overview' && <><div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat icon={<Heart />} value={String(savedCount)} label="Saved listings"/><Stat icon={<MessageCircle />} value={String(consultationCount)} label="Consultancy requests"/><Stat icon={<Gavel />} value={String(auctionCount)} label="Auction entries"/></div><div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><div className="rounded-xl border border-[#d8e1e8] bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-[#0a486f]">Saved opportunities</h2><button onClick={() => setSection('Saved listings')} className="text-sm font-semibold text-[#0a486f]">View all</button></div><div className="mt-4 space-y-3"><SavedListings compact onViewAll={() => setSection('Saved listings')} /></div></div><div className="rounded-xl bg-[#0a486f] p-6 text-white"><Gavel size={20}/><p className="mt-6 text-xs uppercase tracking-widest text-white/65">Auction activity</p><p className="mt-2 text-3xl font-bold">{auctionCount} tracked lots</p><p className="mt-2 text-sm text-white/70">Your entries, recorded bids, and standing</p><button onClick={() => setSection('My auctions')} className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#0a486f]">View activity</button></div></div></>}
        {section === 'My auctions' && <MyAuctions />}
        {section === 'Saved listings' && <SavedListings />}
        {section === 'Messages' && <MemberMessages initialRequestId={initialMessageId} />}
        {section === 'Consultancy' && <ContactForm kind="consultancy" />}
        {section === 'Profile' && <ProfileForm fullName={fullName} email={email} phone={phone} profileImage={profileImage} onSaved={profile => { setFullName(profile.fullName); setEmail(profile.email); setPhone(profile.phone); setProfileImage(profile.profileImage) }} />}
        {section !== 'Overview' && section !== 'My auctions' && section !== 'Saved listings' && section !== 'Messages' && section !== 'Consultancy' && section !== 'Profile' && <div className="mt-8 rounded-xl border border-dashed border-[#bdcdd8] bg-white p-12 text-center"><Search className="mx-auto text-[#0a486f]"/><h2 className="mt-4 text-xl font-semibold text-[#0a486f]">{section === 'Profile' ? 'Your profile is verified' : `No ${section.toLowerCase()} yet`}</h2><p className="mt-2 text-sm text-[#718595]">{section === 'Profile' ? 'Your account details will appear here.' : 'No saved opportunities yet.'}</p></div>}
        {message && <button onClick={() => setMessage('')} className="fixed bottom-6 right-6 rounded-lg bg-[#0a486f] px-5 py-3 text-sm font-semibold text-white shadow-lg">{message}</button>}
      </section></div></main>
}
function Stat({icon,value,label}:{icon:React.ReactNode,value:string,label:string}) { return <div className="rounded-xl border border-[#d8e1e8] bg-white p-5"><span className="text-[#0a486f]">{icon}</span><p className="mt-5 text-3xl font-bold text-[#0a486f]">{value}</p><p className="mt-1 text-sm text-[#687783]">{label}</p></div> }
function Info({label,value}:{label:string,value:string}) { return <div className="rounded-lg bg-[#f1f6f8] p-4"><p className="text-xs uppercase tracking-wider text-[#6f8493]">{label}</p><p className="mt-2 font-bold text-[#0a486f]">{value}</p></div> }

function ContactForm({ kind }: { kind: 'message' | 'consultancy' }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [topic, setTopic] = useState('Property')
  const [preferredTime, setPreferredTime] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const consultancy = kind === 'consultancy'

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, fullName, email, phone, topic: consultancy ? topic : '', preferredTime: consultancy ? preferredTime : '', message: text }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send your request.')
      setNotice(consultancy ? 'Your consultancy request has been sent.' : 'Your message has been sent to the AMSI team.')
      setText('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send your request.')
    } finally {
      setBusy(false)
    }
  }

  return <form onSubmit={submit} className="mt-8 max-w-3xl border border-[#d8e1e8] bg-white p-5 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#0a486f]">{consultancy ? 'Speak with our team' : 'Contact AMSI'}</p><h2 className="serif mt-2 text-3xl text-[#173b38]">{consultancy ? 'Request a consultation' : 'Send us a message'}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#687783]">Share your contact details and message. An AMSI team member can follow up by phone or email.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#365c76]">Full name<input required maxLength={120} value={fullName} onChange={event => setFullName(event.target.value)} className="field mt-2" autoComplete="name" /></label><label className="text-sm font-semibold text-[#365c76]">Email<input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="field mt-2" autoComplete="email" /></label><label className="text-sm font-semibold text-[#365c76]">Phone number<input required type="tel" maxLength={40} value={phone} onChange={event => setPhone(event.target.value)} className="field mt-2" autoComplete="tel" /></label>{consultancy && <><label className="text-sm font-semibold text-[#365c76]">Consultation topic<select value={topic} onChange={event => setTopic(event.target.value)} className="field mt-2"><option>Property</option><option>Business</option><option>Investment</option><option>Buying advice</option><option>Renting advice</option><option>Selling advice</option><option>Auction advice</option><option>General consultation</option></select></label><label className="text-sm font-semibold text-[#365c76] sm:col-span-2">Preferred consultation time<input value={preferredTime} onChange={event => setPreferredTime(event.target.value)} placeholder="For example: weekday afternoons" className="field mt-2" /></label></>}</div><label className="mt-4 block text-sm font-semibold text-[#365c76]">{consultancy ? 'How can we help?' : 'Your message'}<textarea required maxLength={10000} rows={6} value={text} onChange={event => setText(event.target.value)} className="field mt-2 resize-y" placeholder={consultancy ? 'Describe what you would like guidance with...' : 'Write your message to the AMSI team...'} /></label><p className="mt-3 text-xs leading-5 text-[#7a877d]">Your phone number and message will be shared with the AMSI administration team to respond to this request.</p>{error && <p role="alert" className="mt-4 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}{notice && <p role="status" className="mt-4 flex items-center gap-2 bg-[#edf3ec] p-3 text-sm text-[#315c50]"><Check size={16} />{notice}</p>}<button disabled={busy} className="mt-5 flex items-center gap-2 rounded-lg bg-[#0a486f] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Sending...' : consultancy ? 'Request consultation' : 'Send message'} <Send size={15} /></button></form>
}
