'use client'

import { useState } from 'react'
import { ArrowUpRight, Check, Upload, UserRound } from 'lucide-react'

type Profile = { fullName: string; email: string; phone: string; profileImage: string }

export function ProfileForm({ fullName, email, phone, profileImage = '', onSaved }: Partial<Profile> & Pick<Profile, 'fullName' | 'email' | 'phone'> & { onSaved: (profile: Profile) => void }) {
  const [nameValue, setNameValue] = useState(fullName)
  const [emailValue, setEmailValue] = useState(email)
  const [phoneValue, setPhoneValue] = useState(phone)
  const [imageValue, setImageValue] = useState(profileImage)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function uploadProfileImage(file?: File) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.set('file', file)
      const response = await fetch('/api/media', { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to upload your picture.')
      setImageValue(`/api/media/${result.id}`)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload your picture.')
    } finally { setUploading(false) }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/users/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: nameValue, email: emailValue, phone: phoneValue, profileImage: imageValue, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save profile.')
      onSaved({ fullName: result.fullName, email: result.email, phone: result.phone, profileImage: result.profileImage || '' })
      setCurrentPassword('')
      setNewPassword('')
      setMessage('Your account details have been updated.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile.')
    } finally { setBusy(false) }
  }

  return <form onSubmit={submit} className="mt-8 max-w-2xl border border-[#d8e1e8] bg-white p-5 sm:p-8">
    <p className="text-xs font-bold uppercase tracking-[.15em] text-[#0a486f]">Account details</p>
    <h2 className="serif mt-2 text-3xl text-[#173b38]">Your profile</h2>
    <div className="mt-6 flex items-center gap-4 border-b border-[#e5e8e1] pb-6">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eaf1f4] text-[#0a486f]">{imageValue ? <img src={imageValue} alt="Your profile" className="h-full w-full object-cover" /> : <UserRound size={24} />}</div>
      <label className="flex cursor-pointer items-center gap-2 border border-[#9fb7c7] px-4 py-3 text-sm font-semibold text-[#0a486f] hover:bg-[#eaf1f4]"><Upload size={16} />{uploading ? 'Uploading...' : 'Change profile picture'}<input type="file" accept="image/*" disabled={uploading} className="sr-only" onChange={event => void uploadProfileImage(event.target.files?.[0])} /></label>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-[#365c76] sm:col-span-2">Full name<input required maxLength={120} value={nameValue} onChange={event => setNameValue(event.target.value)} className="field mt-2" autoComplete="name" /></label>
      <label className="text-sm font-semibold text-[#365c76]">Email address<input required type="email" maxLength={254} value={emailValue} onChange={event => setEmailValue(event.target.value)} className="field mt-2" autoComplete="email" /></label>
      <label className="text-sm font-semibold text-[#365c76]">Phone number<input required type="tel" maxLength={40} value={phoneValue} onChange={event => setPhoneValue(event.target.value)} className="field mt-2" autoComplete="tel" /></label>
      <label className="text-sm font-semibold text-[#365c76]">Current password <span className="font-normal">(required to change password)</span><input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="field mt-2" autoComplete="current-password" /></label>
      <label className="text-sm font-semibold text-[#365c76]">New password<input type="password" minLength={12} maxLength={256} value={newPassword} onChange={event => setNewPassword(event.target.value)} className="field mt-2" autoComplete="new-password" placeholder="Leave blank to keep current password" /></label>
    </div>
    {error && <p role="alert" className="mt-4 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}
    {message && <p role="status" className="mt-4 flex items-center gap-2 bg-[#edf3ec] p-3 text-sm text-[#315c50]"><Check size={16} />{message}</p>}
    <button disabled={busy || uploading} className="mt-6 flex items-center gap-2 bg-[#0a486f] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving...' : 'Save profile'} {!busy && <ArrowUpRight size={15} />}</button>
  </form>
}