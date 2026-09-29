import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/user-auth'
import type { MarketplaceListing } from '@/lib/listing-types'

export const runtime = 'nodejs'
type SavedListingDocument = Omit<MarketplaceListing, '_id'>

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to view saved listings.' }, { status: 401 })

  try {
    const database = await getDatabase()
    const favorites = await database.collection('favorites').find({ userId: user._id }).sort({ savedAt: -1 }).toArray()
    const listingIds = favorites.map(favorite => favorite.listingId as ObjectId)
    const listings = await database.collection<SavedListingDocument>('listings')
      .find({ _id: { $in: listingIds }, status: 'published' })
      .toArray()
    return NextResponse.json(listings.map(({ _id, ...listing }) => ({ ...listing, id: _id.toHexString() })))
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load saved listings.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to save listings.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (typeof body?.listingId !== 'string' || !ObjectId.isValid(body.listingId)) {
    return NextResponse.json({ error: 'Choose a valid listing.' }, { status: 400 })
  }

  try {
    const database = await getDatabase()
    const listingId = new ObjectId(body.listingId)
    const listing = await database.collection<SavedListingDocument>('listings').findOne({ _id: listingId, status: 'published' })
    if (!listing) return NextResponse.json({ error: 'This listing is not available.' }, { status: 404 })
    const favorites = database.collection('favorites')
    await favorites.createIndex({ userId: 1, listingId: 1 }, { unique: true })
    await favorites.updateOne(
      { userId: user._id, listingId },
      { $setOnInsert: { userId: user._id, listingId, savedAt: new Date().toISOString() } },
      { upsert: true },
    )
    return NextResponse.json({ saved: true, listingId: listingId.toHexString() })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to save this listing.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to manage saved listings.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (typeof body?.listingId !== 'string' || !ObjectId.isValid(body.listingId)) {
    return NextResponse.json({ error: 'Choose a valid listing.' }, { status: 400 })
  }

  try {
    const result = await (await getDatabase()).collection('favorites').deleteOne({
      userId: user._id,
      listingId: new ObjectId(body.listingId),
    })
    return NextResponse.json({ saved: false, removed: result.deletedCount > 0 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to remove this listing.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}