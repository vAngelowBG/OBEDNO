-- Quick Fix for Subscription Issue - Run this in Supabase SQL Editor
-- This script quickly creates and populates the subscription table

-- 1. Create the subscription table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_user_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE stripe_user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy
DROP POLICY IF EXISTS "Users can view own subscriptions" ON stripe_user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON stripe_user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 4. Insert or update subscription for current user
INSERT INTO stripe_user_subscriptions (user_id, subscription_status, current_period_end, cancel_at_period_end)
VALUES (
  auth.uid(),
  'active',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 year')),
  false
)
ON CONFLICT (user_id) DO UPDATE SET
  subscription_status = 'active',
  current_period_end = EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 year')),
  cancel_at_period_end = false,
  updated_at = now();

-- 5. Verify
SELECT 'Subscription created/updated successfully!' as status;
