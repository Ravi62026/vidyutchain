import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema(
  {
    meterId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    telemetryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Telemetry',
      required: true,
    },
    anomalyType: {
      type: String,
      enum: [
        'LOAD_THEFT',
        'METER_TAMPERING',
        'REVERSE_ENERGY',
        'COMMUNICATION_FAILURE',
        'OVERLOAD',
        'CONSUMPTION_ANOMALY',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'resolved'],
      default: 'open',
      required: true,
    },
  },
  { timestamps: true },
)

alertSchema.index({ meterId: 1, status: 1, createdAt: -1 })

export const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema)
