import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useRestaurant } from './RestaurantContext';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { activeRestaurantId } = useRestaurant();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const targetRestaurantId = activeRestaurantId || user?.restaurantId || 1;

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('joinRestaurantRoom', targetRestaurantId);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leaveRestaurantRoom', targetRestaurantId);
      newSocket.disconnect();
    };
  }, [user?.restaurantId, activeRestaurantId]); // Re-run if auth state or restaurantId / activeRestaurantId changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
