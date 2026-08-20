import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { classifyTelemetry } from '../ai/client.js'
import { requireAuth } from '../middleware/auth.js'
import { Alert } from '../models/alert.model.js'
import { Meter } from '../models/meter.model.js'
import { Telemetry } from '../models/telemetry.model.js'

export const telemetryInputSchema = z.object({
  meterId: z.string().trim().min(3).max(64).transform((value) => value.toUpperCase()),
  timestamp: z.coerce.date(),
  voltage: z.number().finite().min(0).max(500),
  current: z.number().finite().min(0).max(1000),
  powerKw: z.number().finite().min(-1000).max(1000),
  powerFactor: z.number().finite().min(-1).max(1),
  importKwh: z.number().finite().min(0),
  exportKwh: z.number().finite().min(0),
  anomalyType: z.enum([
    'NORMAL',
    'LOAD_THEFT',
    'METER_TAMPERING',
    'REVERSE_ENERGY',
    'COMMUNICATION_FAILURE',
  ]).default('NORMAL'),
  status: z.enum(['normal', 'anomaly', 'communication_failure']).default('normal'),
  source: z.enum(['simulator', 'edge_gateway', 'manual']).default('simulator'),
})

const telemetryRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['from'], message: 'from must be before to' })
  }
})

export const telemetryHistoryQuerySchema = telemetryRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(500).default(100),
})

export const telemetryAggregationQuerySchema = telemetryRangeSchema.extend({
  interval: z.enum(['hourly', 'daily']).default('hourly'),
})

const telemetryBatchSchema = z.array(telemetryInputSchema).min(1).max(100)

function meterAccessFilter(user, meterId) {
  const filter = { meterId }
  if (user.role !== 'admin') {
    filter.owner = new mongoose.Types.ObjectId(user.sub)
  }
  return filter
}

function publicTelemetry(telemetry) {
  return {
    id: telemetry._id.toString(),
    meterId: telemetry.meterId,
    timestamp: telemetry.timestamp,
    voltage: telemetry.voltage,
    current: telemetry.current,
    powerKw: telemetry.powerKw,
    powerFactor: telemetry.powerFactor,
    importKwh: telemetry.importKwh,
    exportKwh: telemetry.exportKwh,
    anomalyType: telemetry.anomalyType,
    status: telemetry.status,
    source: telemetry.source,
    aiAnomalyType: telemetry.aiAnomalyType,
    aiModelVersion: telemetry.aiModelVersion,
    aiRiskScore: telemetry.aiRiskScore,
    aiConfidence: telemetry.aiConfidence,
    aiReasons: telemetry.aiReasons,
    blockchainAuditStatus: telemetry.blockchainAuditStatus,
    blockchainTransactionHash: telemetry.blockchainTransactionHash,
    blockchainEventId: telemetry.blockchainEventId,
    blockchainPayloadHash: telemetry.blockchainPayloadHash,
    createdAt: telemetry.createdAt,
  }
}

function alertSeverity(riskScore) {
  if (riskScore >= 0.9) return 'critical'
  if (riskScore >= 0.75) return 'high'
  if (riskScore >= 0.5) return 'medium'
  return 'low'
}

export function buildBlockchainAuditPayload(telemetry, aiResult) {
  return {
    telemetryId: telemetry._id.toString(),
    meterId: telemetry.meterId,
    timestamp: telemetry.timestamp.toISOString(),
    anomalyType: aiResult.anomalyType,
    modelVersion: aiResult.modelVersion,
    riskScore: aiResult.riskScore,
    confidence: aiResult.confidence,
    reasons: aiResult.reasons,
  }
}

async function persistBlockchainAudit(telemetry, aiResult, blockchainClient, request) {
  if (!blockchainClient || !aiResult || aiResult.anomalyType === 'NORMAL') {
    return
  }

  try {
    const audit = await blockchainClient.logAuditEvent({
      meterId: telemetry.meterId,
      eventType: 'ANOMALY_EVENT',
      payload: buildBlockchainAuditPayload(telemetry, aiResult),
    })
    telemetry.blockchainAuditStatus = 'confirmed'
    telemetry.blockchainTransactionHash = audit.transactionHash
    telemetry.blockchainEventId = audit.eventId
    telemetry.blockchainPayloadHash = audit.payloadHash
  } catch (error) {
    request.log.warn({ err: error, telemetryId: telemetry._id }, 'blockchain audit logging failed')
    telemetry.blockchainAuditStatus = 'failed'
  }
}

