import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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

import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminSidebarComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin_centre'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      
      // Catégories
      { path: 'boutiques/categories/creer', component: CreerCategorieComponent },
      { path: 'boutiques/categories/liste', component: ListeCategoriesComponent },
      { path: 'boutiques/categories/modifier/:id', component: ModifierCategorieComponent },
      
      // Boutiques
      { path: 'boutiques/boutiques/creer', component: CreerBoutiqueComponent },
      { path: 'boutiques/boutiques/liste', component: ListeBoutiquesComponent },
      { path: 'boutiques/boutiques/details/:id', component: DetailsBoutiqueComponent },
      { path: 'boutiques/boutiques/modifier/:id', component: ModifierBoutiqueComponent },
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }