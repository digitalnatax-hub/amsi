import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/user-auth'
import type { AuctionBid, AuctionEntry, AuctionRecord } from '@/lib/auction-types'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to view your auction activity.' }, { status: 401 })

  try {
    const database = await getDatabase()
    const entries = await database.collection<AuctionEntry>('auctionEntries')
      .find({ userId: user._id })
      .sort({ enteredAt: -1 })
      .toArray()

    const result = await Promise.all(entries.map(async entry => {
      const auction = await database.collection<AuctionRecord>('auctions').findOne({ _id: entry.auctionId })
      if (!auction) return null
      const latestBid = await database.collection<AuctionBid>('auctionBids')
        .find({ auctionId: entry.auctionId, userId: user._id })
        .sort({ amount: -1, placedAt: -1 })
        .limit(1)
        .next()
      const competitorCount = await database.collection<AuctionBid>('auctionBids')
        .distinct('userId', { auctionId: entry.auctionId, userId: { $ne: user._id } })
      const ended = Date.now() >= Date.parse(auction.endsAt)
      return {
        id: auction._id?.toHexString(),
        title: auction.title,
        currentBid: auction.currentBid,
        bidCount: auction.bidCount,
        competitorCount: competitorCount.length,
        startsAt: auction.startsAt,
        endsAt: auction.endsAt,
        entryFee: entry.entryFee,
        paymentStatus: entry.paymentStatus,
        yourHighestBid: latestBid?.amount ?? 0,
        status: ended ? (auction.currentBidderId === user._id.toHexString() ? 'won' : 'ended') : auction.currentBidderId === user._id.toHexString() ? 'leading' : 'outbid',
      }
    }))
    return NextResponse.json(result.filter(Boolean))
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load auction activity.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}