import mongoose from 'mongoose'

const tradingListingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerEmail: {
      type: String,
      required: true,
    },
    meterId: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    energyAmountKwh: {
      type: Number,
      required: true,
      min: 0.1,
    },
    remainingKwh: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerKwh: {
      type: Number,
      required: true,
      min: 0.5,
    },
    sourceType: {
      type: String,
      enum: ['rooftop_solar', 'microgrid', 'battery_storage'],
      default: 'rooftop_solar',
    },
    locationZone: {
      type: String,
      default: 'Bangalore Electronic City Grid-Zone A',
    },
    status: {
      type: String,
      enum: ['open', 'partial', 'sold', 'cancelled'],
      default: 'open',
      index: true,
    },
    solanaTxSignature: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

export const TradingListing =
  mongoose.models.TradingListing || mongoose.model('TradingListing', tradingListingSchema)
