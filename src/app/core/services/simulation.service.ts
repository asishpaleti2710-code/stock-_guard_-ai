import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product';
import { PriceDecision } from '../models/price-decision';
import { ReorderRequest } from '../models/reorder-request';

export interface SimulationState {
  activeSku: string | null;
  step: number;
  progress: number;
  logs: string[];
  competitorPrices: { storeA: number; storeB: number; storeC: number } | null;
  recommendedPrice: number | null;
  draftedRequest: ReorderRequest | null;

  // Simulated metrics for UI overlays
  simulatedSalesRate?: number;
  salesIncreasePct?: number;
  daysToStockout?: number;
  recommendedReorderQty?: number;
  warehouseSource?: string;
  warehouseSourceStock?: number;
  alertStatus?: 'Normal' | 'Moderate' | 'Spike' | 'Critical';
  aiSummaryText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  // Autopilot configurations
  public autopilotPricing = true;
  private autopilotRestockingSubject = new BehaviorSubject<boolean>(false);
  public autopilotIntervalSec = 20;

  get autopilotRestocking$(): Observable<boolean> {
    return this.autopilotRestockingSubject.asObservable();
  }

  get autopilotRestocking(): boolean {
    return this.autopilotRestockingSubject.value;
  }

  set autopilotRestocking(val: boolean) {
    if (this.autopilotRestockingSubject.value !== val) {
      this.autopilotRestockingSubject.next(val);
      
      const status = val ? 'ENABLED' : 'DISABLED';
      const log = `[${new Date().toLocaleTimeString()}] System: AI Restocking Autopilot has been ${status}.`;
      if (this.restockingLogsSubject) {
        this.restockingLogsSubject.next([log, ...this.restockingLogsSubject.value]);
      }
    }
  }

