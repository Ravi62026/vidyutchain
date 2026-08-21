import mongoose from 'mongoose';

const solarInstallationSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'SolarProduct', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  installationAddress: { type: String, required: true },
  contactNumber: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending'
  },
  transactionHash: { type: String },
  scheduledDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SolarInstallation = mongoose.model('SolarInstallation', solarInstallationSchema);

export default SolarInstallation;