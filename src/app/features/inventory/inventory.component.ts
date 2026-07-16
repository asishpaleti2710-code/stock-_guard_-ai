import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SimulationService, SimulationState } from '../../core/services/simulation.service';
import { Product } from '../../core/models/product';
import { PriceDecision } from '../../core/models/price-decision';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  priceDecisions: PriceDecision[] = [];
  selectedProduct: Product | null = null;

  simState: SimulationState = {
    activeSku: null,
    step: 0,
    progress: 0,
    logs: [],
    competitorPrices: null,
    recommendedPrice: null,
    draftedRequest: null
  };

  // Filters
  searchQuery = '';
  selectedCategory = 'All Categories';
  categories = ['All Categories', 'Dairy', 'Grocery', 'Beverages', 'Bakery', 'Personal Care'];

  // Auto-simulation interval reference
  autoAdvance = true;
  private autoAdvanceTimer: any;
  private sub = new Subscription();

  constructor(public simService: SimulationService) {}

  ngOnInit(): void {
    this.sub.add(
      this.simService.getProducts$().subscribe(products => {
        this.products = products;
        
        // Sync selected product reference to keep stock levels updated in details
        if (this.selectedProduct) {
          const fresh = products.find(p => p.sku === this.selectedProduct!.sku);
          if (fresh) this.selectedProduct = fresh;
        }
      })
    );

    this.sub.add(
      this.simService.getPriceDecisions$().subscribe(decisions => {
        this.priceDecisions = decisions;
      })
    );

    this.sub.add(
      this.simService.getSimulationState$().subscribe(state => {
        this.simState = state;
        
        // Handle auto-advancing logic if enabled
        if (state.activeSku && state.step > 0 && state.step < 8 && state.step !== 7) {
          this.triggerAutoAdvanceTimer();
        } else {
          this.clearAutoAdvanceTimer();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.clearAutoAdvanceTimer();
  }

  // --- Filtering ---
  getFilteredProducts(): Product[] {
    return this.products.filter(p => {
      const matchSearch = p.productName.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCategory = this.selectedCategory === 'All Categories' || p.category === this.selectedCategory;
      return matchSearch && matchCategory;
    });
  }

  // --- Product details selection ---
  selectProduct(product: Product): void {
    this.selectedProduct = product;
    // Cancel any active simulation to prevent screen overlay conflicts
    this.simService.cancelSimulation();
  }

  closeProductDetails(): void {
    this.selectedProduct = null;
  }

  getSelectedProductDecisions(): PriceDecision[] {
    if (!this.selectedProduct) return [];
    return this.priceDecisions.filter(d => d.sku === this.selectedProduct!.sku);
  }

  round(val: number): number {
    return Math.round(val);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  getSpikePercentage(product: Product): number {
    return Math.round(((product.todaySalesUnits - product.avgSales7Days) / product.avgSales7Days) * 100);
  }

  getSpikeClass(product: Product): 'normal' | 'monitor' | 'spike' | 'critical' {
    const pct = this.getSpikePercentage(product);
    if (pct >= 100) return 'critical';
    if (pct >= 50) return 'spike';
    if (pct >= 20) return 'monitor';
    return 'normal';
  }

  getSpikeLabel(product: Product): string {
    const pct = this.getSpikePercentage(product);
    const cls = this.getSpikeClass(product);
    if (cls === 'critical') return `Critical Spike (+${pct}%)`;
    if (cls === 'spike') return `Sales Spike (+${pct}%)`;
    if (cls === 'monitor') return `Monitor Closely (+${pct}%)`;
    return `Normal (+${pct}%)`;
  }

  getDaysToRunout(product: Product): number {
    if (product.todaySalesUnits === 0) return 99;
    return Math.round((product.stock / product.todaySalesUnits) * 10) / 10;
  }

  // --- Simulation Actions ---
  startSalesSimulation(sku: string): void {
    this.selectedProduct = null; // close details
    this.simService.startSimulation(sku);
  }

  advanceStep(): void {
    this.simService.advanceStep();
  }

  approvePO(): void {
    this.simService.approvePurchaseOrder();
  }

  rejectPO(): void {
    this.simService.rejectPurchaseOrder();
  }

  cancelSimulation(): void {
    this.simService.cancelSimulation();
    this.clearAutoAdvanceTimer();
  }

  getActiveProduct(): Product | null {
    if (!this.simState.activeSku) return null;
    return this.products.find(p => p.sku === this.simState.activeSku) || null;
  }

  toggleAutoAdvance(): void {
    this.autoAdvance = !this.autoAdvance;
    if (this.autoAdvance) {
      if (this.simState.activeSku && this.simState.step > 0 && this.simState.step < 8 && this.simState.step !== 7) {
        this.triggerAutoAdvanceTimer();
      }
    } else {
      this.clearAutoAdvanceTimer();
    }
  }

  private triggerAutoAdvanceTimer(): void {
    this.clearAutoAdvanceTimer();
    if (!this.autoAdvance) return;

    this.autoAdvanceTimer = setTimeout(() => {
      // Advance step if simulation is active and not on the approval step
      if (this.simState.activeSku && this.simState.step > 0 && this.simState.step < 8 && this.simState.step !== 7) {
        this.advanceStep();
      }
    }, 4000);
  }

  private clearAutoAdvanceTimer(): void {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }
}