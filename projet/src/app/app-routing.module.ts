import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'acheteur', 
    loadChildren: () => import('./features/acheteur/acheteur.module').then(m => m.AcheteurModule) 
  },
  { 
    path: 'boutique', 
    loadChildren: () => import('./features/boutique/boutique.module').then(m => m.BoutiqueModule) 
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) 
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'boutique',
    loadChildren: () => import('./features/boutique/boutique.module').then(m => m.BoutiqueModule)
  },
  { path: '**', redirectTo: '/auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }