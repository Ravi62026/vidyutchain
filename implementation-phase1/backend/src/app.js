import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { createAuthRouter } from './routes/auth.routes.js'
import { createBlockchainClient } from './blockchain/client.js'
import { createMeterRouter } from './routes/meter.routes.js'
import { createTelemetryRouter } from './routes/telemetry.routes.js'

export function createApp({ blockchainClient = createBlockchainClient() } = {}) {
  const app = express()

  app.use(pinoHttp({ redact: ['req.headers.authorization', 'req.headers.cookie'] }))
  app.use(helmet())
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 600 }))

  app.use('/api/auth', createAuthRouter())
  app.use('/api/meters', createMeterRouter({ blockchainClient }))
  app.use('/api/telemetry', createTelemetryRouter({ blockchainClient }))

  app.get('/health', (_request, response) => {
    response.json({ service: 'vidyutchain-backend', status: 'ok' })
  })

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error)
    }

    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500
    request.log.error({ err: error, status }, 'request failed')

    return response.status(status).json({
      error: status === 500 ? 'Internal server error' : error.message,
    })
  })

  return app
}
