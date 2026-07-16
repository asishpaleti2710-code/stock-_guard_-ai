import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SimulationService } from '../../core/services/simulation.service';
import { ReorderRequest } from '../../core/models/reorder-request';
import { Product } from '../../core/models/product';

@Component({
  selector: 'app-purchase-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-requests.component.html',
  styleUrls: ['./purchase-requests.component.scss']
})
export class PurchaseRequestsComponent implements OnInit, OnDestroy {
  purchaseOrders: ReorderRequest[] = [];
  products: Product[] = [];
  selectedPO: ReorderRequest | null = null;

  // Filters
  statusFilter = 'ALL';
  priorityFilter = 'ALL';

  private sub = new Subscription();

  constructor(private simService: SimulationService) {}

  ngOnInit(): void {
    this.sub.add(
      this.simService.getReorderRequests$().subscribe(requests => {
        this.purchaseOrders = requests;
        // Auto-select first PO if available and none selected yet
        if (requests.length > 0 && !this.selectedPO) {
          this.selectedPO = requests[0];
        }
      })
    );

    this.sub.add(
      this.simService.getProducts$().subscribe(products => {
        this.products = products;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  getProductName(sku: string): string {
    const product = this.products.find(p => p.sku === sku);
    return product ? product.productName : sku;
  }

  getProductBasePrice(sku: string): number {
    const product = this.products.find(p => p.sku === sku);
    return product ? product.basePrice : 30;
  }

  getFilteredPOs(): ReorderRequest[] {
    return this.purchaseOrders.filter(po => {
      const matchStatus = this.statusFilter === 'ALL' || po.status === this.statusFilter;
      
      // Simulating priority filter (e.g. products like milk have high priority reorders)
      const priority = po.sku === 'PROD-001' || po.sku === 'PROD-004' ? 'HIGH' : 'NORMAL';
      const matchPriority = this.priorityFilter === 'ALL' || priority === this.priorityFilter;
      
      return matchStatus && matchPriority;
    });
  }

  selectPO(po: ReorderRequest): void {
    this.selectedPO = po;
  }

  approvePO(po: ReorderRequest): void {
    // If PO is still drafted inside dashboard/simulator
    // Since PO status is SENT after simulator approval, let's allow confirming delivery directly in this component!
    if (po.status === 'SENT') {
      po.status = 'CONFIRMED';
      // replenishing stock immediately in local products state
      const productsList = this.simService.getProducts$().subscribe(products => {
        const prod = products.find(p => p.sku === po.sku);
        if (prod) {
          prod.stock += po.quantity;
        }
      });
      productsList.unsubscribe();
    }
  }
}