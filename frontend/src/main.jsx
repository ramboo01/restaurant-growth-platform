import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import App from './app/App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RestaurantProvider } from './context/RestaurantContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RestaurantProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </RestaurantProvider>
    </AuthProvider>
  </React.StrictMode>
);
