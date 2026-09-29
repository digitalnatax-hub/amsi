import type { ObjectId } from 'mongodb'
import type { ListingMedia } from '@/lib/listing-types'

export type AuctionRecord = {
  _id?: ObjectId
  title: string
  description: string
  category: string
  location: string
  startingPrice: number
  currentBid: number
  minimumIncrement: number
  entryFee: number
  startsAt: string
  endsAt: string
  rules: string
  media: ListingMedia[]
  bidCount: number
  currentBidderId?: string
  currentBidderName?: string
  createdAt: string
}

export type AuctionEntry = {
  auctionId: ObjectId
  userId: ObjectId
  fullName: string
  email: string
  phone: string
  entryFee: number
  paymentStatus: 'paid' | 'pending' | 'not_required'
  enteredAt: string
}

export type AuctionBid = {
  auctionId: ObjectId
  userId: ObjectId
  fullName: string
  amount: number
  placedAt: string
}