import { Router } from 'express'
import { z } from 'zod'
import { generateDePinSignature, generateDualVaultKeys } from '../blockchain/solanaClient.js'
import { requireAuth } from '../middleware/auth.js'
import { TransactionLedger } from '../models/transactionLedger.model.js'
import { Wallet } from '../models/wallet.model.js'

export async function getOrCreateWallet(userId, userEmail) {
  let wallet = await Wallet.findOne({ userId })
  if (!wallet) {
    const keys = generateDualVaultKeys()
    wallet = await Wallet.create({
      userId,
      userEmail,
      solanaPublicKey: keys.solanaPublicKey,
      solanaSecretKeyEncrypted: keys.solanaSecretKeyEncrypted,
      ethereumAddress: keys.ethereumAddress,
      ethereumPrivateKeyEncrypted: keys.ethereumPrivateKeyEncrypted,
      balanceInr: 1000.0, // Initial demonstration balance
      autoSettleEnabled: true,
      feedInTariffRateInr: 3.5,
    })

    // Create initial welcome ledger record
    const sig = generateDePinSignature({ type: 'WELCOME_BONUS', userId, amount: 1000 })
    await TransactionLedger.create({
      walletId: wallet._id,
      userId,
      type: 'DEPOSIT',
      amountInr: 1000.0,
      balanceAfterInr: 1000.0,
      description: 'Initial VidyutChain Smart Energy Wallet Provisioning Credit',
      solanaTxSignature: sig,
      status: 'completed',
    })
  }
  return wallet
}

const depositSchema = z.object({
  amountInr: z.number().min(10).max(100000),
  paymentMethod: z.string().default('UPI (Instant Simulated Transfer)'),
})

const withdrawSchema = z.object({
  amountInr: z.number().min(10),
  payoutUpiId: z.string().min(3),
  bankName: z.string().default('State Bank of India / HDFC'),
})

const autoSettleSchema = z.object({
  enabled: z.boolean(),
})

export function createWalletRouter() {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (request, response) => {
    try {
      const wallet = await getOrCreateWallet(request.user.sub, request.user.email)
      const transactions = await TransactionLedger.find({ userId: request.user.sub })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()

      return response.json({
        wallet: {
          id: wallet._id.toString(),
          solanaPublicKey: wallet.solanaPublicKey,
          ethereumAddress: wallet.ethereumAddress,
          balanceInr: wallet.balanceInr,
          autoSettleEnabled: wallet.autoSettleEnabled,
          feedInTariffRateInr: wallet.feedInTariffRateInr,
          totalSolarEarningsInr: wallet.totalSolarEarningsInr,
          totalCarbonOffsetKg: wallet.totalCarbonOffsetKg,
          updatedAt: wallet.updatedAt,
        },
        transactions: transactions.map((tx) => ({
          id: tx._id.toString(),
          type: tx.type,
          amountInr: tx.amountInr,
          balanceAfterInr: tx.balanceAfterInr,
          energyKwh: tx.energyKwh,
          ratePerKwh: tx.ratePerKwh,
          description: tx.description,
          referenceId: tx.referenceId,
          solanaTxSignature: tx.solanaTxSignature,
          status: tx.status,
          createdAt: tx.createdAt,
        })),
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/deposit', async (request, response) => {
    const parsed = depositSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid deposit request', details: parsed.error.flatten() })
    }

    try {
      const wallet = await getOrCreateWallet(request.user.sub, request.user.email)
      wallet.balanceInr += parsed.data.amountInr
      await wallet.save()

      const sig = generateDePinSignature({
        type: 'DEPOSIT',
        userId: request.user.sub,
        amount: parsed.data.amountInr,
        timestamp: Date.now(),
      })

      const tx = await TransactionLedger.create({
        walletId: wallet._id,
        userId: request.user.sub,
        type: 'DEPOSIT',
        amountInr: parsed.data.amountInr,
        balanceAfterInr: wallet.balanceInr,
        description: `Top-up via ${parsed.data.paymentMethod}`,
        solanaTxSignature: sig,
        status: 'completed',
      })

      return response.status(201).json({
        message: `₹${parsed.data.amountInr.toFixed(2)} deposited successfully!`,
        balanceInr: wallet.balanceInr,
        transactionId: tx._id.toString(),
        solanaTxSignature: sig,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.post('/withdraw', async (request, response) => {
    const parsed = withdrawSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid withdrawal request', details: parsed.error.flatten() })
    }

    try {
      const wallet = await getOrCreateWallet(request.user.sub, request.user.email)
      if (wallet.balanceInr < parsed.data.amountInr) {
        return response.status(400).json({
          error: `Insufficient wallet balance. Available: ₹${wallet.balanceInr.toFixed(2)}`,
        })
      }

      wallet.balanceInr -= parsed.data.amountInr
      await wallet.save()

      const sig = generateDePinSignature({
        type: 'WITHDRAWAL',
        userId: request.user.sub,
        payoutUpiId: parsed.data.payoutUpiId,
        amount: parsed.data.amountInr,
        timestamp: Date.now(),
      })

      const tx = await TransactionLedger.create({
        walletId: wallet._id,
        userId: request.user.sub,
        type: 'WITHDRAWAL',
        amountInr: -parsed.data.amountInr,
        balanceAfterInr: wallet.balanceInr,
        description: `Instant Payout to UPI: ${parsed.data.payoutUpiId} (${parsed.data.bankName})`,
        solanaTxSignature: sig,
        status: 'completed',
      })

      return response.status(201).json({
        message: `₹${parsed.data.amountInr.toFixed(2)} transferred to ${parsed.data.payoutUpiId}`,
        balanceInr: wallet.balanceInr,
        transactionId: tx._id.toString(),
        solanaTxSignature: sig,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  router.patch('/auto-settle', async (request, response) => {
    const parsed = autoSettleSchema.safeParse(request.body)
    if (!parsed.success) {
      return response.status(400).json({ error: 'Invalid auto-settle status' })
    }

    try {
      const wallet = await getOrCreateWallet(request.user.sub, request.user.email)
      wallet.autoSettleEnabled = parsed.data.enabled
      await wallet.save()

      return response.json({
        message: `Smart Energy Auto-Settle is now ${wallet.autoSettleEnabled ? 'ENABLED' : 'DISABLED'}`,
        autoSettleEnabled: wallet.autoSettleEnabled,
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  })

  return router
}
