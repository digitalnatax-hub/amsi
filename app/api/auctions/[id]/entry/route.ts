import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { getAuthenticatedUser } from '@/lib/user-auth'
import type { AuctionEntry, AuctionRecord } from '@/lib/auction-types'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to view your auction entry.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })

  try {
    const entry = await (await getDatabase()).collection<AuctionEntry>('auctionEntries')
      .findOne({ auctionId: new ObjectId(id), userId: user._id })
    return NextResponse.json({ entered: Boolean(entry), paymentStatus: entry?.paymentStatus ?? 'not_entered' })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load your auction entry.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Sign in to enter an auction.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })

  try {
    const database = await getDatabase()
    const auction = await database.collection<AuctionRecord>('auctions').findOne({ _id: new ObjectId(id) })
    if (!auction) return NextResponse.json({ error: 'Auction not found.' }, { status: 404 })
    const now = Date.now()
    if (now < Date.parse(auction.startsAt) || now >= Date.parse(auction.endsAt)) {
      return NextResponse.json({ error: 'This auction is not accepting entries.' }, { status: 409 })
    }
    if (auction.entryFee > 0) {
      return NextResponse.json({ error: 'An online payment provider is not configured. No entry fee was charged and bidding remains locked.' }, { status: 503 })
    }

    const entry: AuctionEntry = {
      auctionId: auction._id!,
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      entryFee: 0,
      paymentStatus: 'not_required',
      enteredAt: new Date().toISOString(),
    }
    await database.collection<AuctionEntry>('auctionEntries').updateOne(
      { auctionId: entry.auctionId, userId: entry.userId },
      { $setOnInsert: entry },
      { upsert: true },
    )
    return NextResponse.json({ entered: true, paymentStatus: 'not_required', entryFee: 0 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to enter this auction.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}