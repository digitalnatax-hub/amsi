import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { clearUserSession, createUserSession, getAuthenticatedUser, hashPassword, verifyPassword, type UserAccount } from '@/lib/user-auth'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 })
  return NextResponse.json({ authenticated: true, user: { id: user._id.toHexString(), fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, profileImage: user.profileImage || '' } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password) return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 })

  try {
    const user = await (await getDatabase()).collection<UserAccount>('users').findOne({ email })
    if (!user || user.status === 'suspended' || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 })
    }
    await createUserSession(user._id)
    return NextResponse.json({ authenticated: true, user: { id: user._id.toHexString(), fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, profileImage: user.profileImage || '' } })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to sign in.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function DELETE() {
  await clearUserSession()
  return NextResponse.json({ authenticated: false })
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to update your account.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const profileImage = typeof body?.profileImage === 'string' ? body.profileImage : undefined
  if (!fullName || fullName.length > 120 || !phone || phone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid name, email, and phone number.' }, { status: 400 })
  }

  const update: Record<string, string> = { fullName, email, phone }
  if (profileImage !== undefined) {
    if (profileImage && !/^\/api\/media\/[a-f0-9]{24}$/i.test(profileImage)) {
      return NextResponse.json({ error: 'Choose a valid profile image.' }, { status: 400 })
    }
    update.profileImage = profileImage
  }
  if (body?.newPassword) {
    if (typeof body.currentPassword !== 'string' || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 401 })
    }
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 256) {
      return NextResponse.json({ error: 'The new password must be at least 12 characters.' }, { status: 400 })
    }
    update.passwordHash = await hashPassword(body.newPassword)
  }

  try {
    const users = (await getDatabase()).collection<UserAccount>('users')
    await users.createIndex({ email: 1 }, { unique: true })
    await users.updateOne({ _id: user._id }, { $set: update })
    return NextResponse.json({ id: user._id.toHexString(), fullName, email, phone, role: user.role, profileImage: profileImage ?? user.profileImage ?? '' })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }
    const detail = error instanceof Error ? error.message : 'Unable to update your account.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}