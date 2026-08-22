import mongoose from 'mongoose'

const tenderSchema = new mongoose.Schema(
  {
    tenderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    feederArea: {
      type: String,
      required: true,
      default: 'Substation Feeder 04 - East Bangalore Industrial Hub',
    },
    energyRequiredKwh: {
      type: Number,
      required: true,
      min: 10,
    },
    maxBasePricePerKwh: {
      type: Number,
      required: true,
      min: 0.5,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'evaluation', 'awarded', 'closed', 'cancelled'],
      default: 'open',
      index: true,
    },
    awardedBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
      default: null,
    },
    awardedSupplier: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    solanaTxSignature: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

export const Tender = mongoose.models.Tender || mongoose.model('Tender', tenderSchema)
