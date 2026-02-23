import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategorieProduitService } from '../../../../../core/services/categorie-produit.service';
import { CategorieProduit } from '../../../../../core/models/categorie-produit.model';

@Component({
  selector: 'app-liste-categories-produit',
  templateUrl: './liste-categories-produit.component.html',
  styleUrls: ['./liste-categories-produit.component.css'],
  standalone: false
})
export class ListeCategoriesProduitComponent implements OnInit {
  categories: CategorieProduit[] = [];
  filteredCategories: CategorieProduit[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Filtres
  searchTerm = '';
  filterActif: boolean | null = null;

  constructor(
    private categorieService: CategorieProduitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categorieService.listerCategories().subscribe({
      next: (response) => {
        if (response.success && response.categories) {
          this.categories = response.categories;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des catégories';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.categories];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.nom_categorie.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    }

    if (this.filterActif !== null) {
      filtered = filtered.filter(c => c.est_active === this.filterActif);
    }

    this.filteredCategories = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterStatus(status: boolean | null): void {
    this.filterActif = status;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterActif = null;
    this.applyFilters();
  }

  onEdit(id: string): void {
    this.router.navigate(['/boutique/produits/categories/modifier', id]);
  }

  onToggleStatus(categorie: CategorieProduit): void {
    this.categorieService.modifierCategorie(categorie._id, {
      est_active: !categorie.est_active
    }).subscribe({
      next: (response) => {
        if (response.success) {
          categorie.est_active = !categorie.est_active;
          this.successMessage = `Catégorie ${categorie.est_active ? 'activée' : 'désactivée'} avec succès`;
          this.applyFilters();
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du changement de statut';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.categorieService.supprimerCategorie(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Catégorie supprimée avec succès';
            this.loadCategories();
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/150';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.filterActif !== null);
  }
}