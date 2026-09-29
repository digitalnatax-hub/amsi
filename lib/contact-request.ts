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
  status: 'new' | 'in_progress' | 'resolved'
  createdAt: string
}