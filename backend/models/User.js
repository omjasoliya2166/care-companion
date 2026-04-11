import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'patient'], default: 'patient' },
  phone: { type: String, default: '' },
  age: { type: Number },
  avatarUrl: { type: String, default: '' },
  healthMetrics: {
    bloodPressure: { type: String, default: '120/80' },
    heartRate: { type: Number, default: 72 },
    glucose: { type: Number, default: 90 },
    temperature: { type: Number, default: 36.6 },
    history: [{
      bloodPressure: String,
      heartRate: Number,
      glucose: Number,
      temperature: Number,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
