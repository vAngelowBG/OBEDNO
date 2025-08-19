/*
  # OBEDNO Database Schema

  1. New Tables
    - `profiles` - User profiles with role-based access
    - `restaurants` - Restaurant information and settings  
    - `menus` - Daily menu schedules
    - `menu_items` - Individual menu items
    - `orders` - Customer orders
    - `order_items` - Order line items
    - `ratings` - Order ratings and reviews
    - `saved_addresses` - Customer saved addresses
    - `admin_settings` - Platform settings

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure data access based on user roles
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'restaurant', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'online');
CREATE TYPE restaurant_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE order_channel AS ENUM ('viber', 'whatsapp', 'email', 'web');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role user_role DEFAULT 'client' NOT NULL,
  name text NOT NULL,
  phone text,
  city text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  city text NOT NULL,
  districts text[] DEFAULT '{}',
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  delivery_zones text[] DEFAULT '{}',
  channels order_channel[] DEFAULT '{viber,whatsapp,email,web}',
  cutoff_time time DEFAULT '11:00:00' NOT NULL,
  delivery_window text DEFAULT '12:00-14:00' NOT NULL,
  payment_vpos jsonb DEFAULT '{}',
  status restaurant_status DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  menu_date date NOT NULL,
  publish_at timestamptz,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(restaurant_id, menu_date)
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid REFERENCES menus(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  category text DEFAULT 'main' NOT NULL,
  stock integer DEFAULT 0 NOT NULL CHECK (stock >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  menu_date date NOT NULL,
  channel order_channel DEFAULT 'web' NOT NULL,
  payment_method payment_method DEFAULT 'cash' NOT NULL,
  payment_processor text,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  subtotal decimal(10,2) DEFAULT 0 NOT NULL CHECK (subtotal >= 0),
  delivery_fee decimal(10,2) DEFAULT 0 NOT NULL CHECK (delivery_fee >= 0),
  discount decimal(10,2) DEFAULT 0 NOT NULL CHECK (discount >= 0),
  total decimal(10,2) NOT NULL CHECK (total >= 0),
  currency text DEFAULT 'BGN' NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  address_line text NOT NULL,
  address_extra text,
  replace_rules text,
  fiscal_doc_number text,
  fiscal_doc_url text,
  delivery_window text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  qty integer DEFAULT 1 NOT NULL CHECK (qty > 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Saved addresses table
CREATE TABLE IF NOT EXISTS saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  address_line text NOT NULL,
  extra text,
  lat decimal(10,8),
  lng decimal(11,8),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cities text[] DEFAULT '{"София","Пловдив","Варна","Бургас","Русе"}',
  platform_fee_type text DEFAULT 'percentage',
  platform_fee_value decimal(5,2) DEFAULT 5.00,
  reminder_hour integer DEFAULT 9 CHECK (reminder_hour >= 0 AND reminder_hour <= 23),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_date ON menus(menu_date);
CREATE INDEX IF NOT EXISTS idx_menus_published ON menus(is_published);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(menu_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_profile_id ON saved_addresses(profile_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Restaurants policies
CREATE POLICY "Anyone can read active restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Restaurant owners can manage their restaurants"
  ON restaurants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = restaurants.owner_id
    )
  );

CREATE POLICY "Admins can manage all restaurants"
  ON restaurants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Menus policies
CREATE POLICY "Anyone can read published menus"
  ON menus FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Restaurant owners can manage their menus"
  ON menus FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      JOIN profiles p ON p.id = r.owner_id
      WHERE r.id = menus.restaurant_id
      AND p.user_id = auth.uid()
    )
  );

-- Menu items policies
CREATE POLICY "Anyone can read menu items from published menus"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM menus m
      WHERE m.id = menu_items.menu_id
      AND m.is_published = true
    )
  );

CREATE POLICY "Restaurant owners can manage their menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM menus m
      JOIN restaurants r ON r.id = m.restaurant_id
      JOIN profiles p ON p.id = r.owner_id
      WHERE m.id = menu_items.menu_id
      AND p.user_id = auth.uid()
    )
  );

-- Orders policies
CREATE POLICY "Users can read their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.id = orders.client_id
    )
  );

CREATE POLICY "Restaurant owners can read their orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      JOIN profiles p ON p.id = r.owner_id
      WHERE r.id = orders.restaurant_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND (p.id = orders.client_id OR orders.client_id IS NULL)
    )
  );

CREATE POLICY "Restaurant owners can update their orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      JOIN profiles p ON p.id = r.owner_id
      WHERE r.id = orders.restaurant_id
      AND p.user_id = auth.uid()
    )
  );

-- Order items policies
CREATE POLICY "Users can read order items from their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN profiles p ON p.id = o.client_id
      WHERE o.id = order_items.order_id
      AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      JOIN profiles p ON p.id = r.owner_id
      WHERE o.id = order_items.order_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN profiles p ON p.id = o.client_id
      WHERE o.id = order_items.order_id
      AND p.user_id = auth.uid()
    )
  );

-- Ratings policies
CREATE POLICY "Anyone can read ratings"
  ON ratings FOR SELECT
  TO authenticated;

CREATE POLICY "Users can create ratings for their orders"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.id = ratings.client_id
    )
  );

-- Saved addresses policies
CREATE POLICY "Users can manage their saved addresses"
  ON saved_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.id = saved_addresses.profile_id
    )
  );

-- Admin settings policies
CREATE POLICY "Anyone can read admin settings"
  ON admin_settings FOR SELECT
  TO authenticated;

CREATE POLICY "Admins can manage admin settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Insert default admin settings
INSERT INTO admin_settings (cities, platform_fee_type, platform_fee_value, reminder_hour)
VALUES (
  '{"София","Пловдив","Варна","Бургас","Русе","Стара Загора","Плевен","Сливен","Добрич","Шумен"}',
  'percentage',
  5.00,
  9
) ON CONFLICT DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();