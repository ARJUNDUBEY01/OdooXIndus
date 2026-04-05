import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  verifiedToken: { type: String }, // Token returned after verification
  createdAt: { type: Date, default: Date.now, index: { expires: '10m' } } // Auto-delete after 10 mins
});

export default mongoose.model('Otp', otpSchema);
