import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SimulationService } from '../../core/services/simulation.service';
import { Product } from '../../core/models/product';
import { PriceDecision } from '../../core/models/price-decision';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  priceDecisions: PriceDecision[] = [];
  alerts: string[] = [];

  // Modal state
  activeModal: 'products' | 'sales' | 'alerts' | 'pricing' | null = null;

  // KPIs
  totalProducts = 0;
  todaySales = 120000;
  lowStockCount = 0;
  priceChangesCount = 0;

  // Chart state
  salesData = [15000, 12000, 22000, 48000, 35000, 42000, 25000];
  salesTimes = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', '12 AM'];
  hoveredSalesIndex: number | null = null;
  hoveredSalesValue = 0;
  hoveredSalesTime = '';

  // Donut chart percentages
  inStockPct = 0;
  lowStockPct = 0;
  outOfStockPct = 0;

  // Top selling mock
  topSelling = [
    { name: 'Milk', units: 320, category: 'Dairy' },
    { name: 'Rice', units: 210, category: 'Grocery' },
    { name: 'Coke', units: 180, category: 'Beverages' }
  ];

  private sub = new Subscription();

  constructor(public simService: SimulationService) {}

  ngOnInit(): void {
    this.sub.add(
      this.simService.getProducts$().subscribe(products => {
        this.products = products;
        this.totalProducts = products.length;
        
        // Count stock statuses
        const low = products.filter(p => p.stock > 0 && p.stock <= p.reorderThreshold).length;
        const out = products.filter(p => p.stock === 0).length;
        const instock = products.length - low - out;

        this.lowStockCount = low + out;
        
        this.inStockPct = Math.round((instock / products.length) * 100);
        this.lowStockPct = Math.round((low / products.length) * 100);
        this.outOfStockPct = Math.round((out / products.length) * 100);

        // Adjust sales dynamically based on price updates
        this.todaySales = 120000 + (products.filter(p => p.lastUpdatedBy === 'AI').length * 4800);
      })
    );

    this.sub.add(
      this.simService.getPriceDecisions$().subscribe(decisions => {
        this.priceDecisions = decisions;
        this.priceChangesCount = decisions.length;
      })
    );

    this.sub.add(
      this.simService.getAlerts$().subscribe(alerts => {
        this.alerts = alerts;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // --- Modal control ---
  openModal(modalType: 'products' | 'sales' | 'alerts' | 'pricing'): void {
    this.activeModal = modalType;
  }

  closeModal(): void {
    this.activeModal = null;
  }

  getCategorySales(): { category: string; value: number; percentage: number; color: string }[] {
    const categories = ['Dairy', 'Grocery', 'Beverages', 'Bakery', 'Personal Care'];
    const percentages = [0.35, 0.30, 0.20, 0.10, 0.05];
    const colors = ['#3498db', '#2563eb', '#9b59b6', '#e67e22', '#e74c3c'];
    
    return categories.map((cat, idx) => ({
      category: cat,
      value: Math.round(this.todaySales * percentages[idx]),
      percentage: Math.round(percentages[idx] * 100),
      color: colors[idx]
    }));
  }

  round(val: number): number {
    return Math.round(val);
  }

  getProductNameBySku(sku: string): string {
    const product = this.products.find(p => p.sku === sku);
    return product ? product.productName : sku;
  }

  getLowStockProducts(): Product[] {
    return this.products.filter(p => p.stock <= p.reorderThreshold);
  }

  showSalesTooltip(index: number): void {
    this.hoveredSalesIndex = index;
    this.hoveredSalesValue = this.salesData[index];
    this.hoveredSalesTime = this.salesTimes[index];
  }

  hideSalesTooltip(): void {
    this.hoveredSalesIndex = null;
  }

  getConicGradient(): string {
    // Green (in stock), Yellow (low stock), Red (out of stock)
    const lowBound = this.inStockPct;
    const outBound = this.inStockPct + this.lowStockPct;
    return `conic-gradient(#2563eb 0% ${lowBound}%, #e29c36 ${lowBound}% ${outBound}%, #d94b36 ${outBound}% 100%)`;
  }
}