import crypto from 'crypto'
import { Router } from 'express'
import { z } from 'zod'
import { generateDePinSignature } from '../blockchain/solanaClient.js'
import { requireAuth } from '../middleware/auth.js'
import { Bid } from '../models/bid.model.js'
import { Tender } from '../models/tender.model.js'

const createTenderSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  feederArea: z.string().default('Substation Feeder 04 - East Bangalore Industrial Hub'),
  energyRequiredKwh: z.number().min(10).max(1000000),
  maxBasePricePerKwh: z.number().min(1.0).max(30.0),
  daysOpen: z.number().min(1).max(90).default(14),
})

const createBidSchema = z.object({
  bidPricePerKwh: z.number().min(0.5).max(30.0),
  capacityOfferedKw: z.number().min(1).max(50000),
  bidderCompanyName: z.string().min(2),
  deliveryTimelineDays: z.number().min(1).default(7),
})

export function createTenderRouter() {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (_request, response) => {
    try {
      const tenders = await Tender.find().sort({ createdAt: -1 }).lean()
      const bids = await Bid.find().sort({ bidPricePerKwh: 1 }).lean()

      // Group bids by tenderId
      const bidsByTender = {}
      for (const bid of bids) {
        const tid = bid.tenderId.toString()
        if (!bidsByTender[tid]) bidsByTender[tid] = []
        bidsByTender[tid].push({
          id: bid._id.toString(),
          bidderEmail: bid.bidderEmail,
          bidderCompanyName: bid.bidderCompanyName,
          bidPricePerKwh: bid.bidPricePerKwh,
          capacityOfferedKw: bid.capacityOfferedKw,
          deliveryTimelineDays: bid.deliveryTimelineDays,
          status: bid.status,
          solanaTxSignature: bid.solanaTxSignature,
          createdAt: bid.createdAt,
        })
      }

      return response.json({
        tenders: tenders.map((tender) => ({
          id: tender._id.toString(),
          tenderId: tender.tenderId,
          title: tender.title,
          description: tender.description,
          feederArea: tender.feederArea,
          energyRequiredKwh: tender.energyRequiredKwh,
          maxBasePricePerKwh: tender.maxBasePricePerKwh,
          startDate: tender.startDate,
          endDate: tender.endDate,
          status: tender.status,
          awardedSupplier: tender.awardedSupplier,
          solanaTxSignature: tender.solanaTxSignature,
          bids: bidsByTender[tender._id.toString()] || [],
          bidsCount: (bidsByTender[tender._id.toString()] || []).length,
        })),
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/', async (request, response) => {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only DISCOM / Grid Admins can publish energy tenders' })
    }

    const parsed = createTenderSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid tender data', details: parsed.error.flatten() })
    }

    try {
      const code = `VC-TND-${Date.now().toString(36).toUpperCase()}`
      const endDate = new Date(Date.now() + parsed.data.daysOpen * 24 * 60 * 60 * 1000)

      const sig = generateDePinSignature({
        type: 'GRID_TENDER_PUBLISH',
        tenderId: code,
        energyRequiredKwh: parsed.data.energyRequiredKwh,
        maxBasePricePerKwh: parsed.data.maxBasePricePerKwh,
      })

      const tender = await Tender.create({
        tenderId: code,
        title: parsed.data.title,
        description: parsed.data.description,
        feederArea: parsed.data.feederArea,
        energyRequiredKwh: parsed.data.energyRequiredKwh,
        maxBasePricePerKwh: parsed.data.maxBasePricePerKwh,
        startDate: new Date(),
        endDate,
        status: 'open',
        createdBy: request.user.sub,
        solanaTxSignature: sig,
      })

      return response.status(201).json({
        message: `Grid energy procurement tender ${code} published successfully!`,
        tender,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/:id/bid', async (request, response) => {
    const parsed = createBidSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid bid data', details: parsed.error.flatten() })
    }

    try {
      const tender = await Tender.findById(request.params.id)
      if (!tender || tender.status !== 'open') {
        return response.status(404).json({ error: 'Tender is not open for bidding' })
      }

      if (parsed.data.bidPricePerKwh > tender.maxBasePricePerKwh) {
        return response.status(400).json({
          error: `Bid price (₹${parsed.data.bidPricePerKwh}) cannot exceed the tender ceiling price of ₹${tender.maxBasePricePerKwh}`,
        })
      }

      const sig = generateDePinSignature({
        type: 'TENDER_BID_SUBMIT',
        tenderId: tender.tenderId,
        bidderId: request.user.sub,
        price: parsed.data.bidPricePerKwh,
      })

      const bid = await Bid.create({
        tenderId: tender._id,
        tenderCode: tender.tenderId,
        bidderId: request.user.sub,
        bidderEmail: request.user.email,
        bidderCompanyName: parsed.data.bidderCompanyName,
        bidPricePerKwh: parsed.data.bidPricePerKwh,
        capacityOfferedKw: parsed.data.capacityOfferedKw,
        deliveryTimelineDays: parsed.data.deliveryTimelineDays,
        status: 'pending',
        solanaTxSignature: sig,
      })

      return response.status(201).json({
        message: `Competitive supplier bid of ₹${parsed.data.bidPricePerKwh}/kWh submitted!`,
        bid,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/:id/award', async (request, response) => {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only DISCOM / Grid Admins can award tenders' })
    }

    const { bidId } = request.body
    if (!bidId) {
      return response.status(400).json({ error: 'bidId is required' })
    }

    try {
      const tender = await Tender.findById(request.params.id)
      if (!tender) {
        return response.status(404).json({ error: 'Tender not found' })
      }

      const bid = await Bid.findById(bidId)
      if (!bid) {
        return response.status(404).json({ error: 'Bid not found' })
      }

      // Mark winning bid and tender
      tender.status = 'awarded'
      tender.awardedBidId = bid._id
      tender.awardedSupplier = `${bid.bidderCompanyName} (${bid.bidderEmail})`
      await tender.save()

      bid.status = 'accepted'
      await bid.save()

      // Reject all other bids for this tender
      await Bid.updateMany({ tenderId: tender._id, _id: { $ne: bid._id } }, { status: 'rejected' })

      return response.json({
        message: `Tender ${tender.tenderId} successfully awarded to ${bid.bidderCompanyName} at ₹${bid.bidPricePerKwh}/kWh!`,
        tender,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  return router
}
