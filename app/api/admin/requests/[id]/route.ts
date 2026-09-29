import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'

export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) {
    return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  }

  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  const body = await request.json().catch(() => null)
  const status = body?.status
  if (status !== 'in_progress' && status !== 'resolved') {
    return NextResponse.json({ error: 'Choose a valid request status.' }, { status: 400 })
  }

  try {
    const result = await (await getDatabase()).collection('contactRequests').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date().toISOString() } },
    )
    if (!result.matchedCount) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
    return NextResponse.json({ id, status })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to update this request.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionValid())) return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  try {
    const result = await (await getDatabase()).collection('contactRequests').deleteOne({ _id: new ObjectId(id) })
    if (!result.deletedCount) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to delete this request.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}