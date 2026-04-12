import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  medicines: [{
    name: { type: String, required: true },
    quantity: { type: String },
    dosage: {
      morning: { type: Boolean, default: false },
      noon: { type: Boolean, default: false },
      evening: { type: Boolean, default: false }
    },
    duration: { type: String, default: '' },
    mealTiming: { type: String, enum: ['Before Meal', 'After Meal'], required: true },
    description: { type: String, default: '' }
  }],
  generalNotes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Prescription', prescriptionSchema);