async function persistAiResult(telemetry, aiResult, blockchainClient, request) {
  if (!aiResult) {
    return
  }

  telemetry.aiAnomalyType = aiResult.anomalyType
  telemetry.aiModelVersion = aiResult.modelVersion
  telemetry.aiRiskScore = aiResult.riskScore
  telemetry.aiConfidence = aiResult.confidence
  telemetry.aiReasons = aiResult.reasons
  await telemetry.save()

  await persistBlockchainAudit(telemetry, aiResult, blockchainClient, request)
  if (telemetry.blockchainAuditStatus === 'confirmed' || telemetry.blockchainAuditStatus === 'failed') {
    await telemetry.save()
  }

  if (aiResult.anomalyType !== 'NORMAL') {
    await Alert.create({
      meterId: telemetry.meterId,
      telemetryId: telemetry._id,
      anomalyType: aiResult.anomalyType,
      severity: alertSeverity(aiResult.riskScore),
      riskScore: aiResult.riskScore,
    })
  }
}

export function buildTelemetryFilter(meterId, query) {
  const filter = { meterId: meterId.toUpperCase() }
  const timestamp = {}

  if (query.from) {
    timestamp.$gte = query.from
  }
  if (query.to) {
    timestamp.$lte = query.to
  }
  if (Object.keys(timestamp).length > 0) {
    filter.timestamp = timestamp
  }

  return filter
}

export function buildAggregationPipeline(meterId, query) {
  return [
    { $match: buildTelemetryFilter(meterId, query) },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: '$timestamp',
            unit: query.interval === 'daily' ? 'day' : 'hour',
            timezone: 'UTC',
          },
        },
        readings: { $sum: 1 },
        averagePowerKw: { $avg: '$powerKw' },
        importKwh: { $sum: '$importKwh' },
        exportKwh: { $sum: '$exportKwh' },
      },
    },
    {
      $project: {
        _id: 0,
        timestamp: '$_id',
        readings: 1,
        averagePowerKw: 1,
        importKwh: 1,
        exportKwh: 1,
      },
    },
    { $sort: { timestamp: 1 } },
  ]
}

async function assertMeterAccess(user, meterIds) {
  const uniqueMeterIds = [...new Set(meterIds)]
  const meters = await Meter.find({
    meterId: { $in: uniqueMeterIds },
    ...(user.role === 'admin' ? {} : { owner: new mongoose.Types.ObjectId(user.sub) }),
  }).lean()
  const foundMeterIds = new Set(meters.map((meter) => meter.meterId))
  const missingMeterId = uniqueMeterIds.find((meterId) => !foundMeterIds.has(meterId))

  if (missingMeterId) {
    return { error: `Meter not found or inaccessible: ${missingMeterId}` }
  }

  return { meters }
}

async function updateLastSeen(meterIds, timestamp) {
  await Meter.updateMany(
    { meterId: { $in: meterIds } },
    { $set: { lastSeenAt: timestamp, status: 'online' } },
  )
}

