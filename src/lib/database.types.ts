export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: 'client' | 'restaurant' | 'admin';
          name: string;
          phone: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'client' | 'restaurant' | 'admin';
          name: string;
          phone?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'client' | 'restaurant' | 'admin';
          name?: string;
          phone?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          city: string;
          districts: string[];
          address: string;
          phone: string;
          email: string;
          delivery_zones: string[];
          channels: ('viber' | 'whatsapp' | 'email' | 'web')[];
          cutoff_time: string;
          delivery_window: string;
          delivery_fee: number;
          free_delivery_threshold: number | null;
          delivery_type: 'fixed' | 'free' | 'conditional';
          payment_vpos: any;
          status: 'active' | 'inactive' | 'suspended';
          orders_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          city: string;
          districts?: string[];
          address: string;
          phone: string;
          email: string;
          delivery_zones?: string[];
          channels?: ('viber' | 'whatsapp' | 'email' | 'web')[];
          cutoff_time?: string;
          delivery_window?: string;
          delivery_fee?: number;
          free_delivery_threshold?: number | null;
          delivery_type?: 'fixed' | 'free' | 'conditional';
          payment_vpos?: any;
          status?: 'active' | 'inactive' | 'suspended';
          orders_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          city?: string;
          districts?: string[];
          address?: string;
          phone?: string;
          email?: string;
          delivery_zones?: string[];
          channels?: ('viber' | 'whatsapp' | 'email' | 'web')[];
          cutoff_time?: string;
          delivery_window?: string;
          delivery_fee?: number;
          free_delivery_threshold?: number | null;
          delivery_type?: 'fixed' | 'free' | 'conditional';
          payment_vpos?: any;
          status?: 'active' | 'inactive' | 'suspended';
          orders_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menus: {
        Row: {
          id: string;
          restaurant_id: string;
          menu_date: string;
          publish_at: string | null;
          valid_from: string;
          valid_to: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          menu_date: string;
          publish_at?: string | null;
          valid_from: string;
          valid_to: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          menu_date?: string;
          publish_at?: string | null;
          valid_from?: string;
          valid_to?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          menu_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category: string;
          stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category?: string;
          stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          menu_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category?: string;
          stock?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          client_id: string | null;
          restaurant_id: string | null;
          menu_date: string;
          channel: 'viber' | 'whatsapp' | 'email' | 'web';
          payment_method: 'cash' | 'card' | 'online';
          payment_processor: string | null;
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
          subtotal: number;
          delivery_fee: number;
          discount: number;
          total: number;
          currency: string;
          customer_name: string;
          customer_phone: string;
          address_line: string;
          address_extra: string | null;
          replace_rules: string | null;
          fiscal_doc_number: string | null;
          fiscal_doc_url: string | null;
          delivery_window: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          restaurant_id?: string | null;
          menu_date: string;
          channel?: 'viber' | 'whatsapp' | 'email' | 'web';
          payment_method?: 'cash' | 'card' | 'online';
          payment_processor?: string | null;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
          subtotal?: number;
          delivery_fee?: number;
          discount?: number;
          total?: number;
          currency?: string;
          customer_name: string;
          customer_phone: string;
          address_line: string;
          address_extra?: string | null;
          replace_rules?: string | null;
          fiscal_doc_number?: string | null;
          fiscal_doc_url?: string | null;
          delivery_window?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          restaurant_id?: string | null;
          menu_date?: string;
          channel?: 'viber' | 'whatsapp' | 'email' | 'web';
          payment_method?: 'cash' | 'card' | 'online';
          payment_processor?: string | null;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
          subtotal?: number;
          delivery_fee?: number;
          discount?: number;
          total?: number;
          currency?: string;
          customer_name?: string;
          customer_phone?: string;
          address_line?: string;
          address_extra?: string | null;
          replace_rules?: string | null;
          fiscal_doc_number?: string | null;
          fiscal_doc_url?: string | null;
          delivery_window?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          name: string;
          unit_price: number;
          qty: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          name: string;
          unit_price: number;
          qty?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          name?: string;
          unit_price?: number;
          qty?: number;
          created_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          order_id: string;
          client_id: string | null;
          restaurant_id: string | null;
          score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          client_id?: string | null;
          restaurant_id?: string | null;
          score: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          client_id?: string | null;
          restaurant_id?: string | null;
          score?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      saved_addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string;
          address_line: string;
          extra: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          label: string;
          address_line: string;
          extra?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          label?: string;
          address_line?: string;
          extra?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
        };
      };
      admin_settings: {
        Row: {
          id: string;
          cities: string[];
          platform_fee_type: string;
          platform_fee_value: number;
          reminder_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cities?: string[];
          platform_fee_type?: string;
          platform_fee_value?: number;
          reminder_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cities?: string[];
          platform_fee_type?: string;
          platform_fee_value?: number;
          reminder_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      client_recent_restaurants: {
        Row: {
          client_id: string;
          restaurant_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          city: string;
          last_order_at: string;
        };
        Insert: never;
        Update: never;
      };
    };
    Enums: {
      user_role: 'client' | 'restaurant' | 'admin';
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
      payment_method: 'cash' | 'card' | 'online';
      restaurant_status: 'active' | 'inactive' | 'suspended';
      order_channel: 'viber' | 'whatsapp' | 'email' | 'web';
    };
  };
}