import http from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectToDatabase, disconnectFromDatabase } from './database/mongodb.js'

const server = http.createServer(createApp())

async function startServer() {
  try {
    await connectToDatabase()

    server.listen(env.PORT, () => {
      console.log(`VidyutChain backend listening on http://localhost:${env.PORT}`)
    })
  } catch (error) {
    console.error('Backend startup failed: MongoDB is unavailable')
    console.error(error instanceof Error ? error.message : error)
    await disconnectFromDatabase()
    process.exitCode = 1
  }
}

async function stopServer(signal) {
  console.log(`Received ${signal}; shutting down backend`)
  server.close(async () => {
    await disconnectFromDatabase()
    process.exit(0)
  })
}

process.once('SIGINT', () => stopServer('SIGINT'))
process.once('SIGTERM', () => stopServer('SIGTERM'))

startServer()
