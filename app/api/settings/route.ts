import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await (await getDatabase()).collection<{ _id: string; siteName?: string; logoImage?: string }>('siteSettings').findOne({ _id: 'site' })
    return NextResponse.json({ siteName: settings?.siteName || 'AMSI & Co.', logoImage: settings?.logoImage || '' })
  } catch {
    return NextResponse.json({ siteName: 'AMSI & Co.', logoImage: '' })
  }
}