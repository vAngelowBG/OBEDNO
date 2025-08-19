-- Migration: Add orders_enabled flag to restaurants
-- Date: 2025-08-17

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS orders_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN restaurants.orders_enabled IS 'Whether online orders are enabled for this restaurant';

