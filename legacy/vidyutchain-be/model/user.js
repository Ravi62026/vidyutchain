import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  walletAddress: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: [
      'producer', 
      'consumer', 
      'bidder',
      'industry',
      'solar-seller',
      'admin'
    ], 
    default: 'consumer' 
  },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

export default User;