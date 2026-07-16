export interface ReorderRequest {
  sku: string;
  storeId: string;
  timestamp: string;
  quantity: number;
  supplier: string;
  status: 'DRAFTED' | 'SENT' | 'CONFIRMED';
  draftDocText: string;
}