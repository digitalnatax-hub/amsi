import { existsSync } from 'node:fs'
import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI && existsSync('.env.local')) process.loadEnvFile('.env.local')

const listingRows = [
  ['Kagugu hillside parcel', 'sample-kagugu-hillside-parcel', 'Plots / Land', 'For sale', 'RWF 84,000,000', 'Gasabo', 'Kinyinya', 'Kagugu', '1500382017468-9049fed747ef', 842, 'Residential R1'],
  ['Sunrise Valley development land', 'sample-sunrise-valley-development-land', 'Plots / Land', 'For rent', 'RWF 1,200,000 / month', 'Gasabo', 'Rusororo', 'Muyange', '1441974231531-c6227db76b6e', 2400, 'Mixed use'],
  ['Riverside corner plot', 'sample-riverside-corner-plot', 'Plots / Land', 'For auction', 'Opening bid · RWF 56,000,000', 'Kicukiro', 'Gahanga', 'Nunga', '1464822759023-fed622ff2c3b', 610, 'Residential R2'],
  ['Green Ridge investment parcel', 'sample-green-ridge-investment-parcel', 'Plots / Land', 'For auction', 'Opening bid · RWF 39,500,000', 'Rwamagana', 'Kigabiro', 'Town centre', '1470770841072-f978cf4d019e', 1250, 'Agricultural'],
  ['Contemporary home in Nyarutarama', 'sample-contemporary-home-nyarutarama', 'Houses', 'For sale', 'RWF 385,000,000', 'Gasabo', 'Remera', 'Nyarutarama', '1600596542815-ffad4c1539a9', 0, 'Residential'],
  ['Garden residence in Kicukiro', 'sample-garden-residence-kicukiro', 'Houses', 'For sale', 'RWF 228,000,000', 'Kicukiro', 'Kagarama', 'Kagarama', '1600047509807-ba8f99d2cdde', 0, 'Residential'],
  ['Furnished family home in Kimihurura', 'sample-furnished-family-home-kimihurura', 'Houses', 'For rent', 'RWF 2,400,000 / month', 'Gasabo', 'Kimironko', 'Kimihurura', '1600566753086-00f18fb6b3ea', 0, 'Residential'],
  ['Hillside villa opportunity', 'sample-hillside-villa-opportunity', 'Houses', 'For auction', 'Opening bid · RWF 172,000,000', 'Gasabo', 'Kinyinya', 'Batsinda', '1600607687939-ce8a6c25118c', 0, 'Residential'],
  ['City-view apartment in Kigali Heights', 'sample-city-view-apartment-kigali-heights', 'Apartments', 'For sale', 'RWF 148,000,000', 'Gasabo', 'Remera', 'Kimihurura', '1600607687920-4e2a09cf159d', 0, 'Apartment'],
  ['Bright studio near the convention centre', 'sample-bright-studio-convention-centre', 'Apartments', 'For rent', 'RWF 650,000 / month', 'Gasabo', 'Remera', 'Kacyiru', '1616486338812-3dadae4b4ace', 0, 'Apartment'],
  ['Two-bedroom apartment in Nyarugenge', 'sample-two-bedroom-apartment-nyarugenge', 'Apartments', 'For rent', 'RWF 1,050,000 / month', 'Nyarugenge', 'Nyarugenge', 'Kiyovu', '1600566753190-17f0baa2a6c3', 0, 'Apartment'],
  ['Penthouse residence, Kigali', 'sample-penthouse-residence-kigali', 'Apartments', 'For auction', 'Opening bid · RWF 96,000,000', 'Gasabo', 'Remera', 'Kibagabaga', '1600607687939-ce8a6c25118c', 0, 'Apartment'],
  ['Central business district office floor', 'sample-central-business-office-floor', 'Commercial property', 'For sale', 'RWF 620,000,000', 'Nyarugenge', 'Nyarugenge', 'CBD', '1486406146926-c627a92ad1ab', 0, 'Commercial'],
  ['Flexible workspace in Kacyiru', 'sample-flexible-workspace-kacyiru', 'Commercial property', 'For rent', 'RWF 3,800,000 / month', 'Gasabo', 'Kacyiru', 'Kacyiru', '1497366811353-6870744d04b2', 0, 'Commercial'],
  ['Executive SUV, Kigali', 'sample-executive-suv-kigali', 'Vehicles', 'For sale', 'RWF 48,000,000', 'Gasabo', 'Remera', 'Remera', '1492144534655-ae79c964c9d7', 0, 'Vehicle'],
  ['City-ready crossover hire', 'sample-city-crossover-hire', 'Vehicles', 'For rent', 'RWF 95,000 / day', 'Nyarugenge', 'Nyarugenge', 'Kiyovu', '1503376780353-7e6692767b70', 0, 'Vehicle'],
  ['All-terrain vehicle auction', 'sample-all-terrain-vehicle-auction', 'Vehicles', 'For auction', 'Opening bid · RWF 18,500,000', 'Musanze', 'Muhoza', 'Town centre', '1549317661-bd32c8ce0db2', 0, 'Vehicle'],
  ['Compact construction equipment set', 'sample-compact-construction-equipment-set', 'Equipment', 'For sale', 'RWF 14,800,000', 'Kicukiro', 'Gahanga', 'Gahanga', '1581091226825-a6a2a5aee158', 0, 'Construction equipment'],
  ['Workshop machinery package', 'sample-workshop-machinery-package', 'Other', 'For rent', 'RWF 420,000 / week', 'Nyarugenge', 'Kimisagara', 'Kimisagara', '1581092160607-ee22621dd758', 0, 'Workshop equipment'],
  ['Lake Kivu leisure package', 'sample-lake-kivu-leisure-package', 'Other', 'For auction', 'Opening bid · RWF 6,500,000', 'Rubavu', 'Gisenyi', 'Lake Kivu', '1500530855697-b586d89ba3ee', 0, 'Leisure'],
]

