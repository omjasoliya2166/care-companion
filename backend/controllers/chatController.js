import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import { getIO } from '../socket.js';

export const getOrCreateChat = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Check if appointment exists and is approved or completed
    const appointment = await Appointment.findById(appointmentId).populate('doctorId').lean();
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (!['approved', 'completed'].includes(appointment.status)) return res.status(403).json({ message: 'Chat is only enabled for approved or completed appointments' });

    // Check if chat already exists
    let chat = await Chat.findOne({ appointmentId })
      .populate('participants', 'fullName email role')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId', populate: { path: 'userId', select: 'fullName' } }
      })
      .lean();

    if (!chat) {
      // Create new chat
      const newChat = await Chat.create({
        appointmentId,
        participants: [appointment.patientId, appointment.doctorId.userId]
      });
      chat = await Chat.findById(newChat._id)
        .populate('participants', 'fullName email role')
        .populate({
          path: 'appointmentId',
          populate: { path: 'doctorId', populate: { path: 'userId', select: 'fullName' } }
        })
        .lean();
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('participants', 'fullName email role')
      .populate({
        path: 'appointmentId',
        populate: [
          { path: 'patientId', select: 'fullName' },
          { path: 'doctorId', populate: { path: 'userId', select: 'fullName' } }
        ]
      })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, message, type, fileUrl, fileName } = req.body;
    const newMessage = await Message.create({
      chatId,
      senderId: req.user._id,
      message,
      type: type || 'text',
      fileUrl,
      fileName
    });

    // Update last message in chat
    await Chat.findByIdAndUpdate(chatId, { 
      lastMessage: newMessage._id,
      updatedAt: Date.now() 
    });

    // Real-time Emit
    try {
      const io = getIO();
      io.to(chatId).emit('receive_message', newMessage);
    } catch (socketErr) {}

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const chatsDocs = await Chat.find({ participants: req.user._id })
      .populate('participants', 'fullName profileImage role')
      .populate('lastMessage')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId', populate: { path: 'userId', select: 'fullName' } }
      })
      .sort({ updatedAt: -1 });
      
    // Convert to plain objects and append unreadCount
    const chats = await Promise.all(chatsDocs.map(async (chatDoc) => {
      const chat = chatDoc.toObject();
      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        senderId: { $ne: req.user._id },
        read: false
      });
      chat.unreadCount = unreadCount;
      return chat;
    }));
      
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const type = (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) 
      ? 'pdf' 
      : req.file.mimetype.split('/')[0];

    // Cloudinary returns the URL in path or secure_url depending on setup
    // With multer-storage-cloudinary, it's usually in req.file.path
    let fileUrl = req.file.path;
    
    // If it's a local file path (doesn't start with http), make it a proper relative URL for static serving
    if (fileUrl && !fileUrl.startsWith('http')) {
      // Normalize slashes and ensure it starts with /
      fileUrl = `/${fileUrl.replace(/\\/g, '/')}`;
    }

    res.json({
      url: fileUrl,
      name: req.file.originalname,
      type: type
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    await Message.updateMany(
      { chatId, senderId: { $ne: req.user._id }, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
