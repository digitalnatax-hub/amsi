import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import type { AuctionBid, AuctionRecord } from '@/lib/auction-types'
import { isAdminSessionValid } from '@/lib/admin-session'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })

  try {
    const database = await getDatabase()
    const auction = await database.collection<AuctionRecord>('auctions').findOne({ _id: new ObjectId(id) })
    if (!auction) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
    const bids = await database.collection<AuctionBid>('auctionBids')
      .find({ auctionId: auction._id })
      .sort({ placedAt: -1 })
      .limit(100)
      .toArray()
    const { _id, ...record } = auction
    return NextResponse.json({
      ...record,
      id: _id?.toHexString(),
      bids: bids.map(bid => ({
        id: bid._id.toHexString(),
        bidder: bid.fullName.split(/\s+/).slice(0, 1)[0],
        amount: bid.amount,
        placedAt: bid.placedAt,
      })),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load auction details.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const startsAt = typeof body?.startsAt === 'string' ? new Date(body.startsAt) : new Date(NaN)
  const endsAt = typeof body?.endsAt === 'string' ? new Date(body.endsAt) : new Date(NaN)
  const startingPrice = Number(body?.startingPrice)
  const minimumIncrement = Number(body?.minimumIncrement)
  const entryFee = Number(body?.entryFee)
  if (!title || title.length > 180 || !Number.isSafeInteger(startingPrice) || startingPrice < 1 || !Number.isSafeInteger(minimumIncrement) || minimumIncrement < 1 || !Number.isSafeInteger(entryFee) || entryFee < 0 || !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: 'Enter a title, valid RWF amounts, and an end time after the start time.' }, { status: 400 })
  }
  try {
    const auctions = (await getDatabase()).collection<AuctionRecord>('auctions')
    const current = await auctions.findOne({ _id: new ObjectId(id) })
    if (!current) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
    if (current.bidCount > 0 && startingPrice > current.currentBid) return NextResponse.json({ error: 'Starting price cannot exceed the current bid after bidding has begun.' }, { status: 400 })
    const update = {
      title,
      description: typeof body.description === 'string' ? body.description.slice(0, 10000) : '',
      category: typeof body.category === 'string' ? body.category.slice(0, 100) : 'Other',
      location: typeof body.location === 'string' ? body.location.slice(0, 240) : '',
      startingPrice,
      currentBid: current.bidCount === 0 ? startingPrice : current.currentBid,
      minimumIncrement,
      entryFee,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      rules: typeof body.rules === 'string' ? body.rules.slice(0, 5000) : '',
      media: Array.isArray(body.media) ? body.media : current.media,
    }
    await auctions.updateOne({ _id: current._id }, { $set: update })
    return NextResponse.json({ ...current, ...update, id })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to update this auction.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
  try {
    const database = await getDatabase()
    const auctionId = new ObjectId(id)
    const result = await database.collection<AuctionRecord>('auctions').deleteOne({ _id: auctionId })
    if (!result.deletedCount) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
    await Promise.all([
      database.collection<AuctionBid>('auctionBids').deleteMany({ auctionId }),
      database.collection('auctionEntries').deleteMany({ auctionId }),
    ])
    return NextResponse.json({ deleted: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to delete this auction.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}