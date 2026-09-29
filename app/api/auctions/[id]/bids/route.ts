import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/user-auth'
import { getDatabase, getMongoClient } from '@/lib/mongodb'
import type { AuctionBid, AuctionEntry, AuctionRecord } from '@/lib/auction-types'

export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to place a bid.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)
  if (!Number.isSafeInteger(amount) || amount < 1) return NextResponse.json({ error: 'Enter a valid bid in RWF.' }, { status: 400 })

  const auctionId = new ObjectId(id)
  const database = await getDatabase()
  const auction = await database.collection<AuctionRecord>('auctions').findOne({ _id: auctionId })
  if (!auction) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
  const now = Date.now()
  if (now < Date.parse(auction.startsAt) || now >= Date.parse(auction.endsAt)) {
    return NextResponse.json({ error: 'This auction is not currently live.' }, { status: 409 })
  }
  if (auction.entryFee > 0) return NextResponse.json({ error: 'Bidding is locked until an online entry-fee payment provider is configured.' }, { status: 503 })

  const entries = database.collection<AuctionEntry>('auctionEntries')
  const entry = await entries.findOne({ auctionId, userId: user._id, paymentStatus: { $in: ['paid', 'not_required'] } })
  if (!entry) return NextResponse.json({ error: 'Enter this auction before bidding.' }, { status: 403 })
  if (amount < auction.currentBid + auction.minimumIncrement) {
    return NextResponse.json({ error: `The minimum next bid is RWF ${(auction.currentBid + auction.minimumIncrement).toLocaleString()}.` }, { status: 400 })
  }

  const client = await getMongoClient()
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      const changed = await database.collection<AuctionRecord>('auctions').updateOne(
        { _id: auctionId, currentBid: auction.currentBid, endsAt: { $gt: new Date().toISOString() } },
        { $set: { currentBid: amount, currentBidderId: user._id.toHexString(), currentBidderName: user.fullName }, $inc: { bidCount: 1 } },
        { session },
      )
      if (!changed.matchedCount) throw new Error('The current bid changed. Refresh and try again.')
      const bid: AuctionBid = { auctionId, userId: user._id, fullName: user.fullName, amount, placedAt: new Date().toISOString() }
      await database.collection<AuctionBid>('auctionBids').insertOne(bid, { session })
    })
    return NextResponse.json({ bid: amount, status: 'accepted' }, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to place your bid.'
    return NextResponse.json({ error: detail }, { status: 409 })
  } finally {
    await session.endSession()
  }
}