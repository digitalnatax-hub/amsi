import { GridFSBucket, ObjectId } from 'mongodb'
import { Readable } from 'node:stream'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Media not found.' }, { status: 404 })

  try {
    const database = await getDatabase()
    const bucket = new GridFSBucket(database, { bucketName: 'listingMedia' })
    const file = await database.collection('listingMedia.files').findOne({ _id: new ObjectId(id) })
    if (!file) return NextResponse.json({ error: 'Media not found.' }, { status: 404 })

    const stream = bucket.openDownloadStream(new ObjectId(id))
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        'Content-Type': typeof file.metadata?.contentType === 'string' ? file.metadata.contentType : 'application/octet-stream',
        'Content-Length': String(file.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load media.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}