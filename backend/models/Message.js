import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: function() { return this.type === 'text'; } },
  type: { type: String, enum: ['text', 'image', 'video', 'pdf', 'file'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);
