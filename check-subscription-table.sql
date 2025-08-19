-- Check Subscription Table - Run this in Supabase SQL Editor
-- This script helps debug subscription table issues

-- 1. Check if the table exists
SELECT 
  'Table Check' as info,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_user_subscriptions'
  ) as table_exists;

-- 2. If table exists, check its structure
SELECT 
  'Table Structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stripe_user_subscriptions'
ORDER BY ordinal_position;

-- 3. Check if there are any rows in the table
SELECT 
  'Row Count' as info,
  COUNT(*) as total_rows
FROM stripe_user_subscriptions;

-- 4. Check RLS policies
SELECT 
  'RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'stripe_user_subscriptions';

-- 5. Check if RLS is enabled
SELECT 
  'RLS Status' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'stripe_user_subscriptions';

-- 6. Create the table if it doesn't exist (for testing)
CREATE TABLE IF NOT EXISTS stripe_user_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. Enable RLS
ALTER TABLE stripe_user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policy (allow users to see only their own subscriptions)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON stripe_user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON stripe_user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 9. Insert a test subscription for the current user
INSERT INTO stripe_user_subscriptions (user_id, subscription_status, current_period_end, cancel_at_period_end)
VALUES (
  auth.uid(),
  'active',
  EXTRACT(EPOCH FROM (NOW() + INTERVAL '1 year')),
  false
)
ON CONFLICT (user_id) DO UPDATE SET
  subscription_status = EXCLUDED.subscription_status,
  current_period_end = EXCLUDED.current_period_end,
  cancel_at_period_end = EXCLUDED.cancel_at_period_end,
  updated_at = now();

-- 10. Verify the test subscription
SELECT 
  'Test Subscription' as info,
  subscription_status,
  current_period_end,
  cancel_at_period_end,
  created_at
FROM stripe_user_subscriptions 
WHERE user_id = auth.uid();
