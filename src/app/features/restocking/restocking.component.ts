import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SimulationService } from '../../core/services/simulation.service';
import { Product } from '../../core/models/product';

import { ReorderRequest } from '../../core/models/reorder-request';

@Component({
  selector: 'app-restocking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './restocking.component.html',
  styleUrls: ['./restocking.component.scss']
})
export class RestockingComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  restockingLogs: string[] = [];
  reorderRequests: ReorderRequest[] = [];
  autopilotActive = false;

  private sub = new Subscription();

  constructor(public simService: SimulationService) {}

  ngOnInit(): void {
    this.sub.add(
      this.simService.autopilotRestocking$.subscribe(active => {
        this.autopilotActive = active;
      })
    );

    this.sub.add(
      this.simService.getProducts$().subscribe(products => {
        this.products = products;
      })
    );

    this.sub.add(
      this.simService.getRestockingLogs$().subscribe(logs => {
        this.restockingLogs = logs;
      })
    );

    this.sub.add(
      this.simService.getReorderRequests$().subscribe(requests => {
        this.reorderRequests = requests;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  getLowStockProducts(): Product[] {
    return this.products.filter(p => p.stock <= p.reorderThreshold);
  }

  getDraftedRequests(): ReorderRequest[] {
    return this.reorderRequests.filter(r => r.status === 'DRAFTED');
  }

  approvePO(sku: string): void {
    this.simService.approvePOBySku(sku);
  }

  getProductName(sku: string): string {
    const p = this.products.find(prod => prod.sku === sku);
    return p ? p.productName : sku;
  }

  toggleAutopilot(): void {
    this.simService.autopilotRestocking = !this.simService.autopilotRestocking;
  }

  triggerRestock(sku: string): void {
    this.simService.triggerManualRestock(sku);
  }

  clearLogs(): void {
    this.simService.restockingLogsSubject.next([
      `[${new Date().toLocaleTimeString()}] System: Logs cleared.`
    ]);
  }

  getDepletionDays(p: Product): string {
    if (p.todaySalesUnits === 0) return '99+';
    const days = Math.round((p.stock / p.todaySalesUnits) * 10) / 10;
    return days <= 0 ? 'Depleted' : `${days} days`;
  }
}
