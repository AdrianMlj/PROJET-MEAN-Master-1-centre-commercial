import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';

// Components
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';

// Catégories
import { CreerCategorieComponent } from './gestion-boutiques/categories/creer-categorie/creer-categorie.component';
import { ListeCategoriesComponent } from './gestion-boutiques/categories/liste-categories/liste-categories.component';
import { ModifierCategorieComponent } from './gestion-boutiques/categories/modifier-categorie/modifier-categorie.component';

// Boutiques
import { CreerBoutiqueComponent } from './gestion-boutiques/boutiques/creer-boutique/creer-boutique.component';
import { ListeBoutiquesComponent } from './gestion-boutiques/boutiques/liste-boutiques/liste-boutiques.component';
import { DetailsBoutiqueComponent } from './gestion-boutiques/boutiques/details-boutique/details-boutique.component';
import { ModifierBoutiqueComponent } from './gestion-boutiques/boutiques/modifier-boutique/modifier-boutique.component';

// ✅ NOUVEAU: Utilisateurs
import { CreerUtilisateurBoutiqueComponent } from './gestion-utilisateurs/creer-utilisateur-boutique/creer-utilisateur-boutique.component';
import { ListeUtilisateursComponent } from './gestion-utilisateurs/liste-utilisateurs/liste-utilisateurs.component';

import { StatistiquesComponent } from './statistiques/statistiques.component';
import { AdminNotificationsComponent } from './notifications/notifications.component';
import { ProfilAdminComponent } from './profil/profil-admin.component';

@NgModule({
  declarations: [
    AdminSidebarComponent,
    AdminDashboardComponent,
    CreerCategorieComponent,
    ListeCategoriesComponent,
    ModifierCategorieComponent,
    CreerBoutiqueComponent,
    ListeBoutiquesComponent,
    DetailsBoutiqueComponent,
    ModifierBoutiqueComponent,
    CreerUtilisateurBoutiqueComponent,
    ListeUtilisateursComponent,
    StatistiquesComponent,
    AdminNotificationsComponent,
    ProfilAdminComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }