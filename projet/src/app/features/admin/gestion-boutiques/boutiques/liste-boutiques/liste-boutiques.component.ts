import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../../../core/services/boutique.service';
import { CategorieBoutiqueService } from '../../../../../core/services/categorie-boutique.service';
import { Boutique } from '../../../../../core/models/boutique.model';
import { CategorieBoutique } from '../../../../../core/models/categorie-boutique.model';
import { environment } from '../../../../../../environments/environment'; 

@Component({
  selector: 'app-liste-boutiques',
  templateUrl: './liste-boutiques.component.html',
  styleUrls: ['./liste-boutiques.component.css'],
  standalone: false
})
export class ListeBoutiquesComponent implements OnInit {
  boutiques: Boutique[] = [];
  filteredBoutiques: Boutique[] = [];
  categories: CategorieBoutique[] = [];
  
  // Statistiques
  stats = {
    total: 0,
    actives: 0,
    inactives: 0,
    payees: 0,
    impayees: 0
  };

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
  selectedStatut: string | null = null;
  selectedPaiement: string | null = null;
  selectedTri = 'date_creation';

  loading = true;
  errorMessage = '';
  successMessage = '';

  // Options de tri
  triOptions = [
    { value: 'date_creation', label: 'Date de création' },
    { value: 'nom', label: 'Nom' },
    { value: 'statistiques.chiffre_affaires', label: 'Chiffre d\'affaires' },
    { value: 'statistiques.note_moyenne', label: 'Note moyenne' }
  ];

  constructor(
    private boutiqueService: BoutiqueService,
    private categorieService: CategorieBoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadBoutiques();
  }

  loadCategories(): void {
    this.categorieService.listerToutesCategories().subscribe({
      next: (response) => {
        if (response.success && response.categories) {
          this.categories = response.categories;
        }
      },
      error: (error) => {
        console.error('Erreur chargement catégories:', error);
      }
    });
  }

  loadBoutiques(): void {
    this.loading = true;
    
    const params: any = {
      page: this.currentPage,
      limit: this.limit,
      tri: this.selectedTri
    };

    if (this.searchTerm) params.recherche = this.searchTerm;
    if (this.selectedCategorie) params.categorie = this.selectedCategorie;
    if (this.selectedStatut) params.statut = this.selectedStatut;
    if (this.selectedPaiement) params.statut_paiement = this.selectedPaiement;

    this.boutiqueService.listerToutesBoutiques(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.boutiques = response.docs;
          this.filteredBoutiques = response.docs;
          this.stats = response.stats;
          
          // Pagination
          this.totalDocs = response.totalDocs;
          this.totalPages = response.totalPages;
          this.currentPage = response.page;
          this.hasPrevPage = response.hasPrevPage;
          this.hasNextPage = response.hasNextPage;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des boutiques';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadBoutiques();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onTriChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategorie = '';
    this.selectedStatut = null;
    this.selectedPaiement = null;
    this.selectedTri = 'date_creation';
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBoutiques();
  }

  onViewDetails(id: string): void {
    this.router.navigate(['/admin/boutiques/boutiques/details', id]);
  }

  onEdit(id: string): void {
    this.router.navigate(['/admin/boutiques/boutiques/modifier', id]);
  }

  onToggleStatus(boutique: Boutique): void {
    const action = boutique.est_active ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} cette boutique ?`)) {
      this.boutiqueService.toggleActivationBoutique(boutique._id).subscribe({
        next: (response) => {
          if (response.success) {
            boutique.est_active = !boutique.est_active;
            this.successMessage = `Boutique ${boutique.est_active ? 'activée' : 'désactivée'} avec succès`;
            
            // Mettre à jour les stats
            if (boutique.est_active) {
              this.stats.actives++;
              this.stats.inactives--;
            } else {
              this.stats.actives--;
              this.stats.inactives++;
            }
            
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors du changement de statut';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette boutique ?')) {
      this.boutiqueService.supprimerBoutique(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Boutique supprimée avec succès';
            this.loadBoutiques();
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

  // ✅ CORRIGÉ: Construire l'URL complète du logo
  getLogoUrl(logoUrl: string | undefined): string {
    if (!logoUrl) return 'https://via.placeholder.com/150';
    
    // Si l'URL commence déjà par http, la garder telle quelle
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // Sinon, ajouter l'URL de base du backend
    // Enlever le /api de l'apiUrl pour avoir la racine
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${logoUrl}`;
  }

  onLogoError(event: any): void {
    event.target.src = 'https://via.placeholder.com/150';
  }

  getCategorieName(categorie: any): string {
    if (!categorie) return 'Non catégorisé';
    return typeof categorie === 'string' ? 'Catégorie' : (categorie.nom_categorie || 'Catégorie');
  }

  getGerantName(gerant: any): string {
    if (!gerant) return 'Non assigné';
    if (typeof gerant === 'string') return 'Gérant';
    return `${gerant.prenom || ''} ${gerant.nom || ''}`.trim() || 'Gérant';
  }

  getGerantEmail(gerant: any): string {
    if (!gerant || typeof gerant === 'string') return '';
    return gerant.email || '';
  }

  getStatutPaiementClass(statut: string): string {
    return statut === 'paye' ? 'paye' : 'impaye';
  }

  getStatutPaiementIcon(statut: string): string {
    return statut === 'paye' ? 'fa-check-circle' : 'fa-exclamation-circle';
  }

  getStatutPaiementText(statut: string): string {
    return statut === 'paye' ? 'Payé' : 'Impayé';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }
}