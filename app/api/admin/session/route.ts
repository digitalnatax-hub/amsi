import { NextResponse } from 'next/server'
import { clearAdminSession, createAdminSession, isAdminSessionValid, verifyAdminCredentials } from '@/lib/admin-session'

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminSessionValid() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Enter your admin email and password.' }, { status: 400 })
  }

  try {
    if (!(await verifyAdminCredentials(body.email, body.password))) {
      return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 })
    }
    await createAdminSession()
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start an admin session.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function DELETE() {
  await clearAdminSession()
  return NextResponse.json({ authenticated: false })
}