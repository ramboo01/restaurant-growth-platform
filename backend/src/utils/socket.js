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

      // Allow a client (e.g., owner dashboard or kitchen display) to join a "restaurant room"
      // to listen only for events related to their specific restaurant.
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
