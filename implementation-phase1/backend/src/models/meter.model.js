import mongoose from 'mongoose'

const meterSchema = new mongoose.Schema(
  {
    meterId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 64,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ['registered', 'online', 'offline', 'error'],
      default: 'registered',
      required: true,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    blockchainRegistrationStatus: {
      type: String,
      enum: ['disabled', 'confirmed', 'failed'],
      default: 'disabled',
      required: true,
    },
    blockchainRegistrationTransactionHash: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

export const Meter = mongoose.models.Meter || mongoose.model('Meter', meterSchema)
