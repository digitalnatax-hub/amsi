import { randomUUID } from 'node:crypto'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import { getAuthenticatedUser } from '@/lib/user-auth'
import type { ContactMessage, ContactRequest } from '@/lib/contact-request'

export const runtime = 'nodejs'

async function getAccess(id: string) {
  const isAdmin = await isAdminSessionValid()
  const user = isAdmin ? null : await getAuthenticatedUser()
  if (!isAdmin && !user) return { response: NextResponse.json({ error: 'Sign in to view this conversation.' }, { status: 401 }) }
  if (!ObjectId.isValid(id)) return { response: NextResponse.json({ error: 'Conversation not found.' }, { status: 404 }) }

  const request = await (await getDatabase()).collection<ContactRequest>('contactRequests').findOne({ _id: new ObjectId(id) })
  if (!request) return { response: NextResponse.json({ error: 'Conversation not found.' }, { status: 404 }) }
  if (!isAdmin && (!user || !request.ownerUserId?.equals(user._id))) {
    return { response: NextResponse.json({ error: 'You do not have access to this conversation.' }, { status: 403 }) }
  }
  return { isAdmin, request }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const access = await getAccess(id)
    if ('response' in access) return access.response
    const messages = access.request.messages?.length
      ? access.request.messages
      : [{ id: access.request._id?.toHexString() || id, sender: 'member' as const, message: access.request.message, createdAt: access.request.createdAt }]
    return NextResponse.json({ messages })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load this conversation.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const messageText = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!messageText || messageText.length > 5000) {
    return NextResponse.json({ error: 'Write a message up to 5,000 characters.' }, { status: 400 })
  }

  try {
    const access = await getAccess(id)
    if ('response' in access) return access.response
    const message: ContactMessage = {
      id: randomUUID(),
      sender: access.isAdmin ? 'admin' : 'member',
      message: messageText,
      createdAt: new Date().toISOString(),
    }
    const status = access.isAdmin || access.request.status === 'resolved' ? 'in_progress' : access.request.status
    await (await getDatabase()).collection<ContactRequest>('contactRequests').updateOne(
      { _id: access.request._id },
      { $push: { messages: message }, $set: { status, updatedAt: message.createdAt } },
    )
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to send this message.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}