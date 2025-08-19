import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { audioService } from '../services/audioService';
import { useAuthContext } from './AuthContext';

interface NotificationContextType {
  isSubscribed: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile, isRestaurant } = useAuthContext();
  
  useEffect(() => {
    if (!profile || !isRestaurant) return;
    
    // Get restaurant ID
    const getRestaurantId = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', profile.id)
        .single();
        
      return data?.id;
    };
    
    // Setup realtime subscription
    const setupSubscription = async () => {
      const restaurantId = await getRestaurantId();
      if (!restaurantId) return;
      
      const channel = supabase
        .channel(`orders-${restaurantId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          async (payload) => {
            console.log('🔔 New order received:', payload.new);
            
            // Show notification
            toast.success(`🔔 Нова поръчка за ${payload.new.total.toFixed(2)} лв.!`, {
              duration: 6000,
              position: 'top-right',
            });
            
            // Play sound
            await audioService.playNotification();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const cleanup = setupSubscription();
    return () => {
      cleanup.then(fn => fn?.());
    };
    
  }, [profile, isRestaurant]);

  return (
    <NotificationContext.Provider value={{ isSubscribed: true }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
