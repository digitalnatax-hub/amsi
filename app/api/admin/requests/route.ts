import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminSessionValid } from '@/lib/admin-session'
import type { ContactRequest } from '@/lib/contact-request'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  if (!(await isAdminSessionValid())) {
    return NextResponse.json({ error: 'Admin sign-in is required.' }, { status: 401 })
  }

  const kind = new URL(request.url).searchParams.get('kind')
  if (kind !== 'message' && kind !== 'consultancy') {
    return NextResponse.json({ error: 'Choose a request type.' }, { status: 400 })
  }

  try {
    const records = await (await getDatabase()).collection<ContactRequest>('contactRequests')
      .find({ kind })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()
    return NextResponse.json(records.map(({ _id, ownerUserId, ...record }) => ({ ...record, id: _id.toString(), isAccountOwned: Boolean(ownerUserId) })))
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unable to load requests.'
    return NextResponse.json({ error: detail }, { status: 503 })
  }
}