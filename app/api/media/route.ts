import { GridFSBucket } from 'mongodb'
import { finished } from 'node:stream/promises'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import { getAuthenticatedUser } from '@/lib/user-auth'

export const runtime = 'nodejs'

const maxFileSize = 100 * 1024 * 1024

export async function POST(request: Request) {
  const isAdmin = await isAdminSessionValid()
  const user = isAdmin ? null : await getAuthenticatedUser()
  if (!isAdmin && !user) return NextResponse.json({ error: 'Sign in to upload media.' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File) || (!file.type.startsWith('image/') && (user || !file.type.startsWith('video/')))) {
    return NextResponse.json({ error: 'Choose an image or video file.' }, { status: 400 })
  }
  const fileLimit = user ? 5 * 1024 * 1024 : maxFileSize
  if (file.size === 0 || file.size > fileLimit) {
    return NextResponse.json({ error: `Each media file must be smaller than ${user ? '5 MB' : '100 MB'}.` }, { status: 413 })
  }

  try {
    const database = await getDatabase()
    const bucket = new GridFSBucket(database, { bucketName: 'listingMedia' })
    const upload = bucket.openUploadStream(file.name, {
      metadata: { contentType: file.type, originalName: file.name, ...(user ? { userId: user._id.toHexString(), purpose: 'profile' } : {}) },
    })
    upload.end(Buffer.from(await file.arrayBuffer()))
    await finished(upload)
    return NextResponse.json({ id: upload.id.toString(), name: file.name, contentType: file.type }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upload media.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}