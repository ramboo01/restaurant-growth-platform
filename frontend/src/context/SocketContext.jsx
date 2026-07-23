import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if the user is authenticated (owner or staff)
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return undefined;
    }

    const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'] // Try WebSocket first, fallback to polling
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server:', newSocket.id);
      setIsConnected(true);

      // Immediately join the restaurant room
      if (user.restaurantId) {
        newSocket.emit('joinRestaurantRoom', user.restaurantId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (user.restaurantId) {
        newSocket.emit('leaveRestaurantRoom', user.restaurantId);
      }
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.restaurantId]); // Re-run if auth state or restaurantId changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
