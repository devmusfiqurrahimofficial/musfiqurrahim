import { Collection, Db, Document, MongoClient, ObjectId } from 'mongodb'
import { broadcast } from './events'
import { logger } from './logger'

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio'
const mongoDbName =
  process.env.MONGODB_DB ||
  (/^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(mongoUri) ? undefined : 'portfolio')

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null
let database: Db | null = null
let indexesInitialized = false

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const mongoOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

export async function getDb(): Promise<Db> {
  if (database) return database

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(mongoUri, mongoOptions)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    if (!clientPromise) {
      client = new MongoClient(mongoUri, mongoOptions)
      clientPromise = client.connect()
    }
  }

  const connectedClient = await clientPromise
  database = connectedClient.db(mongoDbName)

  // Ensure indexes in background only once per application lifecycle
  if (!indexesInitialized) {
    indexesInitialized = true
    Promise.all([
      database.collection('projects').createIndex({ order: 1 }),
      database.collection('skills').createIndex({ order: 1 }),
      database.collection('commands').createIndex({ order: 1 }),
      database.collection('commands').createIndex({ name: 1 }, { unique: true }),
      database.collection('messages').createIndex({ createdAt: -1 }),
      database.collection('uploads').createIndex({ createdAt: 1 }),
    ]).catch((err) => logger.warn({ err: err.message }, '[db] Index creation warning'))
  }

  return database
}

export async function pingDb() {
  const db = await getDb()
  return db.command({ ping: 1 })
}

export async function projects(): Promise<Collection<Document>> {
  const db = await getDb()
  return db.collection('projects')
}

export async function skills(): Promise<Collection<Document>> {
  const db = await getDb()
  return db.collection('skills')
}

export async function commands(): Promise<Collection<Document>> {
  const db = await getDb()
  return db.collection('commands')
}

export async function messages(): Promise<Collection<Document>> {
  const db = await getDb()
  return db.collection('messages')
}

export async function uploads(): Promise<Collection<Document>> {
  const db = await getDb()
  return db.collection('uploads')
}

export async function settings(): Promise<Collection<Document>> {
  const db = await getDb()
  return db.collection('settings')
}

export function toApi<T extends { _id?: unknown; order?: unknown }>(
  doc: T
): Omit<T, '_id' | 'order'> & { id: string } {
  const { _id, order: _order, ...rest } = doc
  return { id: String(_id), ...rest } as Omit<T, '_id' | 'order'> & { id: string }
}

export function parseId(id: string | null | undefined): ObjectId | null {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : null
}

const UPLOAD_GRACE_MS = 24 * 60 * 60 * 1000
const uploadIdIn = (url?: string) => url?.match(/\/api\/uploads\/([a-f\d]{24})$/i)?.[1]

export async function pruneUploads() {
  try {
    const [settingsColl, projectsColl, uploadsColl] = await Promise.all([settings(), projects(), uploads()])
    const [profile, projectList] = await Promise.all([
      settingsColl.findOne({ _id: 'profile' as unknown as ObjectId }, { projection: { image: 1 } }),
      projectsColl.find({}, { projection: { image: 1 } }).toArray(),
    ])
    const inUse = [profile, ...projectList]
      .map((doc) => uploadIdIn(doc?.image))
      .filter((id): id is string => Boolean(id))
      .map((id) => new ObjectId(id))

    await uploadsColl.deleteMany({
      _id: { $nin: inUse },
      createdAt: { $lt: new Date(Date.now() - UPLOAD_GRACE_MS) },
    })
  } catch (err) {
    logger.error({ err }, '[uploads] prune failed')
  }
}

export async function touch() {
  const updatedAt = new Date()
  const settingsColl = await settings()
  await settingsColl.updateOne(
    { _id: 'meta' as unknown as ObjectId },
    { $set: { updatedAt } },
    { upsert: true }
  )
  broadcast('content', { updatedAt })
  pruneUploads().catch((err) => logger.error({ err }, '[uploads] prune failed'))
}
