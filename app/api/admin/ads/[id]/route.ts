import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import { adPlacements, isYouTubeUrl, type Advertisement, type AdFormat } from '@/lib/advertisement-types'

export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Advertisement not found.' }, { status: 404 })
  const body = await request.json().catch(() => null)
  const update = validateAd(body)
  if (!update) return NextResponse.json({ error: 'Check the ad format, placement and creative details.' }, { status: 400 })
  try {
    const result = await (await getDatabase()).collection<Advertisement>('advertisements').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date().toISOString() } },
    )
    if (!result.matchedCount) return NextResponse.json({ error: 'Advertisement not found.' }, { status: 404 })
    return NextResponse.json({ id, ...update })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update this advertisement.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Advertisement not found.' }, { status: 404 })
  try {
    const result = await (await getDatabase()).collection<Advertisement>('advertisements').deleteOne({ _id: new ObjectId(id) })
    if (!result.deletedCount) return NextResponse.json({ error: 'Advertisement not found.' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete this advertisement.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

function validateAd(body: any): Omit<Advertisement, '_id' | 'createdAt' | 'updatedAt'> | null {
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const format = body?.format as AdFormat
  const placement = body?.placement
  if (!title || title.length > 120 || !['image', 'video', 'youtube'].includes(format) || !adPlacements.includes(placement)) return null
  const linkUrl = typeof body.linkUrl === 'string' ? body.linkUrl.trim() : ''
  if (linkUrl) {
    try { if (!['http:', 'https:'].includes(new URL(linkUrl).protocol)) return null } catch { return null }
  }
  if (format === 'youtube') {
    const youtubeUrl = typeof body.youtubeUrl === 'string' ? body.youtubeUrl.trim() : ''
    if (!isYouTubeUrl(youtubeUrl)) return null
    return { title, format, placement, youtubeUrl, linkUrl, active: body.active !== false }
  }
  const asset = body.asset
  if (!asset || typeof asset.id !== 'string' || !/^[a-f0-9]{24}$/i.test(asset.id) || typeof asset.name !== 'string' || typeof asset.contentType !== 'string') return null
  if (format === 'video' && !asset.contentType.startsWith('video/')) return null
  if (format === 'image' && !asset.contentType.startsWith('image/')) return null
  return { title, format, placement, asset, linkUrl, active: body.active !== false }
}