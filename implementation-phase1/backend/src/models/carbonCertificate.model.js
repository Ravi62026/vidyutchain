import mongoose from 'mongoose'

const carbonCertificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    producerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    producerEmail: {
      type: String,
      required: true,
    },
    producerMeterId: {
      type: String,
      required: true,
      uppercase: true,
    },
    currentOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentOwnerEmail: {
      type: String,
      required: true,
    },
    energyAmountKwh: {
      type: Number,
      required: true,
    },
    carbonOffsetKg: {
      type: Number,
      required: true,
    },
    carbonOffsetTonnes: {
      type: Number,
      required: true,
    },
    treesEquivalent: {
      type: Number,
      required: true,
    },
    sourceType: {
      type: String,
      default: 'rooftop_solar',
    },
    digitalSignature: {
      type: String,
      required: true,
    },
    solanaTxSignature: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'claimed', 'retired'],
      default: 'active',
      index: true,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    claimPurpose: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const CarbonCertificate =
  mongoose.models.CarbonCertificate || mongoose.model('CarbonCertificate', carbonCertificateSchema)