export function createTelemetryRouter({ blockchainClient = null } = {}) {
  const router = Router()
  router.use(requireAuth)

  router.post('/', async (request, response) => {
    const parsed = telemetryInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid telemetry data', details: parsed.error.flatten() })
    }

    const access = await assertMeterAccess(request.user, [parsed.data.meterId])
    if (access.error) {
      return response.status(404).json({ error: access.error })
    }

    const telemetry = await Telemetry.create(parsed.data)
    await persistAiResult(telemetry, await classifyTelemetry(parsed.data), blockchainClient, request)
    await updateLastSeen([telemetry.meterId], telemetry.timestamp)

    return response.status(201).json({ telemetry: publicTelemetry(telemetry) })
  })

  router.post('/batch', async (request, response) => {
    const parsed = telemetryBatchSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid telemetry batch', details: parsed.error.flatten() })
    }

    const access = await assertMeterAccess(request.user, parsed.data.map((item) => item.meterId))
    if (access.error) {
      return response.status(404).json({ error: access.error })
    }

    const telemetry = await Telemetry.insertMany(parsed.data, { ordered: true })
    const aiResults = await Promise.all(parsed.data.map((item) => classifyTelemetry(item)))
    await Promise.all(telemetry.map((item, index) => persistAiResult(item, aiResults[index], blockchainClient, request)))
    await updateLastSeen(
      [...new Set(telemetry.map((item) => item.meterId))],
      new Date(Math.max(...telemetry.map((item) => item.timestamp.getTime()))),
    )

    return response.status(201).json({
      count: telemetry.length,
      telemetry: telemetry.map(publicTelemetry),
    })
  })

  router.get('/audit/:telemetryId', async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.telemetryId)) {
      return response.status(400).json({ error: 'Invalid telemetry ID' })
    }

    const telemetry = await Telemetry.findById(request.params.telemetryId).lean()
    if (!telemetry) {
      return response.status(404).json({ error: 'Telemetry not found' })
    }

    const access = await assertMeterAccess(request.user, [telemetry.meterId])
    if (access.error) {
      return response.status(404).json({ error: access.error })
    }

    if (!blockchainClient || telemetry.blockchainAuditStatus !== 'confirmed') {
      return response.json({
        telemetryId: telemetry._id.toString(),
        status: telemetry.blockchainAuditStatus ?? 'disabled',
        verified: false,
      })
    }

    const verification = await blockchainClient.verifyAuditEvent({
      meterId: telemetry.meterId,
      eventType: 'ANOMALY_EVENT',
      payload: buildBlockchainAuditPayload(telemetry, {
        anomalyType: telemetry.aiAnomalyType,
        modelVersion: telemetry.aiModelVersion,
        riskScore: telemetry.aiRiskScore,
        confidence: telemetry.aiConfidence,
        reasons: telemetry.aiReasons,
      }),
    })

    return response.json({
      telemetryId: telemetry._id.toString(),
      status: 'confirmed',
      transactionHash: telemetry.blockchainTransactionHash,
      ...verification,
      verified: verification.exists,
    })
  })

  router.get('/latest/:meterId', async (request, response) => {
    const access = await assertMeterAccess(request.user, [request.params.meterId.toUpperCase()])
    if (access.error) {
      return response.status(404).json({ error: access.error })
    }

    const telemetry = await Telemetry.findOne({ meterId: request.params.meterId.toUpperCase() })
      .sort({ timestamp: -1 })
      .lean()

    return response.json({
      meterId: request.params.meterId.toUpperCase(),
      telemetry: telemetry ? publicTelemetry(telemetry) : null,
    })
  })

  router.get('/history/:meterId', async (request, response) => {
    const parsed = telemetryHistoryQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid telemetry history query', details: parsed.error.flatten() })
    }

    const meterId = request.params.meterId.toUpperCase()
    const access = await assertMeterAccess(request.user, [meterId])
    if (access.error) {
      return response.status(404).json({ error: access.error })
    }

    const telemetry = await Telemetry.find(buildTelemetryFilter(meterId, parsed.data))
      .sort({ timestamp: 1 })
      .limit(parsed.data.limit)
      .lean()

    return response.json({
      meterId,
      count: telemetry.length,
      limit: parsed.data.limit,
      telemetry: telemetry.map(publicTelemetry),
    })
  })

  router.get('/aggregation/:meterId', async (request, response) => {
    const parsed = telemetryAggregationQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid telemetry aggregation query', details: parsed.error.flatten() })
    }

    const meterId = request.params.meterId.toUpperCase()
    const access = await assertMeterAccess(request.user, [meterId])
    if (access.error) {
      return response.status(404).json({ error: access.error })
    }

    const aggregation = await Telemetry.aggregate(buildAggregationPipeline(meterId, parsed.data))
    return response.json({ meterId, interval: parsed.data.interval, aggregation })
  })

  return router
}
