import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import appointmentRoutes from './routes/appointments.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from './routes/notifications.js';

import { Server } from 'socket.io';
import http from 'http';
import chatRoutes from './routes/chat.js';
import prescriptionRoutes from './routes/prescriptions.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO logic
const users = {}; // Map socketId to userId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register_user', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat room: ${chatId}`);
  });

  socket.on('send_message', (data) => {
    // data: { chatId, senderId, message, type, fileUrl, fileName, createdAt }
    io.to(data.chatId).emit('receive_message', data);
    console.log(`New message in chat ${data.chatId}`);
  });

  socket.on('typing', ({ chatId, userId }) => {
    socket.to(chatId).emit('user_typing', { userId });
  });

  // Video Call Signaling
  socket.on('call_user', ({ userToCall, signalData, from, name }) => {
    const targetSocket = users[userToCall];
    if (targetSocket) {
      io.to(targetSocket).emit('incoming_call', { signal: signalData, from, name });
    }
  });

  socket.on('answer_call', (data) => {
    const targetSocket = users[data.to];
    if (targetSocket) {
      io.to(targetSocket).emit('call_accepted', data.signal);
    }
  });

  socket.on('end_call', ({ to }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit('call_ended');
    }
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit('ice_candidate', { candidate, from: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user mapping
    Object.keys(users).forEach(key => {
      if (users[key] === socket.id) delete users[key];
    });
  });
});

// Routes Placeholder
app.get('/', (req, res) => {
  res.send('Care Companion API is running...');
});

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/care-companion';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
