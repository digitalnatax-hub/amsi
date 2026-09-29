import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import { hashPassword, type UserAccount } from '@/lib/user-auth'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  try {
    const users = await (await getDatabase()).collection<UserAccount>('users')
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json(users.map(({ _id, ...user }) => ({ ...user, id: _id.toHexString(), status: user.status || 'active' })))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load member accounts.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!fullName || fullName.length > 120 || !phone || phone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 256) {
    return NextResponse.json({ error: 'Enter a valid name, email, phone, and password of at least 12 characters.' }, { status: 400 })
  }
  if (email === process.env.ADMIN_EMAIL?.toLowerCase()) return NextResponse.json({ error: 'That email is reserved for platform administration.' }, { status: 409 })
  try {
    const user: Omit<UserAccount, '_id'> = { fullName, email, phone, passwordHash: await hashPassword(password), role: 'member', status: 'active', profileImage: '', createdAt: new Date().toISOString() }
    const users = (await getDatabase()).collection<UserAccount>('users')
    await users.createIndex({ email: 1 }, { unique: true })
    const result = await users.insertOne(user as UserAccount)
    return NextResponse.json({ id: result.insertedId.toHexString(), fullName, email, phone, role: 'member', status: 'active', profileImage: '', createdAt: user.createdAt }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    const message = error instanceof Error ? error.message : 'Unable to create this account.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}