'use client'

import { useEffect, useState } from 'react'
import { Check, ExternalLink, ImagePlus, Pencil, Plus, Trash2, Upload, Video, X } from 'lucide-react'
import { adPlacements, getYouTubeEmbedUrl, type Advertisement, type AdFormat, type AdPlacement } from '@/lib/advertisement-types'

type Ad = Advertisement & { id: string }
type AdDraft = { title: string; format: AdFormat; placement: AdPlacement; youtubeUrl: string; linkUrl: string; active: boolean }
const emptyDraft: AdDraft = { title: '', format: 'image', placement: 'leaderboard', youtubeUrl: '', linkUrl: '', active: true }
const placementDetails: Record<AdPlacement, { label: string; size: string }> = {
  'hero-poster': { label: 'Full-bleed hero poster', size: '1920 × 1080 · 16:9' },
  leaderboard: { label: 'Leaderboard', size: '728 × 90 · desktop' },
  'wide-post': { label: 'Wide post', size: '1200 × 630' },
  'medium-rectangle': { label: 'Medium rectangle', size: '300 × 250' },
  'large-rectangle': { label: 'Large rectangle', size: '336 × 280' },
  'half-page': { label: 'Half-page / filmstrip', size: '300 × 600' },
  'mobile-leaderboard': { label: 'Mobile leaderboard', size: '320 × 50' },
  'mobile-large-banner': { label: 'Mobile large banner', size: '320 × 100' },
}

