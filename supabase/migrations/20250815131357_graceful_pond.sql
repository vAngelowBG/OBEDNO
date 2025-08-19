/*
  # Add subscription status to restaurants

  1. Changes
    - Add `subscription_status` column to restaurants table
    - Add `subscription_expires_at` column to track subscription expiry
    - Update existing restaurants to have 'inactive' status by default
    - Add check constraint for subscription_status values

  2. Security
    - No RLS changes needed as existing policies cover the new columns
*/

-- Add subscription status column to restaurants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN subscription_status text DEFAULT 'inactive';
  END IF;
END $$;

-- Add subscription expiry tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN subscription_expires_at timestamptz;
  END IF;
END $$;

-- Add check constraint for subscription status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'restaurants_subscription_status_check'
  ) THEN
    ALTER TABLE restaurants ADD CONSTRAINT restaurants_subscription_status_check 
    CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled'));
  END IF;
END $$;