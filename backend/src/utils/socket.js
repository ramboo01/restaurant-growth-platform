let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    const { FRONTEND_URL } = require('../config/env');
    const allowedOrigins = FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean);

    io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // Restaurant room — for owner/kitchen/staff events
      socket.on('joinRestaurantRoom', (restaurantId) => {
        if (restaurantId) {
          const room = `restaurant_${restaurantId}`;
          socket.join(room);
          console.log(`[Socket] Client ${socket.id} joined room ${room}`);
        }
      });

      socket.on('leaveRestaurantRoom', (restaurantId) => {
        if (restaurantId) {
          const room = `restaurant_${restaurantId}`;
          socket.leave(room);
          console.log(`[Socket] Client ${socket.id} left room ${room}`);
        }
      });

      // Per-user room — for customer-specific notifications (review replies, loyalty points, offers)
      socket.on('joinUserRoom', (userId) => {
        if (userId) {
          const room = `user_${userId}`;
          socket.join(room);
          console.log(`[Socket] Client ${socket.id} joined user room ${room}`);
        }
      });

      socket.on('leaveUserRoom', (userId) => {
        if (userId) {
          const room = `user_${userId}`;
          socket.leave(room);
        }
      });

      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
