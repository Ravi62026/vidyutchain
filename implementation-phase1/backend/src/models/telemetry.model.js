import mongoose from 'mongoose'

const telemetrySchema = new mongoose.Schema(
  {
    meterId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    voltage: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
    },
    current: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    powerKw: {
      type: Number,
      required: true,
      min: -1000,
      max: 1000,
    },
    powerFactor: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
    importKwh: {
      type: Number,
      required: true,
      min: 0,
    },
    exportKwh: {
      type: Number,
      required: true,
      min: 0,
    },
    anomalyType: {
      type: String,
      enum: [
        'NORMAL',
        'LOAD_THEFT',
        'METER_TAMPERING',
        'REVERSE_ENERGY',
        'COMMUNICATION_FAILURE',
      ],
      default: 'NORMAL',
      required: true,
    },
    aiAnomalyType: {
      type: String,
      enum: [
        'NORMAL',
        'LOAD_THEFT',
        'METER_TAMPERING',
        'REVERSE_ENERGY',
        'COMMUNICATION_FAILURE',
      ],
    },
    aiModelVersion: {
      type: String,
      trim: true,
    },
    aiRiskScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    aiReasons: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['normal', 'anomaly', 'communication_failure'],
      default: 'normal',
      required: true,
    },
    source: {
      type: String,
      enum: ['simulator', 'edge_gateway', 'manual'],
      required: true,
    },
    blockchainAuditStatus: {
      type: String,
      enum: ['disabled', 'confirmed', 'failed'],
      default: 'disabled',
      required: true,
    },
    blockchainTransactionHash: {
      type: String,
      trim: true,
    },
    blockchainEventId: {
      type: String,
      trim: true,
    },
    blockchainPayloadHash: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
)

telemetrySchema.index({ meterId: 1, timestamp: -1 })

export const Telemetry = mongoose.models.Telemetry || mongoose.model('Telemetry', telemetrySchema)
