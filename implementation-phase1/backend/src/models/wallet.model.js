import mongoose from 'mongoose'

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    solanaPublicKey: {
      type: String,
      required: true,
      index: true,
    },
    solanaSecretKeyEncrypted: {
      type: String,
      required: true,
    },
    ethereumAddress: {
      type: String,
      required: true,
      index: true,
    },
    ethereumPrivateKeyEncrypted: {
      type: String,
      required: true,
    },
    balanceInr: {
      type: Number,
      default: 500.0,
      min: 0,
    },
    autoSettleEnabled: {
      type: Boolean,
      default: true,
    },
    feedInTariffRateInr: {
      type: Number,
      default: 3.5, // INR per exported kWh
    },
    totalSolarEarningsInr: {
      type: Number,
      default: 0.0,
    },
    totalCarbonOffsetKg: {
      type: Number,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
)

export const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema)
