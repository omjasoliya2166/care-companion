import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/fileUpload.js';
import {
  getOrCreateChat,
  getMessages,
  sendMessage,
  getUserChats,
  handleFileUpload,
  getAllChats,
  markMessagesAsRead
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/admin/all', protect, authorize('admin'), getAllChats);
router.get('/my-chats', protect, getUserChats);
router.get('/:appointmentId', protect, getOrCreateChat);
router.get('/messages/:chatId', protect, getMessages);
router.post('/messages', protect, sendMessage);
router.put('/messages/:chatId/read', protect, markMessagesAsRead);
router.post('/upload', protect, upload.single('file'), handleFileUpload);

export default router;
