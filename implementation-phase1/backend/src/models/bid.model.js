import mongoose from 'mongoose'

const bidSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: true,
      index: true,
    },
    tenderCode: {
      type: String,
      required: true,
    },
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bidderEmail: {
      type: String,
      required: true,
    },
    bidderCompanyName: {
      type: String,
      required: true,
    },
    bidPricePerKwh: {
      type: Number,
      required: true,
      min: 0.1,
    },
    capacityOfferedKw: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryTimelineDays: {
      type: Number,
      default: 7,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
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

export const Bid = mongoose.models.Bid || mongoose.model('Bid', bidSchema)
