import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { Meter } from '../models/meter.model.js'

export const meterInputSchema = z.object({
  meterId: z.string().trim().min(3).max(64).transform((value) => value.toUpperCase()),
  displayName: z.string().trim().min(2).max(120),
})

function ownerFilter(user) {
  if (user.role === 'admin') {
    return {}
  }

  return { owner: new mongoose.Types.ObjectId(user.sub) }
}

function publicMeter(meter) {
  return {
    id: meter._id.toString(),
    meterId: meter.meterId,
    displayName: meter.displayName,
    status: meter.status,
    lastSeenAt: meter.lastSeenAt,
    owner: meter.owner.toString(),
    createdAt: meter.createdAt,
    updatedAt: meter.updatedAt,
  }
}

export function createMeterRouter({ blockchainClient = null } = {}) {
  const router = Router()
  router.use(requireAuth)

  router.post('/', async (request, response) => {
    const parsed = meterInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid meter data', details: parsed.error.flatten() })
    }

    const meter = await Meter.create({
      ...parsed.data,
      owner: request.user.sub,
    })

    if (blockchainClient) {
      try {
        const registration = await blockchainClient.registerMeter(meter.meterId)
        meter.blockchainRegistrationStatus = 'confirmed'
        meter.blockchainRegistrationTransactionHash = registration.transactionHash
        await meter.save()
      } catch (error) {
        request.log.warn({ err: error, meterId: meter.meterId }, 'blockchain meter registration failed')
        meter.blockchainRegistrationStatus = 'failed'
        await meter.save()
      }
    }

    return response.status(201).json({ meter: publicMeter(meter) })
  })

  router.get('/', async (request, response) => {
    const meters = await Meter.find(ownerFilter(request.user)).sort({ createdAt: -1 }).lean()
    return response.json({ meters: meters.map(publicMeter) })
  })

  router.get('/:meterId', async (request, response) => {
    const meter = await Meter.findOne({
      meterId: request.params.meterId.toUpperCase(),
      ...ownerFilter(request.user),
    }).lean()

    if (!meter) {
      return response.status(404).json({ error: 'Meter not found' })
    }

    return response.json({ meter: publicMeter(meter) })
  })

  return router
}
