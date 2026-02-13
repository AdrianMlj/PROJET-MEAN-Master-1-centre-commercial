import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';
import { CategorieBoutiqueService } from '../../../core/services/categorie-boutique.service';
import { CategorieBoutique } from '../../../core/models/categorie-boutique.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  date: Date = new Date(); // ← AJOUT: propriété date manquante
  stats = {
    utilisateurs: 0,
    boutiques: 0,
    produits: 0,
    revenus: 0,
    categories: 0,
    nouvellesCommandes: 0
  };

  recentCategories: CategorieBoutique[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private categorieService: CategorieBoutiqueService,
    private router: Router // ← AJOUT: router pour navigation
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
    this.loadRecentCategories();
  }

  loadStats(): void {
    // Simulation de données - À remplacer par des appels API réels
    this.stats = {
      utilisateurs: 1250,
      boutiques: 42,
      produits: 3200,
      revenus: 425000,
      categories: 15,
      nouvellesCommandes: 28
    };
  }

  loadRecentCategories(): void {
    this.loading = true;
    this.categorieService.listerToutesCategories().subscribe({
      next: (response) => {
        if (response.success && response.categories) {
          // Prendre les 5 dernières catégories
          this.recentCategories = response.categories
            .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())
            .slice(0, 5);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement catégories:', error);
        this.loading = false;
      }
    });
  }

  // ← AJOUT: méthode onDeleteCategorie manquante
  onDeleteCategorie(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.categorieService.supprimerCategorie(id).subscribe({
        next: (response) => {
          if (response.success) {
            // Recharger les catégories après suppression
            this.loadRecentCategories();
          }
        },
        error: (error) => {
          console.error('Erreur suppression:', error);
          alert(error.error?.message || 'Erreur lors de la suppression');
        }
      });
    }
  }
}