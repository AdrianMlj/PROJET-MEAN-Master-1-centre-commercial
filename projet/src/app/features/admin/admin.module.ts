import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';

// Components
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';

// Gestion Boutiques - Catégories
import { CreerCategorieComponent } from './gestion-boutiques/categories/creer-categorie/creer-categorie.component';
import { ListeCategoriesComponent } from './gestion-boutiques/categories/liste-categories/liste-categories.component';
import { ModifierCategorieComponent } from './gestion-boutiques/categories/modifier-categorie/modifier-categorie.component';

@NgModule({
  declarations: [
    AdminSidebarComponent,
    AdminDashboardComponent,
    CreerCategorieComponent,
    ListeCategoriesComponent,
    ModifierCategorieComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }