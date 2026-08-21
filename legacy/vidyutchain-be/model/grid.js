import mongoose from 'mongoose';

const gridSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  specifications: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  transactionSignature: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Grid = mongoose.model('Grid', gridSchema);

export default Grid; 