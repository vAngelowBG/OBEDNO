export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_ST62tNzVCoszXe',
    priceId: 'price_1RY9quKmJE7OlJlPgzPmtSEc',
    name: 'Membership',
    description: 'Membership test description',
    mode: 'subscription'
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};