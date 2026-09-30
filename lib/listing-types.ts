import type { ObjectId } from 'mongodb'

export type ListingMedia = {
  id: string
  name: string
  contentType: string
}

export type MarketplaceListing = {
  _id?: ObjectId
  title: string
  slug: string
  category: string
  purpose: 'For sale' | 'For rent' | 'For auction'
  price: string
  negotiable: boolean
  district: string
  sector: string
  area: string
  reference: string
  plotSize: number
  zoning: string
  upi: string
  features: string[]
  descriptionEnglish: string
  descriptionKinyarwanda: string
  media: ListingMedia[]
  imageUrl?: string
  isSample?: boolean
  status: 'published' | 'draft'
  createdAt: string
}