  // In-memory data sources
  private productsSubject = new BehaviorSubject<Product[]>([
    {
      sku: 'PROD-001',
      storeId: 'STORE-101',
      productName: 'Milk',
      currentPrice: 50,
      basePrice: 40,
      stock: 40,
      reorderThreshold: 30,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Dairy',
      avgSales7Days: 40,
      todaySalesUnits: 42
    },
    {
      sku: 'PROD-002',
      storeId: 'STORE-101',
      productName: 'Rice',
      currentPrice: 80,
      basePrice: 65,
      stock: 35,
      reorderThreshold: 50,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Grocery',
      avgSales7Days: 15,
      todaySalesUnits: 14
    },
    {
      sku: 'PROD-003',
      storeId: 'STORE-101',
      productName: 'Coke',
      currentPrice: 45,
      basePrice: 35,
      stock: 200,
      reorderThreshold: 40,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Beverages',
      avgSales7Days: 25,
      todaySalesUnits: 24
    },
    {
      sku: 'PROD-004',
      storeId: 'STORE-101',
      productName: 'Bread',
      currentPrice: 30,
      basePrice: 22,
      stock: 15,
      reorderThreshold: 20,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Bakery',
      avgSales7Days: 12,
      todaySalesUnits: 11
    },
    {
      sku: 'PROD-005',
      storeId: 'STORE-101',
      productName: 'Soap',
      currentPrice: 25,
      basePrice: 18,
      stock: 120,
      reorderThreshold: 30,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Personal Care',
      avgSales7Days: 8,
      todaySalesUnits: 8
    },
    {
      sku: 'PROD-006',
      storeId: 'STORE-101',
      productName: 'Butter',
      currentPrice: 150,
      basePrice: 120,
      stock: 25,
      reorderThreshold: 30,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Dairy',
      avgSales7Days: 14,
      todaySalesUnits: 15
    },
    {
      sku: 'PROD-007',
      storeId: 'STORE-101',
      productName: 'Cheese',
      currentPrice: 200,
      basePrice: 160,
      stock: 60,
      reorderThreshold: 40,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Dairy',
      avgSales7Days: 18,
      todaySalesUnits: 17
    },
    {
      sku: 'PROD-008',
      storeId: 'STORE-101',
      productName: 'Wheat Flour',
      currentPrice: 55,
      basePrice: 40,
      stock: 110,
      reorderThreshold: 60,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Grocery',
      avgSales7Days: 22,
      todaySalesUnits: 20
    },
    {
      sku: 'PROD-009',
      storeId: 'STORE-101',
      productName: 'Sugar',
      currentPrice: 45,
      basePrice: 32,
      stock: 85,
      reorderThreshold: 40,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Grocery',
      avgSales7Days: 16,
      todaySalesUnits: 17
    },
    {
      sku: 'PROD-010',
      storeId: 'STORE-101',
      productName: 'Orange Juice',
      currentPrice: 95,
      basePrice: 70,
      stock: 15,
      reorderThreshold: 25,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Beverages',
      avgSales7Days: 12,
      todaySalesUnits: 13
    },
    {
      sku: 'PROD-011',
      storeId: 'STORE-101',
      productName: 'Green Tea',
      currentPrice: 140,
      basePrice: 110,
      stock: 75,
      reorderThreshold: 30,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Beverages',
      avgSales7Days: 10,
      todaySalesUnits: 9
    },
    {
      sku: 'PROD-012',
      storeId: 'STORE-101',
      productName: 'Chocolate Cookies',
      currentPrice: 70,
      basePrice: 50,
      stock: 45,
      reorderThreshold: 25,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Bakery',
      avgSales7Days: 15,
      todaySalesUnits: 16
    },
    {
      sku: 'PROD-013',
      storeId: 'STORE-101',
      productName: 'Croissant',
      currentPrice: 50,
      basePrice: 35,
      stock: 8,
      reorderThreshold: 15,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Bakery',
      avgSales7Days: 12,
      todaySalesUnits: 11
    },
    {
      sku: 'PROD-014',
      storeId: 'STORE-101',
      productName: 'Shampoo',
      currentPrice: 180,
      basePrice: 130,
      stock: 90,
      reorderThreshold: 30,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Personal Care',
      avgSales7Days: 8,
      todaySalesUnits: 7
    },
    {
      sku: 'PROD-015',
      storeId: 'STORE-101',
      productName: 'Toothpaste',
      currentPrice: 60,
      basePrice: 45,
      stock: 105,
      reorderThreshold: 35,
      lastPriceUpdate: new Date().toISOString(),
      lastUpdatedBy: 'MANUAL',
      category: 'Personal Care',
      avgSales7Days: 12,
      todaySalesUnits: 13
    }
  ]);

  private priceDecisionsSubject = new BehaviorSubject<PriceDecision[]>([
    {
      sku: 'PROD-001',
      storeId: 'STORE-101',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      oldPrice: 50,
      newPrice: 53,
      demandSignal: 'High Demand',
      competitorPriceRef: 'Store A: 55, Store B: 54',
      justification: 'Automated repricing due to rapid sales and competitor pricing increase.'
    },
    {
      sku: 'PROD-002',
      storeId: 'STORE-101',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      oldPrice: 80,
      newPrice: 84,
      demandSignal: 'Competitor price shift',
      competitorPriceRef: 'Store A: 85, Store B: 86',
      justification: 'Repriced to stay competitive relative to wholesale market values.'
    },
    {
      sku: 'PROD-003',
      storeId: 'STORE-101',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      oldPrice: 45,
      newPrice: 48,
      demandSignal: 'Normal Demand',
      competitorPriceRef: 'Store A: 47, Store B: 49',
      justification: 'Adjusted to optimize margin based on stable sales volume.'
    },
    {
      sku: 'PROD-004',
      storeId: 'STORE-101',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      oldPrice: 30,
      newPrice: 28,
      demandSignal: 'Low Demand',
      competitorPriceRef: 'Store A: 27, Store B: 29',
      justification: 'Promotional discount to clear bread stock before expiration.'
    },
    {
      sku: 'PROD-006',
      storeId: 'STORE-101',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      oldPrice: 150,
      newPrice: 158,
      demandSignal: 'Butter scarcity',
      competitorPriceRef: 'Store A: 160, Store B: 162',
      justification: 'Autonomous price increase due to regional supplier dairy shortage.'
    },
    {
      sku: 'PROD-010',
      storeId: 'STORE-101',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      oldPrice: 95,
      newPrice: 99,
      demandSignal: 'High Demand spikes',
      competitorPriceRef: 'Store A: 102, Store B: 105',
      justification: 'Optimized price to milk maximum margins during seasonal citrus spike.'
    },
    {
      sku: 'PROD-013',
      storeId: 'STORE-101',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      oldPrice: 50,
      newPrice: 45,
      demandSignal: 'Low sales velocity',
      competitorPriceRef: 'Store A: 46, Store B: 48',
      justification: 'Autonomous price decrease to boost stock clearance rates.'
    }
  ]);

