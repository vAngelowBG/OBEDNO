// Real-time order notification service using Supabase
import { supabase } from '../lib/supabase';
import { audioService } from './audioService';
import toast from 'react-hot-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class OrderNotificationService {
  private channel: RealtimeChannel | null = null;
  private restaurantId: string | null = null;
  private isSubscribed: boolean = false;

  public async subscribeToOrders(restaurantId: string): Promise<void> {
    console.log('🔔 Attempting to subscribe to orders for restaurant:', restaurantId);
    
    if (this.isSubscribed && this.restaurantId === restaurantId) {
      console.log('🔔 Already subscribed to this restaurant');
      return; // Already subscribed to this restaurant
    }

    // Unsubscribe from previous subscription if exists
    await this.unsubscribe();

    this.restaurantId = restaurantId;

    try {
      // Create realtime channel for orders
      this.channel = supabase
        .channel(`restaurant-orders-${restaurantId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          (payload) => {
            console.log('🔔 New order received:', payload);
            this.handleNewOrder(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          (payload) => {
            // Optional: Handle order status updates
            console.log('Order updated:', payload);
          }
        )
        .subscribe((status) => {
          console.log('Order subscription status:', status);
          this.isSubscribed = status === 'SUBSCRIBED';
        });
    } catch (error) {
      console.error('Failed to subscribe to orders:', error);
    }
  }

  private async handleNewOrder(payload: any): Promise<void> {
    const newOrder = payload.new;
    
    console.log('🔔 Order payload received:', payload);
    console.log('New order data:', newOrder);
    
    // Show notification for ANY new order (remove status check for testing)
    if (newOrder && newOrder.id) {
      console.log('🔔 Showing notification for order:', newOrder.id);
      
      // Show toast notification
      toast.success(`🔔 Нова поръчка #${newOrder.id}! Сума: ${newOrder.total?.toFixed(2) || '0.00'} лв.`, {
        duration: 6000,
        position: 'top-right',
      });
      
      // Play audio notification
      await audioService.playNotification();
      
      // Show browser notification if permission granted
      await this.showBrowserNotification(newOrder);
    } else {
      console.log('⚠️ No valid order data in payload');
    }
  }

  private async showBrowserNotification(order: any): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Нова поръчка!', {
        body: `Поръчка #${order.id} - ${order.total.toFixed(2)} лв.`,
        icon: '/favicon.ico',
        tag: `order-${order.id}`,
        requireInteraction: true,
      });
    } else if (Notification.permission !== 'denied') {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.showBrowserNotification(order);
      }
    }
  }

  public async unsubscribe(): Promise<void> {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isSubscribed = false;
    this.restaurantId = null;
  }

  public getSubscriptionStatus(): { isSubscribed: boolean; restaurantId: string | null } {
    return {
      isSubscribed: this.isSubscribed,
      restaurantId: this.restaurantId,
    };
  }

  // Request browser notification permission
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }
}

// Singleton instance
export const orderNotificationService = new OrderNotificationService();
