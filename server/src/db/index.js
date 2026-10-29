import { MongoClient, ObjectId } from 'mongodb'
import { config } from '../config/index.js'
import { broadcast } from '../services/events.js'

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
// Images uploaded from the admin: { contentType, data, createdAt }, served by /api/uploads/:id.
export const uploads = () => database.collection('uploads')
// Single documents keyed by name: 'profile', 'tools', 'meta'.
export const settings = () => database.collection('settings')

// API shape: string `id` instead of `_id`, and the internal sort key hidden.
export const toApi = ({ _id, order, ...rest }) => ({ id: String(_id), ...rest })

// Malformed ids are treated as "not found" rather than a server error.
export const parseId = (id) => (typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : null)

// Call after any change to public content: records the time, tells open portfolio pages to refetch,
// and clears out images that were replaced or whose project was deleted.
export async function touch() {
  const updatedAt = new Date()
  await settings().updateOne({ _id: 'meta' }, { $set: { updatedAt } }, { upsert: true })
  broadcast('content', { updatedAt })
  pruneUploads().catch((err) => console.error('[uploads] prune failed:', err))
}

// An upload is in use while the profile or a project links to it. A new upload is spared for a day,
// since the admin uploads first and saves the form afterwards.
const UPLOAD_GRACE_MS = 24 * 60 * 60 * 1000
const uploadIdIn = (url) => url?.match(/\/api\/uploads\/([a-f\d]{24})$/i)?.[1]

export async function pruneUploads() {
  const [profile, projectList] = await Promise.all([
    settings().findOne({ _id: 'profile' }, { projection: { image: 1 } }),
    projects().find({}, { projection: { image: 1 } }).toArray(),
  ])
  const inUse = [profile, ...projectList].map((doc) => uploadIdIn(doc?.image)).filter(Boolean).map((id) => new ObjectId(id))
  await uploads().deleteMany({ _id: { $nin: inUse }, createdAt: { $lt: new Date(Date.now() - UPLOAD_GRACE_MS) } })
}
