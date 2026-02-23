import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoutiqueSidebarComponent } from './components/boutique-sidebar/boutique-sidebar.component';
import { BoutiqueDashboardComponent } from './dashboard/boutique-dashboard.component';
import { CreerCategorieProduitComponent } from './gestion-produits/categories/creer-categorie-produit/creer-categorie-produit.component';
import { ListeCategoriesProduitComponent } from './gestion-produits/categories/liste-categories-produit/liste-categories-produit.component';
import { ModifierCategorieProduitComponent } from './gestion-produits/categories/modifier-categorie-produit/modifier-categorie-produit.component';
import { CreerProduitComponent } from './gestion-produits/produits/creer-produit/creer-produit.component';
import { ListeProduitsComponent } from './gestion-produits/produits/liste-produits/liste-produits.component';
import { ModifierProduitComponent } from './gestion-produits/produits/modifier-produit/modifier-produit.component';
import { PaiementComponent } from './paiement/paiement.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: BoutiqueSidebarComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['boutique'] },
    children: [
      { path: 'dashboard', component: BoutiqueDashboardComponent },
      // Catégories
      { path: 'produits/categories/creer', component: CreerCategorieProduitComponent },
      { path: 'produits/categories/liste', component: ListeCategoriesProduitComponent },
      { path: 'produits/categories/modifier/:id', component: ModifierCategorieProduitComponent },
      // Produits
      { path: 'produits/creer', component: CreerProduitComponent },
      { path: 'produits/liste', component: ListeProduitsComponent },
      { path: 'produits/modifier/:id', component: ModifierProduitComponent },
      // Paiement
      { path: 'paiement', component: PaiementComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BoutiqueRoutingModule { }