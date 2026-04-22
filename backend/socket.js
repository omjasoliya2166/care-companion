import { Server } from 'socket.io';

let io;
const users = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    socket.on('register_user', (userId) => {
      if (userId) {
        users[userId] = socket.id;
        socket.join(userId);
      }
    });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('join_blog_room', (blogId) => {
      socket.join(`blog_${blogId}`);
    });

    socket.on('send_message', (data) => {
      socket.to(data.chatId).emit('receive_message', data);
    });

    socket.on('typing', ({ chatId, userId }) => {
      socket.to(chatId).emit('user_typing', { userId });
    });

    // Video Call Signaling
    socket.on('call_user', ({ userToCall, signalData, from, name }) => {
      io.to(userToCall).emit('incoming_call', { signal: signalData, from, name });
    });

    socket.on('answer_call', (data) => {
      io.to(data.to).emit('call_accepted', data.signal);
    });

    socket.on('end_call', ({ to }) => {
      io.to(to).emit('call_ended');
    });

    socket.on('reject_call', ({ to }) => {
      io.to(to).emit('call_rejected');
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
      io.to(to).emit('ice_candidate', { candidate, from: socket.id });
    });

    socket.on('disconnect', () => {
      Object.keys(users).forEach(key => {
        if (users[key] === socket.id) delete users[key];
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