export function AdminAdsManager({ onNotice }: { onNotice: (notice: string) => void }) {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ad | null>(null)
  const [draft, setDraft] = useState<AdDraft>(emptyDraft)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadAds() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ads')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load advertisements.')
      setAds(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load advertisements.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadAds() }, [])

  function openEditor(ad?: Ad) {
    setEditing(ad || null)
    setDraft(ad ? { title: ad.title, format: ad.format, placement: ad.placement, youtubeUrl: ad.youtubeUrl || '', linkUrl: ad.linkUrl || '', active: ad.active } : emptyDraft)
    setFile(null)
    setError('')
    setModalOpen(true)
  }

  async function saveAd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      let asset = editing?.asset
      if (draft.format !== 'youtube' && file) {
        const form = new FormData()
        form.set('file', file)
        const upload = await fetch('/api/media', { method: 'POST', body: form })
        const uploaded = await upload.json()
        if (!upload.ok) throw new Error(uploaded.error || 'Unable to upload this creative.')
        asset = uploaded
      }
      if (draft.format !== 'youtube' && !asset) throw new Error('Choose an image or video creative.')
      if (draft.format !== 'youtube' && editing && draft.format !== editing.format && !file) throw new Error('Upload a new creative when changing the ad format.')

      const response = await fetch(editing ? `/api/admin/ads/${editing.id}` : '/api/admin/ads', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, asset: draft.format === 'youtube' ? undefined : asset }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save this advertisement.')
      setModalOpen(false)
      await loadAds()
      onNotice(editing ? 'Advertisement updated.' : 'Advertisement added.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this advertisement.')
    } finally { setBusy(false) }
  }

  async function deleteAd(ad: Ad) {
    if (!window.confirm(`Delete “${ad.title}”? This cannot be undone.`)) return
    const response = await fetch(`/api/admin/ads/${ad.id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to delete this advertisement.'); return }
    setAds(current => current.filter(item => item.id !== ad.id))
    onNotice('Advertisement deleted.')
  }

  const updateDraft = <K extends keyof AdDraft>(key: K, value: AdDraft[K]) => setDraft(current => ({ ...current, [key]: value }))

  return <section className="mt-8 border border-[#d9ded7] bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e3e6e0] pb-5"><div><p className="eyebrow">Sponsor studio</p><h2 className="serif mt-2 text-3xl text-[#173b38]">Advertisements</h2><p className="mt-2 text-sm text-[#78817a]">Manage logos, image campaigns, video and YouTube placements.</p></div><button onClick={() => openEditor()} className="flex items-center gap-2 bg-[#0a486f] px-4 py-3 text-sm font-bold text-white"><Plus size={16} /> Add advertisement</button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AdCount label="All campaigns" value={ads.length} /><AdCount label="Live now" value={ads.filter(ad => ad.active).length} /><AdCount label="Image creatives" value={ads.filter(ad => ad.format === 'image').length} /><AdCount label="Video creatives" value={ads.filter(ad => ad.format !== 'image').length} /></div>
    {error && !modalOpen && <p role="alert" className="mt-4 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}
    {loading ? <p className="py-12 text-center text-sm text-[#78817a]">Loading ad campaigns...</p> : ads.length === 0 ? <div className="py-14 text-center"><ImagePlus size={27} className="mx-auto text-[#0a486f]" /><h3 className="serif mt-4 text-2xl text-[#173b38]">Make room for your sponsors</h3><p className="mt-2 text-sm text-[#78817a]">Create a campaign to feature sponsor identities and visual creatives on the landing page.</p><button onClick={() => openEditor()} className="mt-5 bg-[#0a486f] px-4 py-3 text-sm font-bold text-white">Create first ad</button></div> : <div className="mt-5 grid gap-4 xl:grid-cols-2">{ads.map(ad => <article key={ad.id} className="grid overflow-hidden border border-[#d9ded7] sm:grid-cols-[180px_1fr]"><AdPreview ad={ad} /><div className="min-w-0 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`size-2 rounded-full ${ad.active ? 'bg-[#5f8256]' : 'bg-[#9aa198]'}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-[#315c50]">{ad.active ? 'Active' : 'Paused'}</span><span className="text-[10px] text-[#8b9389]">{ad.format === 'youtube' ? 'YouTube' : ad.format}</span></div><h3 className="mt-2 truncate font-semibold text-[#173b38]">{ad.title}</h3></div><div className="flex shrink-0 gap-1"><button onClick={() => openEditor(ad)} aria-label="Edit advertisement" title="Edit" className="p-2 text-[#0a486f] hover:bg-[#eaf1f4]"><Pencil size={15} /></button><button onClick={() => void deleteAd(ad)} aria-label="Delete advertisement" title="Delete" className="p-2 text-[#a64f53] hover:bg-[#fff2ef]"><Trash2 size={15} /></button></div></div><p className="mt-2 text-xs text-[#78817a]">{placementDetails[ad.placement].label} <span className="text-[#9aa198]">· {placementDetails[ad.placement].size}</span></p>{ad.linkUrl && <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0a486f]">Destination <ExternalLink size={12} /></a>}</div></article>)}</div>}

    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#062f4acc] p-4 backdrop-blur-sm"><form onSubmit={saveAd} className="my-auto w-full max-w-2xl border border-[#d9ded7] bg-[#f8f9fa] p-5 shadow-2xl sm:p-7"><header className="flex items-start justify-between gap-4"><div><p className="eyebrow">Sponsor studio / Campaign</p><h3 className="serif mt-2 text-3xl text-[#173b38]">{editing ? 'Edit advertisement' : 'Add advertisement'}</h3></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Close editor" className="p-2 text-[#6f7970]"><X size={19} /></button></header>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#304a3e] sm:col-span-2">Campaign name<input required maxLength={120} value={draft.title} onChange={event => updateDraft('title', event.target.value)} placeholder="Sponsor or campaign name" className="field mt-2" /></label><label className="text-sm font-semibold text-[#304a3e]">Creative type<select value={draft.format} onChange={event => { updateDraft('format', event.target.value as AdFormat); setFile(null) }} className="field mt-2"><option value="image">Image / sponsor logo</option><option value="video">Video file</option><option value="youtube">YouTube video</option></select></label><label className="text-sm font-semibold text-[#304a3e]">Placement<select value={draft.placement} onChange={event => updateDraft('placement', event.target.value as AdPlacement)} className="field mt-2">{adPlacements.map(placement => <option key={placement} value={placement}>{placementDetails[placement].label} · {placementDetails[placement].size}</option>)}</select></label>
        {draft.format === 'youtube' ? <label className="text-sm font-semibold text-[#304a3e] sm:col-span-2">YouTube URL<input required type="url" value={draft.youtubeUrl} onChange={event => updateDraft('youtubeUrl', event.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="field mt-2" /></label> : <div className="sm:col-span-2"><label className="flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-[#9fb7c7] bg-white p-4 text-center"><Upload size={19} className="text-[#0a486f]" /><span className="mt-2 text-sm font-semibold text-[#173b38]">{file?.name || (draft.format === 'video' ? 'Choose a video file' : 'Choose an image or sponsor logo')}</span><span className="mt-1 text-xs text-[#78817a]">{draft.format === 'video' ? 'MP4 or WebM · up to 100 MB' : 'WebP, JPEG or PNG · try to keep files under 200 KB'}</span><input type="file" required={!editing?.asset || draft.format !== editing.format} accept={draft.format === 'video' ? 'video/mp4,video/webm' : 'image/*'} className="sr-only" onChange={event => setFile(event.target.files?.[0] || null)} /></label>{editing?.asset && !file && draft.format === editing.format && <p className="mt-2 text-xs text-[#78817a]">Current creative: {editing.asset.name}</p>}</div>}
        <label className="text-sm font-semibold text-[#304a3e] sm:col-span-2">Destination URL <span className="font-normal text-[#78817a]">(optional)</span><input type="url" value={draft.linkUrl} onChange={event => updateDraft('linkUrl', event.target.value)} placeholder="https://sponsor.example" className="field mt-2" /></label><label className="flex items-center gap-3 text-sm font-semibold text-[#304a3e] sm:col-span-2"><input type="checkbox" checked={draft.active} onChange={event => updateDraft('active', event.target.checked)} className="size-4 accent-[#0a486f]" /> Publish this campaign</label>
      </div>
      {error && <p role="alert" className="mt-4 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-3 text-sm font-semibold text-[#65716a]">Cancel</button><button disabled={busy} className="flex items-center gap-2 bg-[#0a486f] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving...' : editing ? 'Save changes' : 'Publish ad'}{!busy && <Check size={16} />}</button></div>
    </form></div>}
  </section>
}

function AdCount({ label, value }: { label: string; value: number }) {
  return <div className="border border-[#d9ded7] bg-[#f8f9fa] px-4 py-3"><p className="text-xs text-[#78817a]">{label}</p><p className="mt-1 text-xl font-medium text-[#062f4a]">{value}</p></div>
}

function AdPreview({ ad }: { ad: Ad }) {
  const aspect = ad.placement === 'hero-poster' ? 'aspect-video' : ad.placement === 'half-page' ? 'aspect-[1/2]' : ad.placement.includes('rectangle') ? 'aspect-[6/5]' : ad.placement.includes('mobile') ? 'aspect-[16/5]' : ad.placement === 'leaderboard' ? 'aspect-[8/1]' : 'aspect-[1200/630]'
  return <div className={`relative ${aspect} grid place-items-center overflow-hidden bg-[#eaf1f4] text-[#0a486f] sm:aspect-auto sm:min-h-32`}>
    {ad.format === 'youtube' && ad.youtubeUrl ? <iframe src={getYouTubeEmbedUrl(ad.youtubeUrl)} title={ad.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : ad.format === 'video' && ad.asset ? <video src={`/api/media/${ad.asset.id}`} muted playsInline className="h-full w-full object-cover" /> : ad.asset ? <img src={`/api/media/${ad.asset.id}`} alt={ad.title} className={`h-full w-full ${ad.placement === 'hero-poster' ? 'object-cover' : 'object-contain'} p-2`} /> : <Video size={23} />}
    {!ad.active && <span className="absolute left-2 top-2 bg-white/90 px-2 py-1 text-[9px] font-bold uppercase text-[#69736c]">Paused</span>}
  </div>
}