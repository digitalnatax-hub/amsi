'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Crown, X } from 'lucide-react'

export function AccountModal({ mode, setMode, onClose, notice, next }: { mode: 'login' | 'signup'; setMode: (mode: 'login' | 'signup') => void; onClose: () => void; notice: string; next?: string }) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const response = await fetch(mode === 'signup' ? '/api/users' : '/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signup' ? { fullName, phone, email, password } : { email, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to authenticate.')
      onClose()
      const fallback = mode === 'signup' || result.role === 'member' ? '/dashboard' : '/admin'
      const destination = result.role === 'member' && next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : fallback
      router.push(destination)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to authenticate.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="modal-backdrop"><form onSubmit={submit} className="modal-card max-w-md">
    <button type="button" onClick={onClose} aria-label="Close" className="absolute right-5 top-5 text-[#8b9389]"><X size={20} /></button>
    <div className="mb-7 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#315c50] text-[#0a486f]"><Crown size={20} /></span><h2 className="serif mt-4 text-3xl text-[#173b38]">{mode === 'login' ? 'Welcome back' : 'Create your AMSI account'}</h2><p className="mt-2 text-sm text-[#7c847a]">{error || notice || 'Private access to exceptional opportunities.'}</p></div>
    <div className="flex bg-[#f1f3ef] p-1 text-sm font-semibold"><button type="button" onClick={() => { setMode('login'); setError('') }} className={`flex-1 py-2 ${mode === 'login' ? 'bg-white text-[#315c50] shadow-sm' : 'text-[#899188]'}`}>Sign in</button><button type="button" onClick={() => { setMode('signup'); setError('') }} className={`flex-1 py-2 ${mode === 'signup' ? 'bg-white text-[#315c50] shadow-sm' : 'text-[#899188]'}`}>Create account</button></div>
    <div className="mt-6 space-y-4">
      {mode === 'signup' && <><input required maxLength={120} value={fullName} onChange={event => setFullName(event.target.value)} className="field" placeholder="Full name" autoComplete="name" /><input required maxLength={40} value={phone} onChange={event => setPhone(event.target.value)} className="field" placeholder="Phone number" type="tel" autoComplete="tel" /></>}
      <input required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="field" placeholder="Email address" type="email" autoComplete="username" />
      <input required minLength={mode === 'signup' ? 12 : undefined} maxLength={256} value={password} onChange={event => setPassword(event.target.value)} className="field" placeholder={mode === 'signup' ? 'Password (12 characters minimum)' : 'Password'} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      {mode === 'signup' && <input required minLength={12} maxLength={256} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="field" placeholder="Confirm password" type="password" autoComplete="new-password" />}
    </div>
    <button disabled={busy} className="mt-6 w-full bg-[#0a486f] py-3.5 text-sm font-bold text-white transition hover:bg-[#07324f] disabled:opacity-60">{busy ? 'Please wait...' : mode === 'login' ? 'Sign in securely' : 'Create account'} <ArrowUpRight className="ml-2 inline" size={15} /></button>
  </form></div>
}
