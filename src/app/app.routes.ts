import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { AlertsComponent } from './features/alerts/alerts.component';
import { PurchaseRequestsComponent } from './features/purchase-requests/purchase-requests.component';
import { RestockingComponent } from './features/restocking/restocking.component';
import { LoginComponent } from './features/auth/login/login.component';
import { WelcomeComponent } from './features/auth/welcome/welcome.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: WelcomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'alerts', component: AlertsComponent },
      { path: 'purchase-requests', component: PurchaseRequestsComponent },
      { path: 'restocking', component: RestockingComponent }
    ]
  }
];