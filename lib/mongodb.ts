import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>
}

let clientPromise = globalForMongo.mongoClientPromise

export async function getDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured. Add it to .env.local.')

  clientPromise ??= new MongoClient(uri).connect()
  if (process.env.NODE_ENV !== 'production') globalForMongo.mongoClientPromise = clientPromise

  const client = await clientPromise
  return client.db(process.env.MONGODB_DATABASE || 'amsi')
}

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured. Add it to .env.local.')
  clientPromise ??= new MongoClient(uri).connect()
  if (process.env.NODE_ENV !== 'production') globalForMongo.mongoClientPromise = clientPromise
  return clientPromise
}