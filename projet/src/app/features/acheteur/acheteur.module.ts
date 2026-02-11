import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { AcheteurRoutingModule } from './acheteur-routing.module';
import { AcheteurDashboardComponent } from './dashboard/acheteur-dashboard.component';

@NgModule({
  declarations: [
    AcheteurDashboardComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AcheteurRoutingModule
  ]
})
export class AcheteurModule { }