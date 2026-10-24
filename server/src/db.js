import { MongoClient, ObjectId } from 'mongodb'
import { config } from './config.js'
import { broadcast } from './events.js'

const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000 })
let database = null

export async function connectDb() {
  await client.connect()
  database = client.db(config.mongoDbName)
  await Promise.all([
    projects().createIndex({ order: 1 }),
    skills().createIndex({ order: 1 }),
    commands().createIndex({ order: 1 }),
    commands().createIndex({ name: 1 }, { unique: true }),
    messages().createIndex({ createdAt: -1 }),
  ])
  return database
}

export const closeDb = () => client.close()
export const pingDb = () => database.command({ ping: 1 })

export const projects = () => database.collection('projects')
export const skills = () => database.collection('skills')
// Custom Terminal commands: { name, description, output, order }.
export const commands = () => database.collection('commands')
// Contact form submissions: { name, email, message, read, createdAt }. Admin-only.
export const messages = () => database.collection('messages')
// Single documents keyed by name: 'profile', 'tools', 'meta'.
export const settings = () => database.collection('settings')

// API shape: string `id` instead of `_id`, and the internal sort key hidden.
export const toApi = ({ _id, order, ...rest }) => ({ id: String(_id), ...rest })

// Malformed ids are treated as "not found" rather than a server error.
export const parseId = (id) => (typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : null)

// Call after any change to public content: records the time and tells open portfolio pages to refetch.
export async function touch() {
  const updatedAt = new Date()
  await settings().updateOne({ _id: 'meta' }, { $set: { updatedAt } }, { upsert: true })
  broadcast('content', { updatedAt })
}
