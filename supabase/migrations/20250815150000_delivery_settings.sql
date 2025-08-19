-- Migration: Add delivery settings to restaurants
-- Date: 2025-08-15

-- Add delivery settings columns to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS delivery_fee decimal(10,2) DEFAULT 0 CHECK (delivery_fee >= 0),
ADD COLUMN IF NOT EXISTS free_delivery_threshold decimal(10,2) DEFAULT NULL CHECK (free_delivery_threshold IS NULL OR free_delivery_threshold > 0),
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'fixed' CHECK (delivery_type IN ('fixed', 'free', 'conditional'));

-- Update existing restaurants to have default values
UPDATE restaurants 
SET 
  delivery_fee = COALESCE(delivery_fee, 0),
  delivery_type = CASE 
    WHEN delivery_fee = 0 THEN 'free'
    WHEN free_delivery_threshold IS NOT NULL THEN 'conditional'
    ELSE 'fixed'
  END
WHERE delivery_type IS NULL;

-- Add comment
COMMENT ON COLUMN restaurants.delivery_fee IS 'Fixed delivery fee in BGN';
COMMENT ON COLUMN restaurants.free_delivery_threshold IS 'Order amount threshold for free delivery';
COMMENT ON COLUMN restaurants.delivery_type IS 'Type of delivery: fixed, free, or conditional';

-- Create index for delivery queries
CREATE INDEX IF NOT EXISTS idx_restaurants_delivery ON restaurants(delivery_type, delivery_fee, free_delivery_threshold);
