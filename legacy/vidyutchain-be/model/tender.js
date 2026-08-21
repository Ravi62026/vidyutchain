import mongoose from 'mongoose';

const tenderSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  grid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grid',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  requirements: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'closed', 'awarded', 'cancelled'],
    default: 'open'
  },
  awardedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionSignature: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Add validation to ensure endDate is after startDate
tenderSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

const Tender = mongoose.model('Tender', tenderSchema);

export default Tender; 