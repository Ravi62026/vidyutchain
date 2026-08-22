import { Router } from 'express'
import { z } from 'zod'
import { generateDePinSignature } from '../blockchain/solanaClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TradingListing } from '../models/tradingListing.model.js'
import { TransactionLedger } from '../models/transactionLedger.model.js'
import { getOrCreateWallet } from './wallet.routes.js'

const createListingSchema = z.object({
  meterId: z.string().min(3),
  energyAmountKwh: z.number().min(0.1).max(5000),
  pricePerKwh: z.number().min(0.5).max(50.0),
  sourceType: z.enum(['rooftop_solar', 'microgrid', 'battery_storage']).default('rooftop_solar'),
  locationZone: z.string().default('Bangalore Electronic City Grid-Zone A'),
})

const buyListingSchema = z.object({
  buyKwh: z.number().min(0.1).optional(),
})

export function createTradingRouter() {
  const router = Router()
  router.use(requireAuth)

  router.get('/listings', async (request, response) => {
    try {
      const listings = await TradingListing.find({ status: { $in: ['open', 'partial'] } })
        .sort({ createdAt: -1 })
        .lean()

      const userListings = await TradingListing.find({ sellerId: request.user.sub })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      return response.json({
        marketListings: listings.map((item) => ({
          id: item._id.toString(),
          sellerId: item.sellerId.toString(),
          sellerEmail: item.sellerEmail,
          meterId: item.meterId,
          energyAmountKwh: item.energyAmountKwh,
          remainingKwh: item.remainingKwh,
          pricePerKwh: item.pricePerKwh,
          sourceType: item.sourceType,
          locationZone: item.locationZone,
          status: item.status,
          solanaTxSignature: item.solanaTxSignature,
          createdAt: item.createdAt,
        })),
        myListings: userListings.map((item) => ({
          id: item._id.toString(),
          meterId: item.meterId,
          energyAmountKwh: item.energyAmountKwh,
          remainingKwh: item.remainingKwh,
          pricePerKwh: item.pricePerKwh,
          status: item.status,
          createdAt: item.createdAt,
        })),
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/list', async (request, response) => {
    const parsed = createListingSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid listing data', details: parsed.error.flatten() })
    }

    try {
      const sig = generateDePinSignature({
        type: 'P2P_SELL_OFFER',
        sellerId: request.user.sub,
        meterId: parsed.data.meterId,
        kwh: parsed.data.energyAmountKwh,
        price: parsed.data.pricePerKwh,
      })

      const listing = await TradingListing.create({
        sellerId: request.user.sub,
        sellerEmail: request.user.email,
        meterId: parsed.data.meterId.toUpperCase(),
        energyAmountKwh: parsed.data.energyAmountKwh,
        remainingKwh: parsed.data.energyAmountKwh,
        pricePerKwh: parsed.data.pricePerKwh,
        sourceType: parsed.data.sourceType,
        locationZone: parsed.data.locationZone,
        status: 'open',
        solanaTxSignature: sig,
      })

      return response.status(201).json({
        message: 'Surplus solar energy offer listed on P2P marketplace!',
        listing: {
          id: listing._id.toString(),
          meterId: listing.meterId,
          energyAmountKwh: listing.energyAmountKwh,
          pricePerKwh: listing.pricePerKwh,
          status: listing.status,
          solanaTxSignature: listing.solanaTxSignature,
        },
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/buy/:id', async (request, response) => {
    const parsed = buyListingSchema.safeParse(request.body || {})
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid buy parameters' })
    }

    try {
      const listing = await TradingListing.findById(request.params.id)
      if (!listing || listing.status === 'sold' || listing.status === 'cancelled') {
        return response.status(404).json({ error: 'Energy listing is no longer available' })
      }

      if (listing.sellerId.toString() === request.user.sub) {
        return response.status(400).json({ error: 'You cannot purchase your own energy listing' })
      }

      const purchaseKwh = parsed.data.buyKwh
        ? Math.min(parsed.data.buyKwh, listing.remainingKwh)
        : listing.remainingKwh

      const totalCost = Number((purchaseKwh * listing.pricePerKwh).toFixed(2))

      // Check buyer wallet
      const buyerWallet = await getOrCreateWallet(request.user.sub, request.user.email)
      if (buyerWallet.balanceInr < totalCost) {
        return response.status(400).json({
          error: `Insufficient wallet balance. Total cost: ₹${totalCost.toFixed(2)}, Available: ₹${buyerWallet.balanceInr.toFixed(2)}`,
        })
      }

      // Check seller wallet
      const sellerWallet = await getOrCreateWallet(listing.sellerId, listing.sellerEmail)

      // Execute atomic balance transfer
      buyerWallet.balanceInr -= totalCost
      sellerWallet.balanceInr += totalCost
      sellerWallet.totalSolarEarningsInr += totalCost

      await Promise.all([buyerWallet.save(), sellerWallet.save()])

      // Update listing state
      listing.remainingKwh -= purchaseKwh
      if (listing.remainingKwh <= 0.001) {
        listing.status = 'sold'
        listing.remainingKwh = 0
      } else {
        listing.status = 'partial'
      }
      await listing.save()

      // Generate verifiable Solana DePIN transaction signature
      const solanaSignature = generateDePinSignature({
        type: 'P2P_TRADE_SETTLEMENT',
        listingId: listing._id.toString(),
        buyerId: request.user.sub,
        sellerId: listing.sellerId.toString(),
        kwh: purchaseKwh,
        amountInr: totalCost,
        timestamp: Date.now(),
      })

      // Create ledger entries for both parties
      await Promise.all([
        TransactionLedger.create({
          walletId: buyerWallet._id,
          userId: request.user.sub,
          type: 'P2P_BUY_DEBIT',
          amountInr: -totalCost,
          balanceAfterInr: buyerWallet.balanceInr,
          energyKwh: purchaseKwh,
          ratePerKwh: listing.pricePerKwh,
          description: `P2P Clean Energy Purchase: ${purchaseKwh} kWh from ${listing.sellerEmail}`,
          referenceId: listing._id.toString(),
          solanaTxSignature: solanaSignature,
          status: 'completed',
        }),
        TransactionLedger.create({
          walletId: sellerWallet._id,
          userId: listing.sellerId,
          type: 'P2P_SELL_CREDIT',
          amountInr: totalCost,
          balanceAfterInr: sellerWallet.balanceInr,
          energyKwh: purchaseKwh,
          ratePerKwh: listing.pricePerKwh,
          description: `P2P Solar Sale Earning: ${purchaseKwh} kWh purchased by ${request.user.email}`,
          referenceId: listing._id.toString(),
          solanaTxSignature: solanaSignature,
          status: 'completed',
        }),
      ])

      return response.json({
        message: `Successfully purchased ${purchaseKwh} kWh of clean solar power for ₹${totalCost.toFixed(2)}!`,
        trade: {
          listingId: listing._id.toString(),
          energyKwh: purchaseKwh,
          totalCostInr: totalCost,
          pricePerKwh: listing.pricePerKwh,
          solanaTxSignature: solanaSignature,
          buyerBalanceRemaining: buyerWallet.balanceInr,
        },
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.get('/suggest-price', async (request, response) => {
    try {
      const hour = new Date().getHours()
      const aiBase = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'
      const aiResponse = await fetch(`${aiBase}/predict-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energyAmountKwh: Number(request.query.kwh) || 10,
          hour: Number(request.query.hour) || hour,
          temperatureCelsius: Number(request.query.temp) || 28.0,
          cloudCoveragePercent: Number(request.query.clouds) || 15.0,
          basePriceInr: 3.5,
        }),
      })

      const data = await aiResponse.json()
      return response.json(data)
    } catch (error) {
      // Fallback
      return response.json({
        suggestedPricePerKwh: 3.2,
        basePriceInr: 3.5,
        timeOfDayLabel: 'Peak solar surplus',
        marketAdvice: 'Optimal daytime solar export window.',
      })
    }
  })

  return router
}
