import { randomUUID } from 'node:crypto'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/user-auth'
import type { ContactMessage, ContactRequest } from '@/lib/contact-request'
import type { MarketplaceListing } from '@/lib/listing-types'

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

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to contact AMSI about a listing.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (typeof body?.listingId !== 'string' || !ObjectId.isValid(body.listingId)) {
    return NextResponse.json({ error: 'Choose a valid listing.' }, { status: 400 })
  }

  try {
    const database = await getDatabase()
    const listing = await database.collection<MarketplaceListing>('listings').findOne({
      _id: new ObjectId(body.listingId),
      status: 'published',
    })
    if (!listing) return NextResponse.json({ error: 'This listing is no longer available.' }, { status: 404 })

    const createdAt = new Date().toISOString()
    const firstMessage: ContactMessage = {
      id: randomUUID(),
      sender: 'member',
      message: `I would like more information about ${listing.title}.`,
      createdAt,
    }
    const record: Omit<ContactRequest, 'id' | '_id'> = {
      ownerUserId: user._id,
      kind: 'message',
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      topic: `Listing inquiry: ${listing.title}`,
      preferredTime: '',
      message: firstMessage.message,
      messages: [firstMessage],
      listingId: listing._id?.toHexString(),
      listingTitle: listing.title,
      status: 'new',
      createdAt,
    }
    const result = await database.collection<Omit<ContactRequest, 'id'>>('contactRequests').insertOne(record)
    return NextResponse.json({ id: result.insertedId.toHexString() }, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to start this conversation.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}