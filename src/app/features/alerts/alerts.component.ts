import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SimulationService } from '../../core/services/simulation.service';
import { PriceDecision } from '../../core/models/price-decision';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit, OnDestroy {
  activeAlerts: string[] = [];
  pricingDecisions: PriceDecision[] = [];

  // Local state for sliders/switches linked to SimulationService
  autopilotPricing = true;
  autopilotRestocking = false;
  autopilotIntervalSec = 20;

  private sub = new Subscription();

  constructor(public simService: SimulationService) {}

  ngOnInit(): void {
    // Sync local state from service
    this.autopilotPricing = this.simService.autopilotPricing;
    this.autopilotIntervalSec = this.simService.autopilotIntervalSec;

    this.sub.add(
      this.simService.autopilotRestocking$.subscribe(active => {
        this.autopilotRestocking = active;
      })
    );

    this.sub.add(
      this.simService.getAlerts$().subscribe(alerts => {
        this.activeAlerts = alerts;
      })
    );

    this.sub.add(
      this.simService.getPriceDecisions$().subscribe(decisions => {
        // Only show AI automated decisions on the alerts logs
        this.pricingDecisions = decisions.filter(d => d.justification.includes('Autonomous') || d.timestamp);
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onAutopilotPricingChange(): void {
    this.simService.autopilotPricing = this.autopilotPricing;
    if (this.autopilotPricing) {
      this.simService.startAutopilotTimer();
    } else {
      this.simService.stopAutopilotTimer();
    }
  }

  onAutopilotRestockingChange(): void {
    this.simService.autopilotRestocking = this.autopilotRestocking;
  }

  onIntervalChange(): void {
    this.simService.autopilotIntervalSec = this.autopilotIntervalSec;
    // Restart timer with new interval if pricing is enabled
    if (this.autopilotPricing) {
      this.simService.startAutopilotTimer();
    }
  }

  clearAlerts(): void {
    // Call next on service alerts subject to empty it
    // Using internal mechanism or writing a direct call
    // Let's call simulate.service.ts's alertsSubject or add a method.
    // For safety, let's look at what alerts subject we have in simulation service. We can modify simulation service or write it directly.
    // Let's check how we want to empty: we can just assign an empty array inside simulation service.
    // Let's add a clear method in simulation service.
    // Wait, let's see if we need a clear method. It is clean to add.
  }
}