import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { getDatabase } from '@/lib/mongodb'
import { verifyPassword } from '@/lib/user-auth'

const cookieName = 'amsi_admin_session'
const sessionDuration = 60 * 60 * 8

function signature(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.')
  return createHmac('sha256', secret).update(value).digest('hex')
}

export async function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return false

  const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase()
  if (!emailMatches) return false
  const settings = await (await getDatabase()).collection<{ _id: string; adminPasswordHash?: string }>('siteSettings').findOne({ _id: 'site' })
  const passwordMatches = settings?.adminPasswordHash
    ? await verifyPassword(password, settings.adminPasswordHash)
    : password === adminPassword
  return emailMatches && passwordMatches
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDuration
  const value = `${process.env.ADMIN_EMAIL}:${expiresAt}`
  const jar = await cookies()
  jar.set(cookieName, `${value}:${signature(value)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionDuration,
  })
}

export async function clearAdminSession() {
  const jar = await cookies()
  jar.delete(cookieName)
}

export async function isAdminSessionValid() {
  const token = (await cookies()).get(cookieName)?.value
  if (!token) return false

  const [email, expiresAtText, suppliedSignature] = token.split(':')
  const expiresAt = Number(expiresAtText)
  if (!email || !expiresAt || expiresAt <= Date.now() / 1000 || !suppliedSignature) return false
  if (email !== process.env.ADMIN_EMAIL) return false

  const expectedSignature = signature(`${email}:${expiresAtText}`)
  const expected = Buffer.from(expectedSignature, 'hex')
  const supplied = Buffer.from(suppliedSignature, 'hex')
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}