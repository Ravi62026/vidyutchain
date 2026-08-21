import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  tender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tender',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  deliveryTimeline: {
    type: Date,
    required: true
  },
  termsAndConditions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  transactionSignature: {
    type: String,
    required: true
  },
  // Payout fields
  isPaidOut: {
    type: Boolean,
    default: false
  },
  payoutTransactionSignature: {
    type: String,
    default: null
  },
  paymentTransactionSignature: {
    type: String,
    default: null
  },
  paymentTokenMint: {
    type: String,
    default: null
  },
  payoutTimestamp: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Compound index to ensure a bidder can place only one bid per tender
bidSchema.index({ tender: 1, bidder: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid; 