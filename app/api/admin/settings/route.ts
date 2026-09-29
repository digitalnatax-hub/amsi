import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid, verifyAdminCredentials } from '@/lib/admin-session'
import { hashPassword } from '@/lib/user-auth'

export const runtime = 'nodejs'

type SiteSettings = { _id: string; siteName?: string; logoImage?: string; adminName?: string; adminImage?: string; adminPasswordHash?: string }

export async function GET() {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const settings = await (await getDatabase()).collection<SiteSettings>('siteSettings').findOne({ _id: 'site' })
  return NextResponse.json({ siteName: settings?.siteName || 'AMSI & Co.', logoImage: settings?.logoImage || '', adminName: settings?.adminName || 'Administrator', adminImage: settings?.adminImage || '' })
}

export async function PATCH(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const siteName = typeof body?.siteName === 'string' ? body.siteName.trim() : ''
  const adminName = typeof body?.adminName === 'string' ? body.adminName.trim() : ''
  const logoImage = typeof body?.logoImage === 'string' ? body.logoImage : ''
  const adminImage = typeof body?.adminImage === 'string' ? body.adminImage : ''
  if (!siteName || siteName.length > 80 || !adminName || adminName.length > 120) return NextResponse.json({ error: 'Enter a site name and administrator name.' }, { status: 400 })
  for (const image of [logoImage, adminImage]) {
    if (image && !/^\/api\/media\/[a-f0-9]{24}$/i.test(image)) return NextResponse.json({ error: 'Choose a valid image.' }, { status: 400 })
  }
  const update: Partial<SiteSettings> = { siteName, logoImage, adminName, adminImage }
  if (body?.newPassword) {
    if (typeof body.currentPassword !== 'string' || !(await verifyAdminCredentials(process.env.ADMIN_EMAIL || '', body.currentPassword))) return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 401 })
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 256) return NextResponse.json({ error: 'The new password must be at least 12 characters.' }, { status: 400 })
    update.adminPasswordHash = await hashPassword(body.newPassword)
  }
  await (await getDatabase()).collection<SiteSettings>('siteSettings').updateOne({ _id: 'site' }, { $set: update }, { upsert: true })
  return NextResponse.json({ siteName, logoImage, adminName, adminImage })
}