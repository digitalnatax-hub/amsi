import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import type { AuctionRecord } from '@/lib/auction-types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const auctions = await (await getDatabase()).collection<AuctionRecord>('auctions')
      .find()
      .sort({ startsAt: 1 })
      .toArray()
    return NextResponse.json(auctions.map(({ _id, ...auction }) => ({ ...auction, id: _id?.toHexString() })))
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load auctions.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const startingPrice = Number(body?.startingPrice)
  const minimumIncrement = Number(body?.minimumIncrement)
  const entryFee = Number(body?.entryFee)
  const startsAt = typeof body?.startsAt === 'string' ? new Date(body.startsAt) : new Date(NaN)
  const endsAt = typeof body?.endsAt === 'string' ? new Date(body.endsAt) : new Date(NaN)
  if (!title || title.length > 180 || !Number.isSafeInteger(startingPrice) || startingPrice < 1 || !Number.isSafeInteger(minimumIncrement) || minimumIncrement < 1 || !Number.isSafeInteger(entryFee) || entryFee < 0 || !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: 'Enter a title, valid RWF amounts, and an end time after the start time.' }, { status: 400 })
  }

  const auction: AuctionRecord = {
    title,
    description: typeof body.description === 'string' ? body.description.slice(0, 10000) : '',
    category: typeof body.category === 'string' ? body.category.slice(0, 100) : 'Other',
    location: typeof body.location === 'string' ? body.location.slice(0, 240) : '',
    startingPrice,
    currentBid: startingPrice,
    minimumIncrement,
    entryFee,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    rules: typeof body.rules === 'string' ? body.rules.slice(0, 5000) : '',
    media: Array.isArray(body.media) ? body.media : [],
    bidCount: 0,
    createdAt: new Date().toISOString(),
  }

  try {
    const result = await (await getDatabase()).collection<AuctionRecord>('auctions').insertOne(auction)
    return NextResponse.json({ ...auction, id: result.insertedId.toHexString() }, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to create the auction.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}