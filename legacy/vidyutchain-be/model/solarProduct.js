import mongoose from 'mongoose';

const solarProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  capacity: { type: String, required: true },
  price: { type: Number, required: true },
  priceInSOL: { type: Number, required: true },
  panels: { type: Number, required: true },
  features: [{ type: String }],
  imageUrl: { type: String, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SolarProduct = mongoose.model('SolarProduct', solarProductSchema);

export default SolarProduct; 