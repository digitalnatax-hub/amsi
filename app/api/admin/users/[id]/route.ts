import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import { hashPassword, type UserAccount } from '@/lib/user-auth'

export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  const body = await request.json().catch(() => null)
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const status = body?.status
  if (!fullName || fullName.length > 120 || !phone || phone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || (status !== 'active' && status !== 'suspended')) {
    return NextResponse.json({ error: 'Enter valid account details and status.' }, { status: 400 })
  }
  if (email === process.env.ADMIN_EMAIL?.toLowerCase()) return NextResponse.json({ error: 'That email is reserved for platform administration.' }, { status: 409 })
  const update: Record<string, unknown> = { fullName, email, phone, status }
  if (body?.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) return NextResponse.json({ error: 'Password must be at least 12 characters.' }, { status: 400 })
    update.passwordHash = await hashPassword(body.password)
  }
  try {
    const result = await (await getDatabase()).collection<UserAccount>('users').updateOne({ _id: new ObjectId(id) }, { $set: update })
    if (!result.matchedCount) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    return NextResponse.json({ id, fullName, email, phone, status })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    const message = error instanceof Error ? error.message : 'Unable to update this account.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  const result = await (await getDatabase()).collection<UserAccount>('users').deleteOne({ _id: new ObjectId(id) })
  if (!result.deletedCount) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}