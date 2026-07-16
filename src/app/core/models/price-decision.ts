export interface PriceDecision {
  sku: string;
  storeId: string;
  timestamp: string;
  oldPrice: number;
  newPrice: number;
  demandSignal: string;
  competitorPriceRef: string;
  justification: string;
}