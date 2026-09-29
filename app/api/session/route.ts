import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { clearAdminSession, createAdminSession, verifyAdminCredentials } from '@/lib/admin-session'
import { clearUserSession, createUserSession, verifyPassword, type UserAccount } from '@/lib/user-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password) return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 })

  try {
    if (await verifyAdminCredentials(email, password)) {
      await clearUserSession()
      await createAdminSession()
      return NextResponse.json({ authenticated: true, role: 'admin' })
    }

    if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
      return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 })
    }

    const user = await (await getDatabase()).collection<UserAccount>('users').findOne({ email })
    if (!user || user.status === 'suspended' || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 })
    }

    await clearAdminSession()
    await createUserSession(user._id)
    return NextResponse.json({ authenticated: true, role: 'member' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}