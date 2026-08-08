let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    const { FRONTEND_URL } = require('../config/env');
    const allowedOrigins = FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean);

    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) {
            return callback(null, true);
          }
          if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1')
          ) {
            return callback(null, true);
          }
          return callback(new Error('CORS origin is not allowed.'));
        },
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

      // Per-order room — for live guest tracking (order status & real-time driver GPS)
      socket.on('joinOrderRoom', (orderId) => {
        if (orderId) {
          const room = `order_${orderId}`;
          socket.join(room);
          console.log(`[Socket] Client ${socket.id} joined order room ${room}`);
        }
      });

      socket.on('leaveOrderRoom', (orderId) => {
        if (orderId) {
          const room = `order_${orderId}`;
          socket.leave(room);
          console.log(`[Socket] Client ${socket.id} left order room ${room}`);
        }
      });

      // Driver GPS location update event broadcast
      socket.on('driverLocationUpdate', (data) => {
        const { orderId, restaurantId, lat, lng, heading, speed } = data || {};
        if (orderId) {
          io.to(`order_${orderId}`).emit('driver_location_changed', { orderId, lat, lng, heading, speed, timestamp: new Date() });
        }
        if (restaurantId) {
          io.to(`restaurant_${restaurantId}`).emit('driver_location_changed', { orderId, lat, lng, heading, speed, timestamp: new Date() });
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
  },
  emitOrderStatusUpdate: (orderId, restaurantId, statusData) => {
    if (io) {
      if (orderId) io.to(`order_${orderId}`).emit('order_status_updated', statusData);
      if (restaurantId) io.to(`restaurant_${restaurantId}`).emit('order_status_updated', statusData);
    }
  },
  emitDriverLocation: (orderId, restaurantId, locationData) => {
    if (io) {
      if (orderId) io.to(`order_${orderId}`).emit('driver_location_changed', locationData);
      if (restaurantId) io.to(`restaurant_${restaurantId}`).emit('driver_location_changed', locationData);
    }
  }
};

