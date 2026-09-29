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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'The live advisor is not configured yet. Add GEMINI_API_KEY to the server environment.' }, { status: 503 })

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

    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
    if (!/^[a-z0-9.-]+$/i.test(model)) return NextResponse.json({ error: 'GEMINI_MODEL contains an invalid model name.' }, { status: 500 })
    const systemInstruction = `You are AMSI's friendly AI assistant. Be conversational and natural: greet people warmly, answer ordinary general-interest questions helpfully and concisely, and never pretend to be human. Your specialty is AMSI's property marketplace, rentals, budget/project ideas, auctions and consultancy. For unrelated topics, answer briefly and gently guide the conversation back when appropriate; do not refuse harmless questions. For property or investment-project recommendations, use RWF unless told otherwise and use only current inventory below for item names, prices and availability. Never invent listings, prices, yields, legal facts or guaranteed returns. Clearly distinguish sales, rentals and auctions; explain trade-offs, and state when nothing fits. Do not present yourself as a financial or legal professional. If the client is dissatisfied, asks for a human, or needs tailored follow-up, tell them they can contact AMSI consultants using the handoff in this chat. Ask a useful follow-up when needed.\n\nCURRENT PUBLISHED LISTINGS (JSON): ${JSON.stringify(listings)}\n\nCURRENT UPCOMING AUCTIONS (JSON): ${JSON.stringify(auctions)}`
    const contents = [
      ...history.map(turn => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] })),
      { role: 'user', parts: [{ text: message }] },
    ]
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { maxOutputTokens: 700, temperature: 0.8 },
    })
    let response: Response | undefined
    for (const delay of [0, 500, 1200]) {
      if (delay) await new Promise(resolve => setTimeout(resolve, delay))
      response = await requestGemini(model, apiKey, payload)
      if (response.status !== 503 && response.status !== 504) break
    }
    if (!response) return NextResponse.json({ error: 'The AI provider did not return a response. Please try again.' }, { status: 502 })
    if (!response.ok) {
      const result = await response.json().catch(() => null)
      const details = typeof result?.error?.message === 'string' ? result.error.message : ''
      if (response.status === 429) return NextResponse.json({ error: 'The Gemini free-tier quota is temporarily exhausted. Please try again later or contact our consultants.' }, { status: 429 })
      if (response.status === 400 || response.status === 403) return NextResponse.json({ error: `Gemini could not accept this request. Check your AI Studio API key, project and model access.${details ? ` ${details}` : ''}` }, { status: 502 })
      if (response.status === 503 || response.status === 504) return NextResponse.json({ error: 'Gemini is temporarily overloaded. Please try again in a moment or contact our consultants.' }, { status: 503 })
      return NextResponse.json({ error: 'The live advisor is temporarily unavailable. Please try again or contact our consultants.' }, { status: 503 })
    }
    const result = await response.json()
    const reply = Array.isArray(result?.candidates?.[0]?.content?.parts)
      ? result.candidates[0].content.parts.map((part: { text?: string }) => part.text || '').join('').trim()
      : ''
    if (!reply) return NextResponse.json({ error: 'The advisor could not form a response. Please try again or contact our consultants.' }, { status: 502 })
    return NextResponse.json({ reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach the AI advisor.'
    return NextResponse.json({ error: `The AI advisor is temporarily unavailable. ${message}` }, { status: 503 })
  }
}

function requestGemini(model: string, apiKey: string, body: string) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body,
    cache: 'no-store',
  })
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