  private reorderRequestsSubject = new BehaviorSubject<ReorderRequest[]>([]);
  
  private alertsSubject = new BehaviorSubject<string[]>([
    'Low stock warning: Bread (SKU: PROD-004) stock level is 15 (Threshold: 20)',
    'Low stock warning: Rice (SKU: PROD-002) stock level is 35 (Threshold: 50)'
  ]);

  private simStateSubject = new BehaviorSubject<SimulationState>({
    activeSku: null,
    step: 0,
    progress: 0,
    logs: [],
    competitorPrices: null,
    recommendedPrice: null,
    draftedRequest: null
  });

  public restockingLogsSubject = new BehaviorSubject<string[]>([
    `[${new Date().toLocaleTimeString()}] System: AI Restocking Autopilot Initialized.`
  ]);

  // Autopilot background worker reference
  private autopilotTimer: any;

  constructor() {
    this.startAutopilotTimer();
    this.startStockDepletionTimer();

    this.getProducts$().subscribe(products => {
      this.checkAndUpdateAutopilotState(products);
    });
  }

  // --- Observables for UI ---
  getProducts$(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  getPriceDecisions$(): Observable<PriceDecision[]> {
    return this.priceDecisionsSubject.asObservable();
  }

  getReorderRequests$(): Observable<ReorderRequest[]> {
    return this.reorderRequestsSubject.asObservable();
  }

  getAlerts$(): Observable<string[]> {
    return this.alertsSubject.asObservable();
  }

  getSimulationState$(): Observable<SimulationState> {
    return this.simStateSubject.asObservable();
  }

  clearAlerts(): void {
    this.alertsSubject.next([]);
  }

  // --- Simulation Actions ---
  startSimulation(sku: string): void {
    const products = this.productsSubject.value;
    const product = products.find(p => p.sku === sku);
    if (!product) return;

    // Simulate high sales: spike today's sales by 75% to 110% (randomized)
    const multiplier = 1.6 + Math.random() * 0.55; // 60% to 115% increase
    product.todaySalesUnits = Math.round(product.avgSales7Days * multiplier);
    this.productsSubject.next([...products]);

    this.simStateSubject.next({
      activeSku: sku,
      step: 1,
      progress: 12.5,
      logs: [
        `[${new Date().toLocaleTimeString()}] [1. Sales Stream] Starting simulation for product: ${product.productName}.`,
        `[${new Date().toLocaleTimeString()}] [1. Sales Stream] Sales stream (Kinesis) initiated...`,
        `[${new Date().toLocaleTimeString()}] [1. Sales Stream] Sales velocity spike: Current Today's Sales = ${product.todaySalesUnits} units/day (Average: ${product.avgSales7Days} units/day).`,
        `[${new Date().toLocaleTimeString()}] [1. Sales Stream] Ingestion stream receiving transactional payload...`
      ],
      competitorPrices: null,
      recommendedPrice: null,
      draftedRequest: null
    });
  }

  advanceStep(): void {
    const currentState = this.simStateSubject.value;
    if (!currentState.activeSku || currentState.step === 0 || currentState.step === 8) return;

    const nextStep = currentState.step + 1;
    const progress = Math.round((nextStep / 8) * 100);
    const product = this.productsSubject.value.find(p => p.sku === currentState.activeSku)!;
    const logs = [...currentState.logs];
    let competitorPrices = currentState.competitorPrices;
    let recommendedPrice = currentState.recommendedPrice;
    let draftedRequest = currentState.draftedRequest;

    const time = new Date().toLocaleTimeString();

    // Use current state calculation parameters (from startSimulation)
    const pct = currentState.salesIncreasePct || 300;
    const daysToStockout = currentState.daysToStockout || 2.5;
    const recReorder = currentState.recommendedReorderQty || 300;
    const warehouseSource = currentState.warehouseSource || 'Warehouse B';
    const warehouseSourceStock = currentState.warehouseSourceStock || 850;
    const alertLabel = currentState.alertStatus || 'Critical';

    switch (nextStep) {
      case 2:
        logs.push(
          `[${time}] [2. Spring Boot] Ingesting sales stream from Amazon Kinesis...`,
          `[${time}] [2. Spring Boot] Spike Detection analysis: Today's sales = ${currentState.simulatedSalesRate} units, 7-Day Average = ${product.avgSales7Days} units. Increase calculated: +${pct}%`,
          `[${time}] [2. Spring Boot] Spike Status: ${alertLabel === 'Critical' ? '🔴 CRITICAL STOCK RISK' : alertLabel === 'Spike' ? '🟠 SALES SPIKE DETECTED' : alertLabel === 'Moderate' ? '🟡 MODERATE DEMAND INCREASE' : '🟢 NORMAL DEMAND'}`,
          `[${time}] [2. Spring Boot] Fetching competitor reference prices...`
        );
        break;

      case 3:
        const base = product.basePrice;
        competitorPrices = {
          storeA: Math.round((base * 1.3 + Math.random() * 5) * 10) / 10,
          storeB: Math.round((base * 1.25 + Math.random() * 5) * 10) / 10,
          storeC: Math.round((base * 1.32 + Math.random() * 5) * 10) / 10
        };
        recommendedPrice = Math.round(((competitorPrices.storeA + competitorPrices.storeB + competitorPrices.storeC) / 3 - 1) * 10) / 10;
        
        logs.push(
          `[${time}] [3. AI Analysis] pricing models active: LangChain4j + Nous Hermes.`,
          `[${time}] [3. AI Analysis] Competitor prices: Store A: ₹${competitorPrices.storeA}, Store B: ₹${competitorPrices.storeB}, Store C: ₹${competitorPrices.storeC}`,
          `[${time}] [3. AI Analysis] Pricing optimization complete. Recommended Retail Price: ₹${recommendedPrice}.`
        );
        break;

      case 4:
        const oldPrice = product.currentPrice;
        product.currentPrice = recommendedPrice || product.currentPrice;
        product.lastPriceUpdate = new Date().toISOString();
        product.lastUpdatedBy = 'AI';

        const decision: PriceDecision = {
          sku: product.sku,
          storeId: product.storeId,
          timestamp: new Date().toISOString(),
          oldPrice,
          newPrice: product.currentPrice,
          demandSignal: `${pct}% Sales Spike`,
          competitorPriceRef: `Store A: ₹${competitorPrices?.storeA}, Store B: ₹${competitorPrices?.storeB}`,
          justification: `AI optimized pricing. Increased price to ₹${product.currentPrice} (+${pct}% simulated spike) to optimize margins.`
        };

        const updatedDecisions = [decision, ...this.priceDecisionsSubject.value];
        this.priceDecisionsSubject.next(updatedDecisions);
        this.productsSubject.next([...this.productsSubject.value]);

        logs.push(
          `[${time}] [4. Update DynamoDB] Transmitted pricing updates to Amazon DynamoDB database.`,
          `[${time}] [4. Update DynamoDB] DynamoDB price entry updated successfully: ${product.productName} updated from ₹${oldPrice} to ₹${product.currentPrice}.`
        );
        break;

      case 5:
        // Do NOT deplete stock. Keep product.stock at its original value!
        // Run alert condition check
        const isSpike = pct >= 50;
        const isLow = product.stock < product.reorderThreshold;
        
        let conditionAlertMsg = '';
        if (isSpike && isLow) {
          conditionAlertMsg = `CRITICAL INVENTORY ALERT: High Demand & Low Inventory. Immediate Restock Required for ${product.productName} (SKU: ${product.sku})!`;
        } else if (isSpike) {
          conditionAlertMsg = `Sales Spike Detected: ${product.productName} (SKU: ${product.sku}) has a +${pct}% simulated increase.`;
        } else if (isLow) {
          conditionAlertMsg = `Low Stock Alert: ${product.productName} (SKU: ${product.sku}) stock level is ${product.stock} (Threshold: ${product.reorderThreshold})`;
        }

        if (conditionAlertMsg) {
          const updatedAlerts = Array.from(new Set([conditionAlertMsg, ...this.alertsSubject.value]));
          this.alertsSubject.next(updatedAlerts);
        }

        logs.push(
          `[${time}] [5. Alert Monitoring] Running Alert Logic Engine...`,
          `[${time}] [5. Alert Monitoring] Status parameters: Stock = ${product.stock} units, threshold = ${product.reorderThreshold} units. Spiked Sales = ${currentState.simulatedSalesRate} units/day.`,
          `[${time}] [5. Alert Monitoring] Stock Depletion Prediction: Inventory will last only ${daysToStockout} days.`,
          `[${time}] [5. Alert Monitoring] Alert status triggered: ${isSpike && isLow ? 'CRITICAL INVENTORY ALERT' : isSpike ? 'SALES SPIKE DETECTED' : 'LOW STOCK ALERT'}.`
        );
        break;

      case 6:
        const quantity = recReorder;
        draftedRequest = {
          sku: product.sku,
          storeId: product.storeId,
          timestamp: new Date().toISOString(),
          quantity,
          supplier: 'ABC Distributors Ltd',
          status: 'DRAFTED',
          draftDocText: `PURCHASE ORDER CONTRACT
=======================
Order Reference: PO-${Math.floor(100000 + Math.random() * 900000)}
Date: ${new Date().toLocaleDateString()}
Buyer: StockGuard Retail (Store #101)
Supplier: ABC Distributors Ltd

We hereby place an order for the following items:
--------------------------------------------------
SKU: ${product.sku}
Product Name: ${product.productName}
Quantity: ${quantity} units
Unit Cost: ₹${Math.round(product.basePrice * 0.95)}
Estimated Order Total: ₹${Math.round(product.basePrice * 0.95 * quantity)}

Delivery Terms: DDP Store #101 Warehouse.
Transfer Recommendation: Nearest source ${warehouseSource} has ${warehouseSourceStock} units.
Prepared By: OpenClaw Autonomous Restocking Agent.
Status: READY TO SEND. Awaiting manager approval.`
        };

        logs.push(
          `[${time}] [6. OpenClaw Agent] OpenClaw Restocking Agent active.`,
          `[${time}] [6. OpenClaw Agent] Drafted Purchase Order for ${quantity} units from ABC Distributors Ltd.`,
          `[${time}] [6. OpenClaw Agent] Nearest source suggestion: Transfer from ${warehouseSource} (Available: ${warehouseSourceStock} Units).`,
          `[${time}] [6. OpenClaw Agent] PO status: READY TO SEND. Ready for approval.`
        );
        break;

      case 7:
        logs.push(
          `[${time}] [7. Manager Approval] Review the drafted purchase order in the action card.`,
          `[${time}] [7. Manager Approval] Awaiting manager reviews...`
        );
        
        if (this.autopilotRestocking) {
          setTimeout(() => {
            this.approvePurchaseOrder();
          }, 2000);
        }
        break;

      case 8:
        logs.push(
          `[${time}] [8. Order Sent] Manager approval verified.`,
          `[${time}] [8. Order Sent] Order sent successfully to supplier.`,
          `[${time}] [8. Order Sent] Purchase Order ID: PO-${Math.floor(100000 + Math.random() * 900000)}`,
          `[${time}] [8. Order Sent] Transfer requested: Transferring units from ${warehouseSource}.`
        );
        break;
    }

    this.simStateSubject.next({
      ...currentState,
      step: nextStep,
      progress,
      logs,
      competitorPrices,
      recommendedPrice,
      draftedRequest
    });
  }

  approvePurchaseOrder(): void {
    const state = this.simStateSubject.value;
    if (state.step !== 7 || !state.draftedRequest) return;

    // Transition to Sent
    const po = { ...state.draftedRequest, status: 'SENT' as const };
    const updatedPos = [po, ...this.reorderRequestsSubject.value];
    this.reorderRequestsSubject.next(updatedPos);

    // Remove the low-stock alert since PO is sent
    const filteredAlerts = this.alertsSubject.value.filter(
      a => !a.includes(state.activeSku!)
    );
    this.alertsSubject.next(filteredAlerts);

    // Simulate inventory replenishment in 10 seconds
    const sku = state.activeSku;
    setTimeout(() => {
      const products = this.productsSubject.value;
      const product = products.find(p => p.sku === sku);
      if (product) {
        product.stock += 500;
        this.productsSubject.next([...products]);
        this.alertsSubject.next(
          this.alertsSubject.value.filter(a => !a.includes(sku!))
        );
        
        // Update PO to confirmed
        const currentPos = this.reorderRequestsSubject.value;
        const targetPo = currentPos.find(p => p.sku === sku && p.status === 'SENT');
        if (targetPo) {
          targetPo.status = 'CONFIRMED';
          this.reorderRequestsSubject.next([...currentPos]);
        }
      }
    }, 15000);

    // Advance simulation to final step
    this.advanceStep();
  }

  rejectPurchaseOrder(): void {
    const state = this.simStateSubject.value;
    if (state.step !== 7) return;

    const time = new Date().toLocaleTimeString();
    const logs = [
      ...state.logs,
      `[${time}] [7. Manager Approval] Purchase Order was REJECTED by human manager. Restocking process cancelled.`
    ];

    this.simStateSubject.next({
      ...state,
      step: 0,
      activeSku: null,
      progress: 0,
      logs
    });
  }

  cancelSimulation(): void {
    this.simStateSubject.next({
      activeSku: null,
      step: 0,
      progress: 0,
      logs: [],
      competitorPrices: null,
      recommendedPrice: null,
      draftedRequest: null
    });
  }

  getRestockingLogs$(): Observable<string[]> {
    return this.restockingLogsSubject.asObservable();
  }

  // --- Background Autopilot Worker ---
  public startAutopilotTimer(): void {
    this.stopAutopilotTimer();
    this.autopilotTimer = setInterval(() => {
      if (this.autopilotPricing && !this.simStateSubject.value.activeSku) {
        this.runAutopilotPricingTick();
      }
      if (this.autopilotRestocking) {
        this.runAutopilotRestockingTick();
      }
    }, 5000);
  }

  private runAutopilotRestockingTick(): void {
    const products = this.productsSubject.value;
    const lowStockProduct = products.find(p => p.stock <= p.reorderThreshold);
    if (!lowStockProduct) return;

    // Check if there is already a PO in flight for this SKU
    const poInFlight = this.reorderRequestsSubject.value.some(r => r.sku === lowStockProduct.sku && r.status === 'SENT');
    if (poInFlight) return;

    const quantity = 500;
    const time = new Date().toLocaleTimeString();

    const logMsg = `[${time}] [AI Autopilot] Low stock alert for ${lowStockProduct.productName} (${lowStockProduct.stock}/${lowStockProduct.reorderThreshold} units). Drafting PO...`;
    this.restockingLogsSubject.next([logMsg, ...this.restockingLogsSubject.value]);

    const drafted: ReorderRequest = {
      sku: lowStockProduct.sku,
      storeId: lowStockProduct.storeId,
      timestamp: new Date().toISOString(),
      quantity,
      supplier: 'ABC Distributors Ltd',
      status: 'SENT',
      draftDocText: `AUTO RESTOCK PO: ${lowStockProduct.productName}`
    };

    this.reorderRequestsSubject.next([drafted, ...this.reorderRequestsSubject.value]);

    setTimeout(() => {
      const currentProducts = this.productsSubject.value;
      const prod = currentProducts.find(p => p.sku === lowStockProduct.sku);
      if (prod) {
        prod.stock += quantity;
        this.productsSubject.next([...currentProducts]);

        const completionMsg = `[${new Date().toLocaleTimeString()}] [AI Autopilot] Restocked ${quantity} units of ${prod.productName} successfully.`;
        this.restockingLogsSubject.next([completionMsg, ...this.restockingLogsSubject.value]);

        const pos = this.reorderRequestsSubject.value;
        const target = pos.find(p => p.sku === prod.sku && p.status === 'SENT');
        if (target) {
          target.status = 'CONFIRMED';
          this.reorderRequestsSubject.next([...pos]);
        }
        
        // Remove alert
        const filteredAlerts = this.alertsSubject.value.filter(a => !a.includes(prod.sku));
        this.alertsSubject.next(filteredAlerts);
      }
    }, 5000);
  }

  public triggerManualRestock(sku: string): void {
    const products = this.productsSubject.value;
    const product = products.find(p => p.sku === sku);
    if (!product) return;

    const quantity = 500;
    const time = new Date().toLocaleTimeString();

    const logMsg = `[${time}] [Manual Trigger] Replenishment initiated for ${product.productName} (500 units)...`;
    this.restockingLogsSubject.next([logMsg, ...this.restockingLogsSubject.value]);

    setTimeout(() => {
      const currentProducts = this.productsSubject.value;
      const prod = currentProducts.find(p => p.sku === sku);
      if (prod) {
        prod.stock += quantity;
        this.productsSubject.next([...currentProducts]);

        const completionMsg = `[${new Date().toLocaleTimeString()}] [Manual Trigger] Restocked ${quantity} units of ${prod.productName} successfully.`;
        this.restockingLogsSubject.next([completionMsg, ...this.restockingLogsSubject.value]);

        // Remove alerts
        const filteredAlerts = this.alertsSubject.value.filter(a => !a.includes(prod.sku));
        this.alertsSubject.next(filteredAlerts);
      }
    }, 3000);
  }

  public stopAutopilotTimer(): void {
    if (this.autopilotTimer) {
      clearInterval(this.autopilotTimer);
      this.autopilotTimer = null;
    }
  }

  private runAutopilotPricingTick(): void {
    const products = this.productsSubject.value;
    if (!products.length) return;

    // Pick a random product
    const randomIndex = Math.floor(Math.random() * products.length);
    const product = products[randomIndex];

    // Compute random price change (-5% to +10%)
    const pct = -0.05 + Math.random() * 0.15;
    const priceChange = Math.round(product.currentPrice * pct);
    if (priceChange === 0) return;

    const oldPrice = product.currentPrice;
    let newPrice = product.currentPrice + priceChange;
    // Keep it above base price and realistic
    newPrice = Math.max(Math.round(product.basePrice * 0.9), newPrice);
    
    if (newPrice === oldPrice) return;

    product.currentPrice = newPrice;
    product.lastPriceUpdate = new Date().toISOString();
    product.lastUpdatedBy = 'AI';

    const demandSignals = ['Competitor stores increased price', 'High local demand index', 'High sales velocity', 'Inventory optimization tick'];
    const selectedSignal = demandSignals[Math.floor(Math.random() * demandSignals.length)];

    const decision: PriceDecision = {
      sku: product.sku,
      storeId: product.storeId,
      timestamp: new Date().toISOString(),
      oldPrice,
      newPrice,
      demandSignal: selectedSignal,
      competitorPriceRef: `Store A: ₹${Math.round(newPrice * 1.02)}, Store B: ₹${Math.round(newPrice * 0.98)}`,
      justification: `Autonomous Autopilot Repricing: Adjusted ${product.productName} price to ₹${newPrice} based on ${selectedSignal.toLowerCase()}.`
    };

    this.priceDecisionsSubject.next([decision, ...this.priceDecisionsSubject.value]);
    this.productsSubject.next([...products]);
  }

  private startStockDepletionTimer(): void {
    setInterval(() => {
      const products = this.productsSubject.value;
      if (!products.length) return;

      // Select 1 to 2 random products and deplete their stock slowly
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * products.length);
        const prod = products[idx];

        // Only deplete if it is not currently in an active spike simulation
        if (this.simStateSubject.value.activeSku !== prod.sku && prod.stock > 0) {
          prod.stock = Math.max(0, prod.stock - (1 + Math.floor(Math.random() * 2)));

          // Check if threshold alert is needed
          if (prod.stock <= prod.reorderThreshold) {
            const alertMsg = `Low stock warning: ${prod.productName} (SKU: ${prod.sku}) stock level depleted to ${prod.stock} (Threshold: ${prod.reorderThreshold})`;
            if (!this.alertsSubject.value.includes(alertMsg)) {
              this.alertsSubject.next([alertMsg, ...this.alertsSubject.value]);
            }
          }
        }
      }
      this.productsSubject.next([...products]);
    }, 4000);
  }

  private checkAndUpdateAutopilotState(products: Product[]): void {
    if (!products || products.length === 0) return;

    const hasShortages = products.some(p => p.stock <= p.reorderThreshold);

    if (hasShortages) {
      if (!this.autopilotRestocking) {
        this.autopilotRestocking = true;
      }
    } else {
      if (this.autopilotRestocking) {
        this.autopilotRestocking = false;
      }
    }
  }

  public approvePOBySku(sku: string): void {
    const requests = this.reorderRequestsSubject.value;
    const po = requests.find(r => r.sku === sku && r.status === 'DRAFTED');
    if (!po) return;

    po.status = 'SENT';
    this.reorderRequestsSubject.next([...requests]);

    const products = this.productsSubject.value;
    const product = products.find(p => p.sku === sku);
    if (!product) return;

    const time = new Date().toLocaleTimeString();
    const logMsg = `[${time}] [Manager Review] PO approved & dispatched for ${product.productName}. Awaiting shipping delivery...`;
    this.restockingLogsSubject.next([logMsg, ...this.restockingLogsSubject.value]);

    setTimeout(() => {
      const currentProducts = this.productsSubject.value;
      const prod = currentProducts.find(p => p.sku === sku);
      if (prod) {
        prod.stock += po.quantity;
        this.productsSubject.next([...currentProducts]);

        const completionMsg = `[${new Date().toLocaleTimeString()}] [Delivery] Restocked ${po.quantity} units of ${prod.productName} successfully.`;
        this.restockingLogsSubject.next([completionMsg, ...this.restockingLogsSubject.value]);

        po.status = 'CONFIRMED';
        this.reorderRequestsSubject.next([...this.reorderRequestsSubject.value]);

        const filteredAlerts = this.alertsSubject.value.filter(a => !a.includes(prod.sku));
        this.alertsSubject.next(filteredAlerts);
      }
    }, 4000);
  }
}
