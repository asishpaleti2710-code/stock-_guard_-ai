import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product';
import { PriceDecision } from '../models/price-decision';
import { ReorderRequest } from '../models/reorder-request';
import { SimulationService } from './simulation.service';

export interface AlertsResponse {
  lowStockProducts: Product[];
  pendingReorders: ReorderRequest[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private simService: SimulationService) {}

  getAllProducts(): Observable<Product[]> {
    return this.simService.getProducts$();
  }

  getPriceHistory(storeId: string, sku: string): Observable<PriceDecision[]> {
    return this.simService.getPriceDecisions$().pipe(
      map(decisions => decisions.filter(d => d.sku === sku))
    );
  }

  getAlerts(): Observable<AlertsResponse> {
    return this.simService.getProducts$().pipe(
      map(products => {
        const lowStock = products.filter(p => p.stock <= p.reorderThreshold);
        const reorders = []; // can get from reorder list
        return {
          lowStockProducts: lowStock,
          pendingReorders: [] // or fetch from reorders subject
        };
      })
    );
  }

  getReorderRequests(): Observable<ReorderRequest[]> {
    return this.simService.getReorderRequests$();
  }
}