const now = Date.now()
const listings = listingRows.map(([title, slug, category, purpose, price, district, sector, area, imageId, plotSize, zoning], index) => ({
  title,
  slug,
  category,
  purpose,
  price,
  negotiable: false,
  district,
  sector,
  area,
  reference: `SAMPLE-${String(index + 1).padStart(3, '0')}`,
  plotSize,
  zoning,
  upi: '',
  features: ['Illustrative sample inventory', 'Details and availability require verification'],
  descriptionEnglish: 'Illustrative AMSI sample inventory item. This is not a confirmed live offer; availability, specifications, and pricing must be verified with AMSI before making a decision.',
  descriptionKinyarwanda: '',
  media: [],
  imageUrl: `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=1200&q=85`,
  isSample: true,
  status: 'published',
  createdAt: new Date(now - (listingRows.length - index) * 1000).toISOString(),
}))

if (listings.length !== 20) throw new Error(`Expected 20 sample listings; found ${listings.length}.`)

const uri = process.env.MONGODB_URI
if (!uri) throw new Error('MONGODB_URI is not configured. Add it to .env.local.')

const client = new MongoClient(uri)

try {
  await client.connect()
  const database = client.db(process.env.MONGODB_DATABASE || 'amsi')
  const collection = database.collection('listings')
  const slugs = listings.map(listing => listing.slug)
  const existing = await collection.find({ slug: { $in: slugs } }, { projection: { slug: 1, isSample: 1 } }).toArray()
  const conflicts = existing.filter(listing => listing.isSample !== true)

  if (conflicts.length > 0) {
    throw new Error(`Refusing to replace existing non-sample listings: ${conflicts.map(listing => listing.slug).join(', ')}`)
  }

  const pending = listings.filter(listing => !existing.some(found => found.slug === listing.slug))
  if (pending.length > 0) await collection.insertMany(pending)

  const seededCount = await collection.countDocuments({ isSample: true, slug: { $in: slugs } })
  console.log(`Sample inventory ready: ${seededCount} listings (${pending.length} newly inserted).`)
} finally {
  await client.close()
}
