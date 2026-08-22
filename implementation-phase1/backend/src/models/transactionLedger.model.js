import mongoose from 'mongoose'

const transactionLedgerSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'SOLAR_EXPORT_CREDIT',
        'P2P_BUY_DEBIT',
        'P2P_SELL_CREDIT',
        'DEPOSIT',
        'WITHDRAWAL',
        'CARBON_REWARD',
        'TENDER_SETTLEMENT',
      ],
      required: true,
    },
    amountInr: {
      type: Number,
      required: true,
    },
    balanceAfterInr: {
      type: Number,
      required: true,
    },
    energyKwh: {
      type: Number,
      default: 0,
    },
    ratePerKwh: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String, // meterId, listingId, or payout ID
      default: null,
    },
    solanaTxSignature: {
      type: String,
      index: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
)

export const TransactionLedger =
  mongoose.models.TransactionLedger || mongoose.model('TransactionLedger', transactionLedgerSchema)
