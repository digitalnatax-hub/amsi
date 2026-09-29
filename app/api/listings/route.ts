import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import type { MarketplaceListing } from '@/lib/listing-types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const database = await getDatabase()
    const listings = await database.collection<MarketplaceListing>('listings')
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json(listings.map(({ _id, ...listing }) => ({ ...listing, id: _id?.toString() })))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load listings.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdminSessionValid())) {
    return NextResponse.json({ error: 'Admin sign-in is required to publish a listing.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as MarketplaceListing | null
  if (!body || !body.title?.trim() || !body.district?.trim() || !body.sector?.trim() || !body.category?.trim()) {
    return NextResponse.json({ error: 'Title, category, district and sector are required.' }, { status: 400 })
  }

  const listing: MarketplaceListing = {
    ...body,
    title: body.title.trim(),
    slug: body.slug || `${body.title}-${crypto.randomUUID()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    status: body.status === 'draft' ? 'draft' : 'published',
    media: Array.isArray(body.media) ? body.media : [],
    features: Array.isArray(body.features) ? body.features : [],
    createdAt: new Date().toISOString(),
  }

  try {
    const result = await (await getDatabase()).collection<MarketplaceListing>('listings').insertOne(listing)
    return NextResponse.json({ ...listing, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save the listing.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}