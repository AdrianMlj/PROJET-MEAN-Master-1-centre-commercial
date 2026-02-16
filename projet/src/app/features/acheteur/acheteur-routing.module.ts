import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcheteurSidebarComponent } from './components/acheteur-sidebar/acheteur-sidebar.component';
import { AcheteurDashboardComponent } from './dashboard/acheteur-dashboard.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { HomeComponent } from './home/home.component';
import { PanierComponent } from './panier/panier.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CommandesComponent } from './commandes/commandes.component';
import { CommandeDetailComponent } from './commande-detail/commande-detail.component';
import { ProfilComponent } from './profil/profil.component';

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
      { path: 'panier', component: PanierComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'commandes', component: CommandesComponent },
      { path: 'commande/:id', component: CommandeDetailComponent },
      { path: 'profil', component: ProfilComponent },
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