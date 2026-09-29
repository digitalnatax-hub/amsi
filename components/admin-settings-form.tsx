'use client'

import { useEffect, useState } from 'react'
import { Check, ImagePlus, KeyRound, Save, Upload, UserRound } from 'lucide-react'

type Settings = { siteName: string; logoImage: string; adminName: string; adminImage: string }
const initialSettings: Settings = { siteName: 'AMSI & Co.', logoImage: '', adminName: 'Administrator', adminImage: '' }

export function AdminSettingsForm({ onSaved }: { onSaved: (settings: Settings) => void }) {
  const [settings, setSettings] = useState(initialSettings)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings').then(async response => {
      const result = await response.json()
      if (response.ok) setSettings({ ...initialSettings, ...result })
    }).catch(() => undefined)
  }, [])

  async function uploadImage(field: 'logoImage' | 'adminImage', file?: File) {
    if (!file) return
    setUploading(field)
    setError('')
    try {
      const form = new FormData()
      form.set('file', file)
      const response = await fetch('/api/media', { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to upload this image.')
      setSettings(current => ({ ...current, [field]: `/api/media/${result.id}` }))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload this image.')
    } finally { setUploading('') }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save settings.')
      setSettings(result)
      onSaved(result)
      setCurrentPassword('')
      setNewPassword('')
      setNotice('Your settings have been saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save settings.')
    } finally { setBusy(false) }
  }

  return <form onSubmit={save} className="mt-8 max-w-4xl border border-[#d9ded7] bg-white p-5 sm:p-8">
    <p className="eyebrow">Platform configuration</p><h2 className="serif mt-2 text-3xl text-[#173b38]">Site & administrator</h2><p className="mt-2 text-sm text-[#78817a]">Changes to the brand are reflected on the public marketplace.</p>
    <div className="mt-7 grid gap-8 lg:grid-cols-2">
      <section className="border-t border-[#e3e6e0] pt-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center bg-[#eaf1f4] text-[#0a486f]"><ImagePlus size={18} /></span><div><h3 className="font-semibold text-[#173b38]">Public identity</h3><p className="text-xs text-[#78817a]">Name and logo</p></div></div><label className="mt-5 block text-sm font-semibold text-[#304a3e]">Website name<input required maxLength={80} value={settings.siteName} onChange={event => setSettings(current => ({ ...current, siteName: event.target.value }))} className="field mt-2" /></label><div className="mt-4 flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center overflow-hidden border border-[#d9ded7] bg-[#f3f4f0] text-[#315c50]">{settings.logoImage ? <img src={settings.logoImage} alt="Current website logo" className="h-full w-full object-contain" /> : <span className="serif text-2xl">A</span>}</div><label className="flex cursor-pointer items-center gap-2 border border-[#d9ded7] px-4 py-3 text-sm font-semibold text-[#0a486f] hover:bg-[#eaf1f4]"><Upload size={16} />{uploading === 'logoImage' ? 'Uploading...' : 'Upload logo'}<input type="file" accept="image/*" className="sr-only" onChange={event => void uploadImage('logoImage', event.target.files?.[0])} /></label></div></section>
      <section className="border-t border-[#e3e6e0] pt-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center bg-[#edf3ec] text-[#315c50]"><UserRound size={18} /></span><div><h3 className="font-semibold text-[#173b38]">Administrator profile</h3><p className="text-xs text-[#78817a]">Dashboard name and picture</p></div></div><label className="mt-5 block text-sm font-semibold text-[#304a3e]">Display name<input required maxLength={120} value={settings.adminName} onChange={event => setSettings(current => ({ ...current, adminName: event.target.value }))} className="field mt-2" /></label><div className="mt-4 flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d9ded7] bg-[#f3f4f0] text-[#315c50]">{settings.adminImage ? <img src={settings.adminImage} alt="Administrator profile" className="h-full w-full object-cover" /> : <UserRound size={22} />}</div><label className="flex cursor-pointer items-center gap-2 border border-[#d9ded7] px-4 py-3 text-sm font-semibold text-[#315c50] hover:bg-[#edf3ec]"><Upload size={16} />{uploading === 'adminImage' ? 'Uploading...' : 'Upload profile picture'}<input type="file" accept="image/*" className="sr-only" onChange={event => void uploadImage('adminImage', event.target.files?.[0])} /></label></div></section>
    </div>
    <section className="mt-8 border-t border-[#e3e6e0] pt-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center bg-[#f3eddf] text-[#8b7040]"><KeyRound size={18} /></span><div><h3 className="font-semibold text-[#173b38]">Administrator password</h3><p className="text-xs text-[#78817a]">Leave blank to keep the current password.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#304a3e]">Current password<input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="field mt-2" autoComplete="current-password" /></label><label className="text-sm font-semibold text-[#304a3e]">New password<input type="password" minLength={12} maxLength={256} value={newPassword} onChange={event => setNewPassword(event.target.value)} className="field mt-2" autoComplete="new-password" /></label></div></section>
    {error && <p role="alert" className="mt-5 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}{notice && <p role="status" className="mt-5 flex items-center gap-2 bg-[#edf3ec] p-3 text-sm text-[#315c50]"><Check size={16} />{notice}</p>}
    <div className="mt-6 flex justify-end"><button disabled={busy || Boolean(uploading)} className="flex items-center gap-2 bg-[#0a486f] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving...' : 'Save settings'}{!busy && <Save size={16} />}</button></div>
  </form>
}