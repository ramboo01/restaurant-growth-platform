import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  const { user } = useAuth();
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [restaurants, setRestaurants] = useState([]);

  // On login / user change — populate from user object
  useEffect(() => {
    if (!user) {
      setActiveRestaurantId(null);
      setRestaurants([]);
      return;
    }

    // Load accessible restaurants from user data (set by login)
    const stored = localStorage.getItem('accessibleRestaurants');
    let accessList = user.accessibleRestaurants || [];
    if ((!accessList || accessList.length === 0) && stored) {
      try { accessList = JSON.parse(stored); } catch { accessList = []; }
    }
    setRestaurants(accessList);

    // Restore saved active restaurant or use primary/user default
    const savedActive = localStorage.getItem('activeRestaurantId');
    if (savedActive) {
      setActiveRestaurantId(Number(savedActive));
    } else {
      const primary = accessList.find(r => r.isPrimary);
      setActiveRestaurantId(primary ? primary.id : (user.restaurantId || 1));
    }

    // If owner or admin, fetch the full list of restaurants to populate the dropdown automatically
    if (user.role === 'Owner' || user.role === 'Admin') {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://restaurant-growth-platform.onrender.com';
      fetch(`${baseUrl}/api/public/restaurants`)
        .then((res) => res.json())
        .then((res) => {
          const list = res?.data?.restaurants || [];
          if (list.length > 0) {
            const mapped = list.map((r) => ({
              id: r.id,
              name: r.name,
              status: r.status || 'Active',
              isPrimary: r.id === user.restaurantId
            }));
            setRestaurants(mapped);
            localStorage.setItem('accessibleRestaurants', JSON.stringify(mapped));
            
            const currentSaved = localStorage.getItem('activeRestaurantId');
            if (!currentSaved) {
              const primary = mapped.find((r) => r.isPrimary) || mapped[0];
              setActiveRestaurantId(primary.id);
              localStorage.setItem('activeRestaurantId', String(primary.id));
            }
          }
        })
        .catch((err) => console.error('Failed to fetch restaurants list:', err));
    } else {
      if (accessList.length > 0) {
        localStorage.setItem('accessibleRestaurants', JSON.stringify(accessList));
      }
    }
  }, [user]);

  const switchRestaurant = (restaurantId) => {
    setActiveRestaurantId(restaurantId);
    localStorage.setItem('activeRestaurantId', String(restaurantId));
  };

  const activeRestaurant = useMemo(() => {
    return restaurants.find(r => r.id === activeRestaurantId) || null;
  }, [restaurants, activeRestaurantId]);

  const value = useMemo(() => ({
    activeRestaurantId,
    activeRestaurant,
    restaurants,
    switchRestaurant,
    setRestaurants
  }), [activeRestaurantId, activeRestaurant, restaurants]);

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}

export default RestaurantContext;
