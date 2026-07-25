import React, { createContext, useEffect, useMemo, useState } from 'react';
import { getProfile, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../services/authService';

export const AuthContext = createContext(null);

function readStoredUser() {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = localStorage.getItem('jwt');

      if (!token) {
        logoutRequest();
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getProfile();
        const profileUser = response?.data?.user || null;
        if (profileUser) {
          localStorage.setItem('user', JSON.stringify(profileUser));
          if (active) {
            setUser(profileUser);
          }
        }
      } catch {
        logoutRequest();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function login(payload) {
    const response = await loginRequest(payload);
    const nextUser = response?.data?.user || null;
    const token = response?.data?.token;

    if (token) {
      localStorage.setItem('jwt', token);
    }
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    }
    setUser(nextUser);

    return response;
  }

  async function register(payload) {
    return registerRequest(payload);
  }

  function logout() {
    logoutRequest();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      loading,
      isAuthenticated: Boolean(user)
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

