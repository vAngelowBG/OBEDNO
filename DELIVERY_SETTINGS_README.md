# Настройки за доставка - Ресторанти

Този документ описва новата функционалност за контрол на доставката в ресторантите.

## Преглед

Ресторантите могат да конфигурират три типа доставка:
- **Фиксирана** - фиксирана такса за всички поръчки
- **Безплатна** - безплатна доставка за всички поръчки
- **Условна** - такса за доставка, но безплатна при поръчки над определена сума

## Функционалности

### 1. Настройки за доставка в Dashboard
- **DeliverySettings** компонент в ресторантския dashboard
- Редактиране на тип доставка, такса и праг
- Предварителен изглед на настройките
- Валидация и запазване в базата данни

### 2. Показване в ресторантски карти
- **DeliveryInfo** компонент в RestaurantCard
- Информация за типа доставка
- Такса за доставка (ако има)
- Условия за безплатна доставка

### 3. Показване в ресторантски страници
- Информация за доставката в header-а
- Динамично показване според текущата количка
- Оставаща сума до безплатна доставка

### 4. Динамично проследяване в количката
- Показване на текущата сума в количката
- Изчисляване на оставащата сума до безплатна доставка
- Автоматично обновяване при промяна на количката

## База данни

### Нови полета в `restaurants` таблицата:
```sql
delivery_fee decimal(10,2) DEFAULT 0
free_delivery_threshold decimal(10,2) DEFAULT NULL
delivery_type text DEFAULT 'fixed'
```

### Типове доставка:
- `'fixed'` - фиксирана такса
- `'free'` - безплатна доставка
- `'conditional'` - условна безплатна доставка

### Индекси:
```sql
CREATE INDEX idx_restaurants_delivery ON restaurants(delivery_type, delivery_fee, free_delivery_threshold);
```

## Компоненти

### DeliveryInfo
Показва информация за доставката с динамично съдържание според типа.

**Props:**
- `deliveryFee: number` - такса за доставка
- `freeDeliveryThreshold: number | null` - праг за безплатна доставка
- `deliveryType: 'fixed' | 'free' | 'conditional'` - тип доставка
- `currentCartTotal?: number` - текуща сума в количката

**Функционалности:**
- Показване на типа доставка с икони
- Изчисляване на оставащата сума до безплатна доставка
- Динамично обновяване според количката

### DeliverySettings
Компонент за редактиране на настройките за доставка в dashboard-а.

**Props:**
- `restaurantId: string` - ID на ресторанта
- `currentSettings: object` - текущи настройки
- `onUpdate: function` - callback при обновяване

**Функционалности:**
- Избор на тип доставка с визуални бутони
- Редактиране на такса и праг
- Предварителен изглед на настройките
- Валидация и запазване

## Използване

### 1. В ресторантски карти (RestaurantCard)
```tsx
<DeliveryInfo
  deliveryFee={restaurant.delivery_fee || 0}
  freeDeliveryThreshold={restaurant.free_delivery_threshold}
  deliveryType={restaurant.delivery_type || 'fixed'}
/>
```

### 2. В ресторантски страници (RestaurantPage)
```tsx
<DeliveryInfo
  deliveryFee={restaurant.delivery_fee || 0}
  freeDeliveryThreshold={restaurant.free_delivery_threshold}
  deliveryType={restaurant.delivery_type || 'fixed'}
  currentCartTotal={getCartTotal()}
/>
```

### 3. В dashboard (RestaurantDashboard)
```tsx
<DeliverySettings
  restaurantId={restaurant.id}
  currentSettings={{
    delivery_fee: restaurant.delivery_fee || 0,
    free_delivery_threshold: restaurant.free_delivery_threshold,
    delivery_type: restaurant.delivery_type || 'fixed'
  }}
  onUpdate={handleDeliveryUpdate}
/>
```

## Настройка

### 1. База данни
Изпълнете SQL скрипта `delivery-setup.sql` в Supabase SQL редактора.

### 2. Типове
Обновете `database.types.ts` с новите полета.

### 3. Компоненти
Добавете `DeliveryInfo` и `DeliverySettings` компонентите.

## Примери за конфигурация

### Фиксирана доставка
```sql
UPDATE restaurants 
SET 
  delivery_fee = 5.00,
  free_delivery_threshold = NULL,
  delivery_type = 'fixed'
WHERE id = 'restaurant-id';
```

### Безплатна доставка
```sql
UPDATE restaurants 
SET 
  delivery_fee = 0.00,
  free_delivery_threshold = NULL,
  delivery_type = 'free'
WHERE id = 'restaurant-id';
```

### Условна безплатна доставка
```sql
UPDATE restaurants 
SET 
  delivery_fee = 3.00,
  free_delivery_threshold = 30.00,
  delivery_type = 'conditional'
WHERE id = 'restaurant-id';
```

## UI/UX особености

### Цветово кодиране
- 🟢 Зелено - безплатна доставка
- 🔵 Синьо - информация за условна доставка
- ⚫ Сиво - фиксирана такса

### Икони
- 🎁 Gift - безплатна доставка
- 🚚 Truck - такса за доставка
- ⚙️ Settings - условна доставка
- ℹ️ Info - допълнителна информация

### Responsive дизайн
- Адаптивни карти за мобилни устройства
- Гъвкаво разположение на елементите
- Оптимизирани за touch интерфейси

## Бъдещи подобрения

- [ ] Масово редактиране на доставката
- [ ] Графики за анализ на доставката
- [ ] Автоматични промоции за доставка
- [ ] Интеграция с доставни услуги
- [ ] Географски базирани такси за доставка
