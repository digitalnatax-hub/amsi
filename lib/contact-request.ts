import type { ObjectId } from 'mongodb'

export type ContactRequest = {
  _id?: ObjectId
  ownerUserId?: ObjectId
  id: string
  kind: 'message' | 'consultancy'
  fullName: string
  email: string
  phone: string
  topic: string
  preferredTime: string
  message: string
  messages?: ContactMessage[]
  listingId?: string
  listingTitle?: string
  isAccountOwned?: boolean
  status: 'new' | 'in_progress' | 'resolved'
  createdAt: string
  updatedAt?: string
}

export type ContactMessage = {
  id: string
  sender: 'member' | 'admin'
  message: string
  createdAt: string
}