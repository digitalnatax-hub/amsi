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

const sampleDescriptions = {
  'sample-kagugu-hillside-parcel': 'A residential parcel in Kagugu, set within Kinyinya in Gasabo. Its 842 m² size and R1 zoning give buyers a useful starting point for assessing the land and imagining a future home. The hillside setting and surrounding neighborhood make this an appealing option for a considered residential project.',
  'sample-sunrise-valley-development-land': 'A generous 2,400 m² parcel in Muyange, Rusororo, with mixed-use zoning. The scale and land-use designation offer room to explore a range of development concepts, while the monthly rental structure suits teams looking to secure land without an outright purchase.',
  'sample-riverside-corner-plot': 'A 610 m² corner parcel in Nunga, Gahanga. Residential R2 zoning and an auction opening bid make this a clear opportunity for buyers comparing land options in Kicukiro. Review the location, size and intended use, then contact AMSI for the next steps.',
  'sample-green-ridge-investment-parcel': 'A 1,250 m² agricultural parcel in central Kigabiro, Rwamagana. The larger footprint gives prospective tenants room to consider its potential uses, with the auction format offering a defined starting point for participation.',
  'sample-contemporary-home-nyarutarama': 'Set in Nyarutarama, this residential house offers a chance to explore one of Gasabo’s established Kigali neighborhoods. The listing brings together a clear location, residential land use and a sale price of RWF 385,000,000, giving prospective buyers a useful starting point for their search. Ask AMSI about current homes with similar locations and characteristics.',
  'sample-garden-residence-kicukiro': 'A residential home in Kagarama, Kicukiro, with a garden-led setting suggested by its name and imagery. At RWF 228,000,000, this sale listing offers a starting point for comparing homes in the district and planning a closer conversation with AMSI.',
  'sample-furnished-family-home-kimihurura': 'A furnished residential home offered for monthly rent in Kimihurura, Gasabo. Its central Kigali location makes it a useful example for renters looking to compare neighborhood, property type and rental terms in one place.',
  'sample-hillside-villa-opportunity': 'A residential villa opportunity in Batsinda, within Kinyinya, Gasabo. This auction listing pairs a defined opening bid with a Kigali hillside location, helping interested buyers focus their search and prepare questions for AMSI.',
  'sample-city-view-apartment-kigali-heights': 'A residential apartment in Kimihurura, Gasabo, offered for sale at RWF 148,000,000. The city-view setting and apartment format make this an inviting example for buyers comparing urban homes in Kigali.',
  'sample-bright-studio-convention-centre': 'A studio apartment in Kacyiru, available to rent monthly. Close to the Kigali Convention Centre area, it is a practical point of comparison for renters prioritizing a central address and a compact city home.',
  'sample-two-bedroom-apartment-nyarugenge': 'A two-bedroom apartment in Kiyovu, Nyarugenge, offered at RWF 1,050,000 per month. This listing gives renters a clear view of the neighborhood, apartment type and rental term as they compare Kigali homes.',
  'sample-penthouse-residence-kigali': 'A penthouse apartment in Kibagabaga, Gasabo, presented through an auction with a RWF 96,000,000 opening bid. Explore the listing and contact AMSI for details about the opportunity and participation.',
  'sample-central-business-office-floor': 'An office-floor opportunity in Kigali’s central business district, Nyarugenge. Offered for sale at RWF 620,000,000, it gives organizations and investors a clear starting point for evaluating a central commercial address.',
  'sample-flexible-workspace-kacyiru': 'Flexible commercial workspace in Kacyiru, Gasabo, available at a monthly rental rate. A central business location and a straightforward rental term make this a useful option to explore for teams planning their next workspace.',
  'sample-executive-suv-kigali': 'An executive SUV in Remera, Gasabo, offered for sale at RWF 48,000,000. The listing brings the vehicle, location and asking price together so buyers can quickly compare their next automotive purchase.',
  'sample-city-crossover-hire': 'A crossover available for daily rental in Kiyovu, Nyarugenge. At RWF 95,000 per day, it is a convenient example for visitors and residents comparing short-term vehicle options in Kigali.',
  'sample-all-terrain-vehicle-auction': 'An all-terrain vehicle listed for auction in Muhoza, Musanze. The RWF 18,500,000 opening bid offers a clear reference point for anyone exploring a capable vehicle in the northern province.',
  'sample-compact-construction-equipment-set': 'A compact construction equipment set located in Gahanga, Kicukiro, offered for sale at RWF 14,800,000. This listing helps contractors and project teams compare equipment opportunities by category, location and price.',
  'sample-workshop-machinery-package': 'A workshop machinery package available to rent weekly in Kimisagara, Nyarugenge. The weekly rate of RWF 420,000 makes this a practical example for businesses that need equipment for a defined project or period.',
  'sample-lake-kivu-leisure-package': 'A leisure opportunity in Gisenyi on the shores of Lake Kivu, listed for auction with an opening bid of RWF 6,500,000. Discover the destination and ask AMSI for details about this distinctive lot.',
}

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
  features: [],
  descriptionEnglish: sampleDescriptions[slug],
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
  for (const listing of listings) {
    await collection.updateOne(
      { slug: listing.slug, isSample: true },
      { $set: { descriptionEnglish: listing.descriptionEnglish, features: listing.features } },
    )
  }

  const seededCount = await collection.countDocuments({ isSample: true, slug: { $in: slugs } })
  console.log(`Sample inventory ready: ${seededCount} listings (${pending.length} newly inserted).`)
} finally {
  await client.close()
}
