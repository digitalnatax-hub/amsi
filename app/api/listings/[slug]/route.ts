import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import { ObjectId } from 'mongodb'
import type { MarketplaceListing } from '@/lib/listing-types'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const listing = await (await getDatabase()).collection<MarketplaceListing>('listings')
      .findOne({ slug, status: 'published' })
    if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    const { _id, ...result } = listing
    return NextResponse.json({ ...result, id: _id?.toString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load this listing.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { slug } = await params
  const body = await request.json().catch(() => null) as Partial<MarketplaceListing> | null
  if (!body || !body.title?.trim() || !body.district?.trim() || !body.sector?.trim() || !body.category?.trim()) {
    return NextResponse.json({ error: 'Title, category, district and sector are required.' }, { status: 400 })
  }
  try {
    const listings = (await getDatabase()).collection<MarketplaceListing>('listings')
    const listing = await listings.findOne(ObjectId.isValid(slug) ? { _id: new ObjectId(slug) } : { slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    const update: Partial<MarketplaceListing> = {
      ...body,
      title: body.title.trim(),
      slug: listing.slug,
      media: Array.isArray(body.media) ? body.media : listing.media,
      features: Array.isArray(body.features) ? body.features : [],
      status: body.status === 'draft' ? 'draft' : 'published',
    }
    await listings.updateOne({ _id: listing._id }, { $set: update })
    return NextResponse.json({ ...listing, ...update, id: listing._id?.toString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update this listing.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { slug } = await params
  try {
    const result = await (await getDatabase()).collection<MarketplaceListing>('listings')
      .deleteOne(ObjectId.isValid(slug) ? { _id: new ObjectId(slug) } : { slug })
    if (!result.deletedCount) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete this listing.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}