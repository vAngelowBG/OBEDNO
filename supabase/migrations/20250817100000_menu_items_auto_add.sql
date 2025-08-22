-- Add auto_add column to menu_items
ALTER TABLE menu_items ADD COLUMN auto_add boolean DEFAULT false;

-- Add template_id column to reference original item
ALTER TABLE menu_items ADD COLUMN template_id uuid REFERENCES menu_items(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_menu_items_auto_add ON menu_items(auto_add) WHERE auto_add = true;
