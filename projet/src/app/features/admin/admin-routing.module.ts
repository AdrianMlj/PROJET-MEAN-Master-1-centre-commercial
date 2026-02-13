import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { CreerCategorieComponent } from './gestion-boutiques/categories/creer-categorie/creer-categorie.component';
import { ListeCategoriesComponent } from './gestion-boutiques/categories/liste-categories/liste-categories.component';
import { ModifierCategorieComponent } from './gestion-boutiques/categories/modifier-categorie/modifier-categorie.component';
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
      
      // Gestion Boutiques - Catégories
      { path: 'boutiques/categories/creer', component: CreerCategorieComponent },
      { path: 'boutiques/categories/liste', component: ListeCategoriesComponent },
      { path: 'boutiques/categories/modifier/:id', component: ModifierCategorieComponent },
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }