import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import type { AuctionRecord } from '@/lib/auction-types'
import type { MarketplaceListing } from '@/lib/listing-types'

export const runtime = 'nodejs'

type ChatTurn = { role: 'user' | 'assistant'; content: string }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const history = normalizeHistory(body?.history)
  if (!message || message.length > 2000) return NextResponse.json({ error: 'Write a message under 2,000 characters.' }, { status: 400 })
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'The AI advisor is not configured yet. Add OPENAI_API_KEY to the server environment.' }, { status: 503 })

  try {
    const database = await getDatabase()
    const now = new Date().toISOString()
    const [listingRecords, auctionRecords] = await Promise.all([
      database.collection<MarketplaceListing>('listings').find({ status: 'published' }).sort({ createdAt: -1 }).limit(60).toArray(),
      database.collection<AuctionRecord>('auctions').find({ endsAt: { $gt: now } }).sort({ endsAt: 1 }).limit(30).toArray(),
    ])
    const listings = listingRecords.map(({ title, category, purpose, price, negotiable, district, sector, area, plotSize, zoning, descriptionEnglish, slug }) => ({
      title, category, purpose, price, negotiable, district, sector, area, plotSize, zoning, summary: descriptionEnglish?.slice(0, 360), slug,
    }))
    const auctions = auctionRecords.map(({ title, category, location, currentBid, minimumIncrement, startsAt, endsAt, bidCount }) => ({
      title, category, location, currentBid, minimumIncrement, startsAt, endsAt, bidCount,
    }))

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      max_completion_tokens: 700,
      messages: [
        {
          role: 'system',
          content: `You are AMSI's property and investment advisor. Have a natural, multi-turn conversation: answer the user's actual question, ask one useful follow-up when needed, and remember prior turns. Use RWF unless the user specifies otherwise. Ground recommendations only in the current inventory data below. Never invent an item, price, availability, rental yield, legal fact, or investment return. If nothing fits the user's budget or goals, say so and offer the closest real options or explain what more information you need. For budget/project questions, compare relevant listed properties and active auctions, account for asking/current prices, and explain trade-offs without guaranteeing outcomes. Clearly distinguish listings for sale, rent, and auction. Keep responses clear and concise.\n\nCURRENT PUBLISHED LISTINGS (JSON): ${JSON.stringify(listings)}\n\nCURRENT UPCOMING AUCTIONS (JSON): ${JSON.stringify(auctions)}`,
        },
        ...history,
        { role: 'user', content: message },
      ],
    })
    const reply = response.choices[0]?.message.content?.trim()
    if (!reply) return NextResponse.json({ error: 'The advisor did not return a response. Please try again.' }, { status: 502 })
    return NextResponse.json({ reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach the AI advisor.'
    return NextResponse.json({ error: `The AI advisor is temporarily unavailable. ${message}` }, { status: 503 })
  }
}

function normalizeHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return []
  return value.slice(-12).flatMap(item => {
    if (!item || typeof item !== 'object' || !('role' in item) || !('content' in item)) return []
    const role = item.role
    const content = item.content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) return []
    return [{ role, content: content.slice(0, 2000) }]
  })
}