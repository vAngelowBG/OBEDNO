/*
  # Add Admin Subscription Settings

  1. New Columns
    - `subscription_enabled` (boolean) - Controls if subscription system is active
    - `force_free_access` (boolean) - Gives free access to all restaurants

  2. Security
    - Existing RLS policies apply
    - Only admins can modify these settings
*/

DO $$
BEGIN
  -- Add subscription_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'subscription_enabled'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN subscription_enabled boolean DEFAULT true;
  END IF;

  -- Add force_free_access column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'force_free_access'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN force_free_access boolean DEFAULT false;
  END IF;
END $$;

-- Ensure there's at least one admin_settings record
INSERT INTO admin_settings (id) 
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);