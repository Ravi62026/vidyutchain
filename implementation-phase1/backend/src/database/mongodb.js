import mongoose from 'mongoose'
import { env } from '../config/env.js'

export async function connectToDatabase() {
  const connectionAttempt = mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    },
  })

  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`MongoDB connection timed out after ${env.MONGODB_SERVER_SELECTION_TIMEOUT_MS}ms`))
    }, env.MONGODB_SERVER_SELECTION_TIMEOUT_MS)
  })

  await Promise.race([connectionAttempt, timeout])
  await mongoose.connection.db.admin().command({ ping: 1 })

  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

export async function disconnectFromDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    console.log('MongoDB connection closed')
  }
}

export function getDatabaseState() {
  return mongoose.connection.readyState
}
