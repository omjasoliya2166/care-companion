import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  experience: { type: Number, default: 0 },
  profileImage: { type: String, default: '' },
  bio: { type: String, default: '' },
  available: { type: Boolean, default: true },
  consultationFee: { type: Number, default: 1500 },
  unavailableSlots: [{
    date: { type: String, required: true },
    time: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Doctor', doctorSchema);
