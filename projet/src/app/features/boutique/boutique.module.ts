import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { BoutiqueRoutingModule } from './boutique-routing.module';
import { BoutiqueDashboardComponent } from './dashboard/boutique-dashboard.component';

@NgModule({
  declarations: [
    BoutiqueDashboardComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    BoutiqueRoutingModule
  ]
})
export class BoutiqueModule { }