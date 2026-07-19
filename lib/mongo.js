// /app/lib/mongo.js
// Singleton MongoDB connection helper for SelfScience.
//
// The app is largely local-first (localStorage / sessionStorage for user
// data) but a small handful of OPERATOR-scoped endpoints — e.g. the
// supplement price cache written to by the scraper — need persistent
// server-side storage that survives deploys.
//
// Uses connection pooling via the global object so hot-reload in dev
// doesn't leak connections and serverless cold-starts share a client.
//
// PRIVACY: only NON-USER, non-PII data ever goes into MongoDB from this
// app. No genome, biomarker, or search-query data is ever written here.

import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'selfscience'

let cachedClient = globalThis.__ss_mongo_client__ || null
let cachedPromise = globalThis.__ss_mongo_promise__ || null

async function getClient() {
  if (cachedClient) return cachedClient
  if (!cachedPromise) {
    cachedPromise = new MongoClient(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
      .connect()
      .then((client) => {
        cachedClient = client
        globalThis.__ss_mongo_client__ = client
        return client
      })
      .catch((err) => {
        // Reset the promise so retries can attempt again.
        cachedPromise = null
        globalThis.__ss_mongo_promise__ = null
        throw err
      })
    globalThis.__ss_mongo_promise__ = cachedPromise
  }
  return cachedPromise
}

export async function getDb() {
  const client = await getClient()
  return client.db(DB_NAME)
}

export async function getCollection(name) {
  const db = await getDb()
  return db.collection(name)
}
