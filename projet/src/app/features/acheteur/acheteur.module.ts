import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AcheteurRoutingModule } from './acheteur-routing.module';
import { AcheteurSidebarComponent } from './components/acheteur-sidebar/acheteur-sidebar.component';
import { AcheteurDashboardComponent } from './dashboard/acheteur-dashboard.component';
import { HomeComponent } from './home/home.component';
import { PanierComponent } from './panier/panier.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CommandesComponent } from './commandes/commandes.component';
import { CommandeDetailComponent } from './commande-detail/commande-detail.component';
import { ProfilComponent } from './profil/profil.component';
import { ProduitDetailComponent } from './produit-detail/produit-detail.component';
import { FavorisComponent } from './favoris/favoris.component';

@NgModule({
  declarations: [
    AcheteurSidebarComponent,
    AcheteurDashboardComponent,
    HomeComponent,
    PanierComponent,
    CheckoutComponent,
    CommandesComponent,
    CommandeDetailComponent,
    ProfilComponent,
    ProduitDetailComponent,
    FavorisComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AcheteurRoutingModule
  ]
})
export class AcheteurModule { }
