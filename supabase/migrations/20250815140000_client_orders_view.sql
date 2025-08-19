-- Migration: Add client orders indexes and view
-- Date: 2025-08-15

-- Add required indexes for client orders
CREATE INDEX IF NOT EXISTS idx_orders_client_created ON orders(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client_rest ON orders(client_id, restaurant_id);

-- Create view for client recent restaurants
CREATE OR REPLACE VIEW client_recent_restaurants AS
SELECT DISTINCT ON (o.client_id, o.restaurant_id)
  o.client_id,
  o.restaurant_id,
  r.name,
  r.slug,
  r.logo_url,
  r.city,
  MAX(o.created_at) OVER (PARTITION BY o.client_id, o.restaurant_id) as last_order_at
FROM orders o
JOIN restaurants r ON r.id = o.restaurant_id
WHERE o.client_id IS NOT NULL;

-- Enable RLS on the view (inherits from base tables)
ALTER VIEW client_recent_restaurants SET (security_invoker = true);

-- Add comment
COMMENT ON VIEW client_recent_restaurants IS 'View for clients to see restaurants they have ordered from, with last order date';
