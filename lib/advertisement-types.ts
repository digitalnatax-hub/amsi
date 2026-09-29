import type { ObjectId } from 'mongodb'
import type { ListingMedia } from '@/lib/listing-types'

export const adPlacements = [
  'hero-poster',
  'leaderboard',
  'wide-post',
  'medium-rectangle',
  'large-rectangle',
  'half-page',
  'mobile-leaderboard',
  'mobile-large-banner',
] as const

export type AdPlacement = typeof adPlacements[number]
export type AdFormat = 'image' | 'video' | 'youtube'

export type Advertisement = {
  _id?: ObjectId
  title: string
  format: AdFormat
  placement: AdPlacement
  asset?: ListingMedia
  youtubeUrl?: string
  linkUrl?: string
  active: boolean
  createdAt: string
  updatedAt?: string
}

export function isYouTubeUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname === 'youtu.be') return /^[\w-]{11}$/.test(url.pathname.slice(1))
    if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' || url.hostname === 'm.youtube.com') {
      return /^[\w-]{11}$/.test(url.searchParams.get('v') || '') || /^\/(embed|shorts)\/[\w-]{11}$/.test(url.pathname)
    }
  } catch { return false }
  return false
}

export function getYouTubeEmbedUrl(value: string) {
  const url = new URL(value)
  const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop() || ''
  return `https://www.youtube-nocookie.com/embed/${id}`
}