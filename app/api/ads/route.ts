import { NextResponse } from 'next/server'
import type { Filter } from 'mongodb'
import { getDatabase } from '@/lib/mongodb'
import { adPlacements, type Advertisement, type AdPlacement } from '@/lib/advertisement-types'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const placement = new URL(request.url).searchParams.get('placement')
  if (placement && !adPlacements.includes(placement as typeof adPlacements[number])) return NextResponse.json({ error: 'Choose a valid ad placement.' }, { status: 400 })
  try {
    const query: Filter<Advertisement> = placement
      ? { active: true, placement: placement as AdPlacement }
      : { active: true }
    const ads = await (await getDatabase()).collection<Advertisement>('advertisements').find(query).sort({ createdAt: -1 }).toArray()
    return NextResponse.json(ads.map(({ _id, ...ad }) => ({ ...ad, id: _id?.toHexString() })))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load advertisements.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}