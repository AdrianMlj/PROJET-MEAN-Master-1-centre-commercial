import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProduitService } from '../../../../../core/services/produit.service';
import { CategorieProduitService } from '../../../../../core/services/categorie-produit.service';
import { Produit } from '../../../../../core/models/produit.model';
import { CategorieProduit } from '../../../../../core/models/categorie-produit.model';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-liste-produits',
  templateUrl: './liste-produits.component.html',
  styleUrls: ['./liste-produits.component.css'],
  standalone: false
})
export class ListeProduitsComponent implements OnInit {
  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  categories: CategorieProduit[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Pagination
  currentPage = 1;
  limit = 12;
  totalPages = 1;
  totalDocs = 0;
  hasPrevPage = false;
  hasNextPage = false;

  // Filtres
  searchTerm = '';
  selectedCategorie = '';
  filterActif: boolean | null = null;
  filterPromo: boolean | null = null;
  prixMin: number | null = null;
  prixMax: number | null = null;
  dateDebut: string | null = null;
  dateFin: string | null = null;

  // Pour le carrousel d'images
  currentImageIndex: { [produitId: string]: number } = {};

  constructor(
    private produitService: ProduitService,
    private categorieService: CategorieProduitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProduits();
  }

  loadCategories(): void {
    this.categorieService.listerCategories().subscribe({
      next: (response) => {
        if (response.success && response.categories) {
          this.categories = response.categories;
        }
      },
      error: (error) => console.error('Erreur chargement catégories', error)
    });
  }

  loadProduits(): void {
    this.loading = true;
    this.produitService.listerProduits({ page: this.currentPage, limit: this.limit }).subscribe({
      next: (response) => {
        if (response.success) {
          this.produits = response.docs;
          this.applyFilters();
          this.totalDocs = response.totalDocs;
          this.totalPages = response.totalPages;
          this.hasPrevPage = response.hasPrevPage;
          this.hasNextPage = response.hasNextPage;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.produits];

    // Filtre texte
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Filtre catégorie
    if (this.selectedCategorie) {
      filtered = filtered.filter(p => {
        const catId = typeof p.categorie_produit === 'string' ? p.categorie_produit : p.categorie_produit?._id;
        return catId === this.selectedCategorie;
      });
    }

    // Filtre actif/inactif
    if (this.filterActif !== null) {
      filtered = filtered.filter(p => p.est_actif === this.filterActif);
    }

    // Filtre promotion
    if (this.filterPromo !== null) {
      filtered = filtered.filter(p => p.en_promotion === this.filterPromo);
    }

    // Filtre prix min
    if (this.prixMin !== null) {
      filtered = filtered.filter(p => (p.prix_final ?? p.prix) >= this.prixMin!);
    }
    // Filtre prix max
    if (this.prixMax !== null) {
      filtered = filtered.filter(p => (p.prix_final ?? p.prix) <= this.prixMax!);
    }

    // Filtre date de création
    if (this.dateDebut) {
      const debut = new Date(this.dateDebut);
      debut.setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => new Date(p.date_creation) >= debut);
    }
    if (this.dateFin) {
      const fin = new Date(this.dateFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => new Date(p.date_creation) <= fin);
    }

    this.filteredProduits = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategorie = '';
    this.filterActif = null;
    this.filterPromo = null;
    this.prixMin = null;
    this.prixMax = null;
    this.dateDebut = null;
    this.dateFin = null;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProduits();
  }

  onEdit(id: string): void {
    this.router.navigate(['/boutique/produits/modifier', id]);
  }

  onToggleStatus(produit: Produit): void {
    this.produitService.toggleActivationProduit(produit._id).subscribe({
      next: (response) => {
        if (response.success) {
          produit.est_actif = !produit.est_actif;
          this.successMessage = `Produit ${produit.est_actif ? 'activé' : 'désactivé'}`;
          this.applyFilters();
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du changement de statut';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  onDelete(id: string): void {
    if (confirm('Supprimer ce produit ?')) {
      this.produitService.supprimerProduit(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Produit supprimé';
            this.loadProduits();
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

  // ✅ MODIFIÉ: Méthode simplifiée pour l'image courante du produit
  getCurrentImage(produit: Produit): string {
    // Si pas d'images, retourner un placeholder
    if (!produit.images || produit.images.length === 0) {
      return 'https://via.placeholder.com/300';
    }
    
    // Récupérer l'index courant pour ce produit (ou 0 par défaut)
    const index = this.currentImageIndex[produit._id] || 0;
    
    // ✅ Avec Cloudinary, l'URL de l'image est TOUJOURS complète
    // Exemple: "https://res.cloudinary.com/.../centre-commercial/produits/image-123456.jpg"
    const image = produit.images[index];
    
    // Retourner directement l'URL Cloudinary
    return image.url;
  }

  prevImage(produit: Produit): void {
    if (!produit.images || produit.images.length === 0) return;
    const current = this.currentImageIndex[produit._id] || 0;
    const newIndex = (current - 1 + produit.images.length) % produit.images.length;
    this.currentImageIndex[produit._id] = newIndex;
  }

  nextImage(produit: Produit): void {
    if (!produit.images || produit.images.length === 0) return;
    const current = this.currentImageIndex[produit._id] || 0;
    const newIndex = (current + 1) % produit.images.length;
    this.currentImageIndex[produit._id] = newIndex;
  }

  // Utilitaires
  getCategorieName(prod: Produit): string {
    if (!prod.categorie_produit) return 'Non catégorisé';
    if (typeof prod.categorie_produit === 'string') return 'Catégorie';
    return prod.categorie_produit.nom_categorie;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedCategorie || this.filterActif !== null || this.filterPromo !== null ||
              this.prixMin !== null || this.prixMax !== null || this.dateDebut || this.dateFin);
  }
}