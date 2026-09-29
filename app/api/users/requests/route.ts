import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/user-auth'
import type { ContactRequest } from '@/lib/contact-request'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to view your requests.' }, { status: 401 })
  const kind = new URL(request.url).searchParams.get('kind')
  if (kind !== 'message' && kind !== 'consultancy') {
    return NextResponse.json({ error: 'Choose a request type.' }, { status: 400 })
  }

  try {
    const requests = await (await getDatabase()).collection<ContactRequest>('contactRequests')
      .find({ ownerUserId: user._id, kind })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()
    return NextResponse.json(requests.map(({ _id, ownerUserId, ...item }) => ({ ...item, id: _id?.toHexString() })))
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load your requests.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}