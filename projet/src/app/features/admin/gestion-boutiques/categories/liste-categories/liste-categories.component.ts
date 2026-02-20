import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategorieBoutiqueService } from '../../../../../core/services/categorie-boutique.service';
import { CategorieBoutique } from '../../../../../core/models/categorie-boutique.model';

@Component({
  selector: 'app-liste-categories',
  templateUrl: './liste-categories.component.html',
  styleUrls: ['./liste-categories.component.css'],
  standalone: false
})
export class ListeCategoriesComponent implements OnInit {
  categories: CategorieBoutique[] = [];
  filteredCategories: CategorieBoutique[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Filtres
  searchTerm = '';
  filterActif: boolean | null = null;

  // ✅ URL de l'image par défaut
  private readonly DEFAULT_IMAGE_URL = 'https://img.freepik.com/vecteurs-libre/personnes-faisant-achats-carte-credit_53876-66145.jpg';

  constructor(
    private categorieService: CategorieBoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categorieService.listerToutesCategories().subscribe({
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
    this.filteredCategories = this.categories.filter(categorie => {
      // Filtre recherche
      const matchesSearch = this.searchTerm === '' || 
        categorie.nom_categorie.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (categorie.description?.toLowerCase() || '').includes(this.searchTerm.toLowerCase());
      
      // Filtre statut
      const matchesStatus = this.filterActif === null || 
        categorie.est_active === this.filterActif;
      
      return matchesSearch && matchesStatus;
    });
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
    this.router.navigate(['/admin/boutiques/categories/modifier', id]);
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

  onToggleStatus(categorie: CategorieBoutique): void {
    this.categorieService.modifierCategorie(categorie._id, {
      est_active: !categorie.est_active
    }).subscribe({
      next: (response) => {
        if (response.success) {
          categorie.est_active = !categorie.est_active;
          this.successMessage = `Catégorie ${categorie.est_active ? 'activée' : 'désactivée'} avec succès`;
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du changement de statut';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // ✅ MODIFIÉ: Nouvelle méthode pour obtenir l'URL de l'image
  getImageUrl(categorie: CategorieBoutique): string {
    if (categorie.image_url && categorie.image_url.trim() !== '') {
      return categorie.image_url;
    }
    return this.DEFAULT_IMAGE_URL;
  }

  // ✅ MODIFIÉ: Gestion d'erreur d'image - remplace par l'image par défaut
  onImageError(event: any): void {
    // Remplacer par l'image par défaut
    event.target.src = this.DEFAULT_IMAGE_URL;
    // Optionnel: ajouter une classe pour indiquer que c'est une image par défaut
    event.target.classList.add('default-image');
  }

  // ✅ Vérifier si l'image est valide (plus nécessaire car on utilise l'URL par défaut)
  hasValidImage(categorie: CategorieBoutique): boolean {
    return true; // Toujours vrai car on a une image par défaut
  }
}