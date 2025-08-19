# Client Orders and My Restaurants Functionality

This document describes the implementation of client-only menu with Orders and My Restaurants pages.

## Overview

The implementation adds two new pages accessible only to users with the `client` role:
- `/orders` - Chronological list of all user orders
- `/my-restaurants` - List of restaurants the user has ordered from

## Features

### Orders Page (`/orders`)
- **Chronological display**: Orders sorted by `created_at` DESC
- **Status filtering**: All, Active (pending, confirmed, preparing, ready, delivering), Delivered, Cancelled
- **Pagination**: 20 orders per page with "Load More" functionality
- **Order details**: Restaurant info, status, total amount, date, delivery window
- **Empty state**: Helpful message when no orders exist

### My Restaurants Page (`/my-restaurants`)
- **Unique restaurants**: Shows only restaurants the user has ordered from
- **Last order tracking**: Displays when the user last ordered from each restaurant
- **Grid layout**: Responsive card-based design
- **Direct navigation**: "View Menu" button links to restaurant pages

## Database Changes

### Required Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_orders_client_created ON orders(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client_rest ON orders(client_id, restaurant_id);
```

### Database View
```sql
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
```

## Security

### Row Level Security (RLS)
- Orders table already has RLS enabled
- Clients can only see orders where `client_id = auth.uid()`
- The view inherits RLS from base tables

### Access Control
- Only authenticated users with `profile.role === 'client'` can access these pages
- Non-clients are redirected to home page
- Unauthenticated users are redirected to login

## Components

### New Components
- `OrdersPage` - Main orders listing page
- `MyRestaurantsPage` - Restaurants listing page
- `StatusBadge` - Visual status indicator for orders

### Updated Components
- `Header` - Added navigation links for clients
- `App.tsx` - Added new routes

## API Queries

### Orders Query
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    id,
    status,
    total,
    currency,
    created_at,
    delivery_window,
    restaurant:restaurants(
      name,
      logo_url,
      city
    )
  `)
  .eq('client_id', profile?.id)
  .in('status', statuses)
  .order('created_at', { ascending: false })
  .range(from, to);
```

### Restaurants Query
```typescript
// Get distinct restaurant IDs from orders
const { data: orderData } = await supabase
  .from('orders')
  .select('restaurant_id')
  .eq('client_id', profile?.id)
  .not('restaurant_id', 'is', null);

// Get restaurant details
const { data: restaurantData } = await supabase
  .from('restaurants')
  .select('id, name, slug, logo_url, city')
  .in('id', restaurantIds);
```

## Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL editor:
```bash
# Copy and paste the contents of database-setup.sql
# Or run the migration file: supabase/migrations/20250815140000_client_orders_view.sql
```

### 2. Application Setup
The application is already configured with:
- New routes in `App.tsx`
- Updated navigation in `Header.tsx`
- New page components
- TypeScript types updated

### 3. Verification
- Check that indexes were created: `idx_orders_client_created`, `idx_orders_client_rest`
- Verify view exists: `client_recent_restaurants`
- Test navigation for client users
- Verify RLS is working correctly

## Usage

### For Clients
1. Navigate to `/orders` to view order history
2. Use status filters to find specific orders
3. Navigate to `/my-restaurants` to see favorite restaurants
4. Click "View Menu" to return to restaurant pages

### For Developers
- Orders page supports pagination and filtering
- My Restaurants page shows unique restaurants with last order dates
- All data is properly secured with RLS
- Components are responsive and accessible

## Performance Considerations

- Indexes on `(client_id, created_at DESC)` for fast order retrieval
- Indexes on `(client_id, restaurant_id)` for restaurant lookups
- Pagination limits data transfer
- Efficient queries with proper joins

## Future Enhancements

- Order details page (`/orders/[order_id]`)
- Order tracking and notifications
- Restaurant favorites and ratings
- Order history export
- Advanced filtering and search
