import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcheteurSidebarComponent } from './components/acheteur-sidebar/acheteur-sidebar.component';
import { AcheteurDashboardComponent } from './dashboard/acheteur-dashboard.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { HomeComponent } from './home/home.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { PanierComponent } from './panier/panier.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PayerComponent } from './payer/payer.component';
import { CommandesComponent } from './commandes/commandes.component';
import { CommandeDetailComponent } from './commande-detail/commande-detail.component';
import { ProfilComponent } from './profil/profil.component';
import { ProduitDetailComponent } from './produit-detail/produit-detail.component';
import { FavorisComponent } from './favoris/favoris.component';

const routes: Routes = [
  {
    path: '',
    component: AcheteurSidebarComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['acheteur'] },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'dashboard', component: AcheteurDashboardComponent },
      { path: 'home', component: HomeComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'panier', component: PanierComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'payer/:id', component: PayerComponent },
      { path: 'commandes', component: CommandesComponent },
      { path: 'commande/:id', component: CommandeDetailComponent },
      { path: 'produit/:id', component: ProduitDetailComponent },
      { path: 'profil', component: ProfilComponent },
      { path: 'favoris', component: FavorisComponent },
      { path: 'boutique/:id', component: HomeComponent },
      { path: 'produits', component: HomeComponent },
      { path: 'boutiques', component: HomeComponent },
      { path: 'recherche', component: HomeComponent },
      { path: 'promotions', component: HomeComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcheteurRoutingModule { }
