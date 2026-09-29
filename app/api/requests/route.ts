import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/user-auth'
import type { ContactRequest } from '@/lib/contact-request'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Complete the contact form and try again.' }, { status: 400 })
  }

  const kind = body.kind === 'consultancy' ? 'consultancy' : body.kind === 'message' ? 'message' : null
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!kind || !fullName || !email || !phone || !message || fullName.length > 120 || email.length > 254 || phone.length > 40 || message.length > 10000) {
    return NextResponse.json({ error: 'Name, email, phone and a message are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  const user = await getAuthenticatedUser()
  const contactRequest: Omit<ContactRequest, 'id' | '_id'> = {
    kind,
    ...(user ? { ownerUserId: user._id } : {}),
    fullName,
    email,
    phone,
    topic: typeof body.topic === 'string' ? body.topic.trim().slice(0, 120) : '',
    preferredTime: typeof body.preferredTime === 'string' ? body.preferredTime.trim().slice(0, 160) : '',
    message,
    status: 'new',
    createdAt: new Date().toISOString(),
  }

  try {
    const result = await (await getDatabase()).collection('contactRequests').insertOne(contactRequest)
    return NextResponse.json({ id: result.insertedId.toString(), status: contactRequest.status }, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to save your request.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}