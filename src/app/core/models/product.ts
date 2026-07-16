export interface Product {
  sku: string;
  storeId: string;
  productName: string;
  currentPrice: number;
  basePrice: number;
  stock: number;
  reorderThreshold: number;
  lastPriceUpdate: string;
  lastUpdatedBy: 'AI' | 'MANUAL';
  category: string;
  avgSales7Days: number;
  todaySalesUnits: number;
}