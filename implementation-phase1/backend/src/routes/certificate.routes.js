import crypto from 'crypto'
import { Router } from 'express'
import { z } from 'zod'
import { generateDePinSignature } from '../blockchain/solanaClient.js'
import { requireAuth } from '../middleware/auth.js'
import { CarbonCertificate } from '../models/carbonCertificate.model.js'
import { Wallet } from '../models/wallet.model.js'

const claimSchema = z.object({
  claimPurpose: z.string().min(3).default('Corporate Scope 2 Carbon Neutrality Compliance'),
})

export function createCertificateRouter() {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (request, response) => {
    try {
      const certificates = await CarbonCertificate.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()

      const userCertificates = await CarbonCertificate.find({
        $or: [{ currentOwnerId: request.user.sub }, { producerId: request.user.sub }],
      })
        .sort({ createdAt: -1 })
        .lean()

      // Aggregate global carbon metrics
      const totalKgAgg = await CarbonCertificate.aggregate([
        { $group: { _id: null, totalKg: { $sum: '$carbonOffsetKg' }, totalKwh: { $sum: '$energyAmountKwh' } } },
      ])
      const totalCarbonKg = totalKgAgg[0]?.totalKg || 0
      const totalSolarKwh = totalKgAgg[0]?.totalKwh || 0

      return response.json({
        stats: {
          totalCarbonOffsetKg: Number(totalCarbonKg.toFixed(2)),
          totalCarbonOffsetTonnes: Number((totalCarbonKg / 1000).toFixed(3)),
          totalSolarKwhGenerated: Number(totalSolarKwh.toFixed(1)),
          equivalentTreesPlanted: Math.round(totalCarbonKg / 21.77),
          activeCertificatesCount: certificates.length,
        },
        marketCertificates: certificates.map((cert) => ({
          id: cert._id.toString(),
          certificateId: cert.certificateId,
          producerMeterId: cert.producerMeterId,
          producerEmail: cert.producerEmail,
          currentOwnerEmail: cert.currentOwnerEmail,
          energyAmountKwh: cert.energyAmountKwh,
          carbonOffsetKg: cert.carbonOffsetKg,
          treesEquivalent: cert.treesEquivalent,
          sourceType: cert.sourceType,
          digitalSignature: cert.digitalSignature,
          solanaTxSignature: cert.solanaTxSignature,
          status: cert.status,
          createdAt: cert.createdAt,
        })),
        myCertificates: userCertificates.map((cert) => ({
          id: cert._id.toString(),
          certificateId: cert.certificateId,
          producerMeterId: cert.producerMeterId,
          energyAmountKwh: cert.energyAmountKwh,
          carbonOffsetKg: cert.carbonOffsetKg,
          status: cert.status,
          createdAt: cert.createdAt,
        })),
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/issue', async (request, response) => {
    try {
      const energyKwh = Number(request.body.energyAmountKwh) || 25.0
      const meterId = String(request.body.meterId || 'M001').toUpperCase()
      const carbonOffsetKg = Number((energyKwh * 0.85).toFixed(3))
      const trees = Math.round(carbonOffsetKg / 21.77)
      const certId = `VC-REC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`

      const digSig = crypto
        .createHash('sha256')
        .update(`${certId}:${meterId}:${energyKwh}:${carbonOffsetKg}`)
        .digest('hex')

      const solSig = generateDePinSignature({
        type: 'CARBON_REC_MINT',
        certId,
        meterId,
        carbonOffsetKg,
      })

      const cert = await CarbonCertificate.create({
        certificateId: certId,
        producerId: request.user.sub,
        producerEmail: request.user.email,
        producerMeterId: meterId,
        currentOwnerId: request.user.sub,
        currentOwnerEmail: request.user.email,
        energyAmountKwh: energyKwh,
        carbonOffsetKg,
        carbonOffsetTonnes: Number((carbonOffsetKg / 1000).toFixed(4)),
        treesEquivalent: trees,
        digitalSignature: digSig,
        solanaTxSignature: solSig,
        status: 'active',
      })

      // Update user wallet cumulative carbon stats
      await Wallet.updateOne(
        { userId: request.user.sub },
        { $inc: { totalCarbonOffsetKg: carbonOffsetKg } }
      )

      return response.status(201).json({
        message: 'Green Carbon Offset Certificate generated and signed on-chain!',
        certificate: cert,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/claim/:id', async (request, response) => {
    const parsed = claimSchema.safeParse(request.body || {})
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid claim data' })
    }

    try {
      const cert = await CarbonCertificate.findById(request.params.id)
      if (!cert || cert.status !== 'active') {
        return response.status(404).json({ error: 'Certificate is not available for claim' })
      }

      cert.status = 'claimed'
      cert.currentOwnerId = request.user.sub
      cert.currentOwnerEmail = request.user.email
      cert.claimedAt = new Date()
      cert.claimPurpose = parsed.data.claimPurpose
      await cert.save()

      return response.json({
        message: `Carbon certificate ${cert.certificateId} successfully claimed for corporate ESG compliance!`,
        certificate: cert,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  return router
}
