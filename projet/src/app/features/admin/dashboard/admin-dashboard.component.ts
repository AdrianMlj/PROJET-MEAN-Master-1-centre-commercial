import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardData } from '../../../core/models/dashboard.model';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  dashboardData: DashboardData['dashboard'] | null = null;
  loading = true;
  errorMessage = '';
  currentDate: Date = new Date();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.dashboard;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement dashboard:', error);
        this.errorMessage = 'Impossible de charger les données du tableau de bord';
        this.loading = false;
      }
    });
  }

  // Méthodes pour la navigation rapide
  navigateToBoutiques(): void {
    this.router.navigate(['/admin/boutiques/boutiques/liste']);
  }

  navigateToUtilisateurs(): void {
    this.router.navigate(['/admin/utilisateurs/liste']);
  }

  navigateToCategories(): void {
    this.router.navigate(['/admin/boutiques/categories/liste']);
  }

  navigateToCreerBoutique(): void {
    this.router.navigate(['/admin/boutiques/boutiques/creer']);
  }

  navigateToCreerUtilisateur(): void {
    this.router.navigate(['/admin/utilisateurs/creer-boutique']);
  }

  // Formatage
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleLabel(role: string): string {
    switch(role) {
      case 'admin_centre': return 'Administrateur';
      case 'boutique': return 'Gérant boutique';
      case 'acheteur': return 'Acheteur';
      default: return role;
    }
  }

  getRoleIcon(role: string): string {
    switch(role) {
      case 'admin_centre': return 'fa-user-shield';
      case 'boutique': return 'fa-store';
      case 'acheteur': return 'fa-shopping-cart';
      default: return 'fa-user';
    }
  }

  getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'admin_centre': return 'role-admin';
      case 'boutique': return 'role-boutique';
      case 'acheteur': return 'role-acheteur';
      default: return '';
    }
  }

  // Pour les alertes
  getAlerteCount(): number {
    if (!this.dashboardData) return 0;
    const alertes = this.dashboardData.alertes;
    return alertes.boutiques_inactives;
  }

  getAlerteMessage(): string {
    const count = this.getAlerteCount();
    if (count === 0) return 'Aucune alerte';
    if (count === 1) return '1 alerte nécessite votre attention';
    return `${count} alertes nécessitent votre attention`;
  }
}