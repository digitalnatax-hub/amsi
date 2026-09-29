import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/mongodb'

const scrypt = promisify(scryptCallback)
const cookieName = 'amsi_user_session'
const sessionDuration = 60 * 60 * 24 * 14

export type UserAccount = {
  _id: ObjectId
  fullName: string
  email: string
  phone: string
  passwordHash: string
  role: 'member'
  status?: 'active' | 'suspended'
  profileImage?: string
  createdAt: string
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, salt, 64) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, savedHex] = storedHash.split(':')
  if (!salt || !savedHex || !/^[a-f0-9]{128}$/i.test(savedHex)) return false
  const saved = Buffer.from(savedHex, 'hex')
  const candidate = await scrypt(password, salt, saved.length) as Buffer
  return saved.length === candidate.length && timingSafeEqual(saved, candidate)
}

function sessionSignature(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('Session signing secret is not configured.')
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export async function createUserSession(userId: ObjectId) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDuration
  const payload = `${userId.toHexString()}:${expiresAt}`
  const jar = await cookies()
  jar.set(cookieName, `${payload}:${sessionSignature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDuration,
  })
}

export async function clearUserSession() {
  (await cookies()).delete(cookieName)
}

export async function getAuthenticatedUser() {
  const token = (await cookies()).get(cookieName)?.value
  if (!token) return null
  const [id, expiresAtText, suppliedSignature] = token.split(':')
  const expiresAt = Number(expiresAtText)
  if (!ObjectId.isValid(id) || !expiresAt || expiresAt <= Date.now() / 1000 || !suppliedSignature) return null
  const payload = `${id}:${expiresAtText}`
  const expected = Buffer.from(sessionSignature(payload), 'hex')
  const supplied = Buffer.from(suppliedSignature, 'hex')
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

  const user = await (await getDatabase()).collection<UserAccount>('users').findOne({ _id: new ObjectId(id) })
  return user?.status === 'suspended' ? null : user
}