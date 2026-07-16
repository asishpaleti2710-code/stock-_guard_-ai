import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SimulationService } from '../../core/services/simulation.service';
import { Product } from '../../core/models/product';
import { ReorderRequest } from '../../core/models/reorder-request';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isChatOpen = false;
  messages: Array<{ sender: 'user' | 'stoksy', text: string, timestamp: Date }> = [
    {
      sender: 'stoksy',
      text: "Hi! I'm **Stoksy** 🤖, your AI Inventory Copilot. I can query real-time stock levels, check reorder statuses, and help you configure settings. Ask me something like *'Which items are low stock?'* or click a suggestion below!",
      timestamp: new Date()
    }
  ];

  products: Product[] = [];
  reorderRequests: ReorderRequest[] = [];
  private sub = new Subscription();

  constructor(
    public auth: AuthService,
    private router: Router,
    private simService: SimulationService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.simService.getProducts$().subscribe(products => {
        this.products = products;
      })
    );

    this.sub.add(
      this.simService.getReorderRequests$().subscribe(reqs => {
        this.reorderRequests = reqs;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onSignOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
  }

  sendMessage(txt: string): void {
    const cleanTxt = txt.trim();
    if (!cleanTxt) return;

    // Add user message
    this.messages.push({
      sender: 'user',
      text: cleanTxt,
      timestamp: new Date()
    });

    // Auto-scroll chat box after rendering
    setTimeout(() => this.scrollChatToBottom(), 50);

    // Stoksy analysis response
    setTimeout(() => {
      const reply = this.generateStoksyReply(cleanTxt.toLowerCase());
      this.messages.push({
        sender: 'stoksy',
        text: reply,
        timestamp: new Date()
      });
      setTimeout(() => this.scrollChatToBottom(), 50);
    }, 600);
  }

  private generateStoksyReply(input: string): string {
    // 1. Check for low stock queries
    if (input.includes('low stock') || input.includes('shortage') || input.includes('safety') || input.includes('depleted') || input.includes('out of stock')) {
      const low = this.products.filter(p => p.stock <= p.reorderThreshold);
      if (low.length === 0) {
        return "Excellent! All catalog products are currently fully stocked above their safety threshold margins.";
      }
      const list = low.map(p => `• **${p.productName}** (${p.sku}): **${p.stock} units** left (reorder threshold is ${p.reorderThreshold})`).join('\n');
      return `Here are the items running low on stock:\n\n${list}\n\nI suggest checking the **AI Restocking** tab to review or approve purchase orders!`;
    }

    // 2. Check for POs / Reorders
    if (input.includes('restock') || input.includes('purchase order') || input.includes('po ') || input.includes('reorder') || input.includes('approval')) {
      const drafts = this.reorderRequests.filter(r => r.status === 'DRAFTED');
      if (drafts.length === 0) {
        return "I checked the restocking queue. There are no pending purchase orders waiting for approval. Everything looks clear!";
      }
      const list = drafts.map(d => `• PO for **${this.getProductName(d.sku)}** (${d.sku}): **${d.quantity} units** (Supplier: ${d.supplier})`).join('\n');
      return `There are currently **${drafts.length} purchase orders** waiting for review:\n\n${list}\n\nYou can authorize them directly from the **AI Restocking** tab.`;
    }

    // 3. Check for specific product lookup
    for (const p of this.products) {
      if (input.includes(p.productName.toLowerCase()) || input.includes(p.sku.toLowerCase())) {
        const status = p.stock <= p.reorderThreshold ? '⚠️ Low Stock (Awaiting Approval)' : '✅ Stock Safe';
        const pct = Math.round(((p.todaySalesUnits - p.avgSales7Days) / p.avgSales7Days) * 100);
        const spikeLabel = pct >= 50 ? '🔥 High Demand Spike' : 'Normal Fluctuations';
        return `**Product Status Card: ${p.productName}**\n\n` +
               `• **Current Stock**: ${p.stock} Units\n` +
               `• **Safety Threshold**: ${p.reorderThreshold} Units\n` +
               `• **Price**: ₹${p.currentPrice}\n` +
               `• **Daily Sales Velocity**: ${p.todaySalesUnits} units/day (${spikeLabel})\n` +
               `• **Warehouse Source**: Warehouse B\n` +
               `• **Inventory Alert**: ${status}`;
      }
    }

    // 4. Autopilot and pricing queries
    if (input.includes('price') || input.includes('autopilot') || input.includes('pricing') || input.includes('dynamodb') || input.includes('nous')) {
      const status = this.simService.autopilotPricing ? 'ENABLED' : 'DISABLED';
      return `Pricing Autopilot is currently **${status}**.\n\nWhen you start a *Sales Spike Simulation* on the Inventory page, the LangChain4j agent will coordinate with the Nous Hermes AI model to compute real-time dynamic pricing adjustments, and save them automatically to DynamoDB.`;
    }

    // Fallback response
    return "I can help you monitor inventory statistics and restock requests. Try asking me:\n\n" +
           "• *Which items are low stock?*\n" +
           "• *Are there pending POs?*\n" +
           "• *Show Coke stock levels*\n" +
           "• *How does pricing autopilot work?*";
  }

  private getProductName(sku: string): string {
    const p = this.products.find(prod => prod.sku === sku);
    return p ? p.productName : sku;
  }

  private scrollChatToBottom(): void {
    const element = document.getElementById('stoksy-chat-messages');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}