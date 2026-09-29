import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { createUserSession, hashPassword, type UserAccount } from '@/lib/user-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!fullName || fullName.length > 120 || !phone || phone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 256) {
    return NextResponse.json({ error: 'Enter your name, valid email, phone, and a password of at least 12 characters.' }, { status: 400 })
  }
  if (email === process.env.ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ error: 'That email is reserved for platform administration.' }, { status: 409 })
  }

  try {
    const users = (await getDatabase()).collection<Omit<UserAccount, '_id'>>('users')
    await users.createIndex({ email: 1 }, { unique: true })
    const user: Omit<UserAccount, '_id'> = {
      fullName,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: 'member',
      status: 'active',
      profileImage: '',
      createdAt: new Date().toISOString(),
    }
    const { insertedId } = await users.insertOne(user)
    await createUserSession(insertedId)
    return NextResponse.json({ id: insertedId.toHexString(), fullName, email, phone, role: 'member' }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }
    const detail = error instanceof Error ? error.message : 'Unable to create your account.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}