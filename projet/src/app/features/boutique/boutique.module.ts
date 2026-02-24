import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { BoutiqueRoutingModule } from './boutique-routing.module';
import { BoutiqueSidebarComponent } from './components/boutique-sidebar/boutique-sidebar.component';
import { BoutiqueDashboardComponent } from './dashboard/boutique-dashboard.component';
import { CreerCategorieProduitComponent } from './gestion-produits/categories/creer-categorie-produit/creer-categorie-produit.component';
import { ListeCategoriesProduitComponent } from './gestion-produits/categories/liste-categories-produit/liste-categories-produit.component';
import { ModifierCategorieProduitComponent } from './gestion-produits/categories/modifier-categorie-produit/modifier-categorie-produit.component';
import { CreerProduitComponent } from './gestion-produits/produits/creer-produit/creer-produit.component';
import { ListeProduitsComponent } from './gestion-produits/produits/liste-produits/liste-produits.component';
import { ModifierProduitComponent } from './gestion-produits/produits/modifier-produit/modifier-produit.component';
import { PaiementComponent } from './paiement/paiement.component';
import { ListeCommandesComponent } from './commandes/liste-commandes/liste-commandes.component';
import { DetailsCommandeComponent } from './commandes/details-commande/details-commande.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { StatistiquesProduitsComponent } from './statistiques-produits/statistiques-produits.component';
import { ProfilGerantComponent } from './profil-gerant/profil-gerant.component';
import { BoutiqueGerantComponent } from './boutique-gerant/boutique-gerant.component';


@NgModule({
  declarations: [
    BoutiqueSidebarComponent,
    BoutiqueDashboardComponent,
    CreerCategorieProduitComponent,
    ListeCategoriesProduitComponent,
    ModifierCategorieProduitComponent,
    CreerProduitComponent,
    ListeProduitsComponent,
    ModifierProduitComponent,
    PaiementComponent,
    ListeCommandesComponent,
    DetailsCommandeComponent,
    NotificationsComponent,
    StatistiquesProduitsComponent,
    ProfilGerantComponent,
    BoutiqueGerantComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    BoutiqueRoutingModule
  ]
})
export class BoutiqueModule { }