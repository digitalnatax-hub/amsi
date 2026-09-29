'use client'

import { useEffect, useState } from 'react'
import { Check, KeyRound, Pencil, Plus, Search, Shield, ShieldOff, Trash2, UserRound, X } from 'lucide-react'

type Member = { id: string; fullName: string; email: string; phone: string; status: 'active' | 'suspended'; createdAt: string }
type MemberDraft = { fullName: string; email: string; phone: string; password: string; status: 'active' | 'suspended' }
const emptyDraft: MemberDraft = { fullName: '', email: '', phone: '', password: '', status: 'active' }

export function AdminUsersManager({ onNotice }: { onNotice: (notice: string) => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [draft, setDraft] = useState<MemberDraft>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadMembers() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load member accounts.')
      setMembers(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load member accounts.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadMembers() }, [])

  function openEditor(member?: Member) {
    setEditorOpen(true)
    setEditing(member || null)
    setDraft(member ? { fullName: member.fullName, email: member.email, phone: member.phone, password: '', status: member.status } : emptyDraft)
    setError('')
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(editing ? `/api/admin/users/${editing.id}` : '/api/admin/users', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, password: draft.password || undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save this account.')
      setEditing(null)
      setEditorOpen(false)
      setDraft(emptyDraft)
      onNotice(editing ? 'Member account updated.' : 'Member account created.')
      await loadMembers()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this account.')
    } finally { setSaving(false) }
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`Delete the account for ${member.fullName}? This cannot be undone.`)) return
    const response = await fetch(`/api/admin/users/${member.id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to delete this account.'); return }
    setMembers(current => current.filter(item => item.id !== member.id))
    onNotice('Member account deleted.')
  }

  async function toggleStatus(member: Member) {
    const response = await fetch(`/api/admin/users/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: member.fullName, email: member.email, phone: member.phone, status: member.status === 'active' ? 'suspended' : 'active' }),
    })
    const result = await response.json()
    if (!response.ok) { setError(result.error || 'Unable to update account status.'); return }
    setMembers(current => current.map(item => item.id === member.id ? { ...item, status: result.status } : item))
    onNotice(result.status === 'suspended' ? 'Member account suspended.' : 'Member account reactivated.')
  }

  const visibleMembers = members.filter(member => `${member.fullName} ${member.email} ${member.phone}`.toLowerCase().includes(query.toLowerCase()))
  const updateDraft = (key: keyof MemberDraft, value: string) => setDraft(current => ({ ...current, [key]: value }))

  return <section className="mt-8 border border-[#d9ded7] bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e3e6e0] pb-5">
      <div><p className="eyebrow">Member access</p><h2 className="serif mt-2 text-3xl text-[#173b38]">User accounts</h2><p className="mt-2 text-sm text-[#78817a]">Create, update, suspend or remove marketplace accounts.</p></div>
      <button onClick={() => openEditor()} className="flex items-center gap-2 bg-[#0a486f] px-4 py-3 text-sm font-bold text-white"><Plus size={16} /> Add user</button>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><label className="flex min-w-[220px] items-center gap-2 border border-[#d9ded7] px-3 py-2"><Search size={16} className="text-[#819087]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search members" className="min-w-0 bg-transparent text-sm outline-none" /></label><p className="text-xs font-semibold uppercase tracking-wider text-[#78817a]">{members.length} accounts</p></div>
    {error && <p role="alert" className="mt-4 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}
    {loading ? <p className="py-12 text-center text-sm text-[#78817a]">Loading accounts...</p> : <div className="mt-3 divide-y divide-[#e5e8e1]">{visibleMembers.map(member => <article key={member.id} className="flex flex-wrap items-center gap-4 py-4">
      <span className="grid size-11 shrink-0 place-items-center bg-[#eaf1f4] text-[#0a486f]"><UserRound size={19} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[#173b38]">{member.fullName}</h3><span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${member.status === 'active' ? 'bg-[#e9eee8] text-[#4c6a52]' : 'bg-[#f5e9e4] text-[#a35b47]'}`}>{member.status}</span></div><p className="mt-1 truncate text-xs text-[#78817a]">{member.email} · {member.phone}</p></div>
      <div className="flex items-center gap-1"><button title={member.status === 'active' ? 'Suspend account' : 'Reactivate account'} aria-label={member.status === 'active' ? 'Suspend account' : 'Reactivate account'} onClick={() => void toggleStatus(member)} className="p-2 text-[#315c50] hover:bg-[#edf3ec]">{member.status === 'active' ? <ShieldOff size={17} /> : <Shield size={17} />}</button><button title="Edit account" aria-label="Edit account" onClick={() => openEditor(member)} className="p-2 text-[#0a486f] hover:bg-[#eaf1f4]"><Pencil size={16} /></button><button title="Delete account" aria-label="Delete account" onClick={() => void removeMember(member)} className="p-2 text-[#a64f53] hover:bg-[#fff2ef]"><Trash2 size={16} /></button></div>
    </article>)}{visibleMembers.length === 0 && <p className="py-12 text-center text-sm text-[#78817a]">No matching member accounts.</p>}</div>}
    {editorOpen ? <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#062f4acc] p-4 backdrop-blur-sm"><form onSubmit={saveMember} className="my-auto w-full max-w-xl border border-[#d9ded7] bg-[#f8f9fa] p-5 shadow-2xl sm:p-8">
      <header className="flex items-start justify-between"><div><p className="eyebrow">Members / Account</p><h3 className="serif mt-2 text-3xl text-[#173b38]">{editing ? 'Edit user' : 'Create user'}</h3></div><button type="button" onClick={() => { setEditing(null); setEditorOpen(false); setDraft(emptyDraft) }} aria-label="Close" className="p-2 text-[#6f7970]"><X size={20} /></button></header>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#304a3e] sm:col-span-2">Full name<input required maxLength={120} value={draft.fullName} onChange={event => updateDraft('fullName', event.target.value)} className="field mt-2" /></label><label className="text-sm font-semibold text-[#304a3e]">Email<input required type="email" maxLength={254} value={draft.email} onChange={event => updateDraft('email', event.target.value)} className="field mt-2" /></label><label className="text-sm font-semibold text-[#304a3e]">Phone<input required value={draft.phone} onChange={event => updateDraft('phone', event.target.value)} className="field mt-2" /></label><label className="text-sm font-semibold text-[#304a3e] sm:col-span-2">{editing ? 'Reset password (optional)' : 'Temporary password'}<span className="mt-1 block text-xs font-normal text-[#78817a]">At least 12 characters. Share it with the member securely.</span><input required={!editing} type="password" minLength={12} maxLength={256} value={draft.password} onChange={event => updateDraft('password', event.target.value)} className="field mt-2" autoComplete="new-password" /></label>{editing && <label className="text-sm font-semibold text-[#304a3e] sm:col-span-2">Account status<select value={draft.status} onChange={event => updateDraft('status', event.target.value)} className="field mt-2"><option value="active">Active</option><option value="suspended">Suspended</option></select></label>}</div>
      {error && <p role="alert" className="mt-4 border border-[#e4c7c2] bg-[#fff7f5] p-3 text-sm text-[#a64f53]">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => { setEditing(null); setEditorOpen(false); setDraft(emptyDraft) }} className="px-4 py-3 text-sm font-semibold text-[#65716a]">Cancel</button><button disabled={saving} className="flex items-center gap-2 bg-[#0a486f] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create account'}{!saving && <Check size={16} />}</button></div>
    </form></div> : null}
  </section>
}