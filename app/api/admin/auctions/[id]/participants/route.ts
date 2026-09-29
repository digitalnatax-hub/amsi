import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import type { AuctionBid, AuctionEntry, AuctionRecord } from '@/lib/auction-types'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })

  try {
    const database = await getDatabase()
    const auctionId = new ObjectId(id)
    const auction = await database.collection<AuctionRecord>('auctions').findOne({ _id: auctionId })
    if (!auction) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
    const [entries, bids] = await Promise.all([
      database.collection<AuctionEntry>('auctionEntries').find({ auctionId }).sort({ enteredAt: -1 }).toArray(),
      database.collection<AuctionBid>('auctionBids').find({ auctionId }).sort({ amount: -1 }).toArray(),
    ])
    const highestByUser = new Map<string, number>()
    for (const bid of bids) {
      const bidderId = bid.userId.toHexString()
      if (!highestByUser.has(bidderId)) highestByUser.set(bidderId, bid.amount)
    }
    const ended = Date.now() >= Date.parse(auction.endsAt)
    return NextResponse.json({
      currentBid: auction.currentBid,
      bidCount: auction.bidCount,
      entryFee: auction.entryFee,
      winnerName: ended ? auction.currentBidderName ?? null : null,
      winnerAmount: ended && auction.bidCount > 0 ? auction.currentBid : null,
      participants: entries.map(entry => {
        const userId = entry.userId.toHexString()
        const highestBid = highestByUser.get(userId) ?? 0
        return {
          id: userId,
          fullName: entry.fullName,
          email: entry.email,
          phone: entry.phone,
          entryFee: entry.entryFee,
          paymentStatus: entry.paymentStatus,
          enteredAt: entry.enteredAt,
          highestBid,
          isLeading: Boolean(highestBid && auction.currentBidderId === userId),
          outcome: ended ? (highestBid > 0 && auction.currentBidderId === userId ? 'winner' : 'outbid') : (highestBid > 0 && auction.currentBidderId === userId ? 'leading' : highestBid > 0 ? 'outbid' : 'entered'),
        }
      }),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load auction participants.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}