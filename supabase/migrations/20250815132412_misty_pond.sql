/*
  # Add subscription management settings

  1. New Tables
    - Update `admin_settings` table to include subscription management settings
      - `subscription_enabled` (boolean) - Global toggle for subscription system
      - `force_free_access` (boolean) - Override to give free access to all restaurants

  2. Security
    - Maintain existing RLS policies on admin_settings table
    - Only admins can modify these settings
*/

DO $$
BEGIN
  -- Add subscription management columns to admin_settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'subscription_enabled'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN subscription_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'force_free_access'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN force_free_access boolean DEFAULT false;
  END IF;
END $$;

-- Insert default admin settings if none exist
INSERT INTO admin_settings (subscription_enabled, force_free_access)
SELECT true, false
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);