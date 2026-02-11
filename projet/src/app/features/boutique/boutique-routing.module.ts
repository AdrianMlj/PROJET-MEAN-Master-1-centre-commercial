import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoutiqueDashboardComponent } from './dashboard/boutique-dashboard.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { 
    path: 'dashboard', 
    component: BoutiqueDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['boutique'] }
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiqueRoutingModule { }