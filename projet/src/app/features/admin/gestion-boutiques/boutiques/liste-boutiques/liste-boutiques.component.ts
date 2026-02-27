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
  // Données complètes
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

  // Filtres de base
  searchTerm: string = '';
  selectedCategorie: string = '';
  selectedStatut: string = '';
  selectedPaiement: string = '';

  // Filtres pour les notes
  noteMin: number | null = null;
  noteMax: number | null = null;

  // Filtres pour les dates
  dateDebut: string | null = null;
  dateFin: string | null = null;

  loading = true;
  errorMessage = '';
  successMessage = '';

  // URL de l'image par défaut pour les boutiques
  private readonly DEFAULT_BOUTIQUE_IMAGE = 'https://www.legrand.es/modules/custom/legrand_ecat/assets/img/no-image.png';

  // Options pour les filtres
  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actives' },
    { value: 'false', label: 'Inactives' }
  ];

  paiementOptions = [
    { value: '', label: 'Tous les paiements' },
    { value: 'paye', label: 'Payées' },
    { value: 'impaye', label: 'Impayées' }
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
      page: 1,
      limit: 100
    };

    this.boutiqueService.listerToutesBoutiques(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.boutiques = response.docs;
          this.stats = response.stats;
          this.applyFrontFilters();
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

  applyFrontFilters(): void {
    let filtered = [...this.boutiques];

    // 1. Filtre par recherche textuelle
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(b => 
        b.nom.toLowerCase().includes(term) ||
        (b.description && b.description.toLowerCase().includes(term)) ||
        (b.slogan && b.slogan.toLowerCase().includes(term))
      );
    }

    // 2. Filtre par catégorie
    if (this.selectedCategorie && this.selectedCategorie !== '') {
      filtered = filtered.filter(b => {
        const categorieId = typeof b.categorie === 'string' ? b.categorie : b.categorie._id;
        return categorieId === this.selectedCategorie;
      });
    }

    // 3. Filtre par statut
    if (this.selectedStatut !== '') {
      const statutValue = this.selectedStatut === 'true';
      filtered = filtered.filter(b => b.est_active === statutValue);
    }

    // 4. Filtre par paiement
    if (this.selectedPaiement !== '') {
      filtered = filtered.filter(b => b.statut_paiement === this.selectedPaiement);
    }

    // 5. Filtre par note (min/max)
    if (this.noteMin !== null) {
      filtered = filtered.filter(b => b.statistiques.note_moyenne >= (this.noteMin || 0));
    }
    if (this.noteMax !== null) {
      filtered = filtered.filter(b => b.statistiques.note_moyenne <= (this.noteMax || 5));
    }

    // 6. Filtre par date de création
    if (this.dateDebut) {
      const debut = new Date(this.dateDebut);
      debut.setHours(0, 0, 0, 0);
      filtered = filtered.filter(b => new Date(b.date_creation) >= debut);
    }
    if (this.dateFin) {
      const fin = new Date(this.dateFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => new Date(b.date_creation) <= fin);
    }

    // Pagination
    this.totalDocs = filtered.length;
    this.totalPages = Math.ceil(this.totalDocs / this.limit);
    
    const start = (this.currentPage - 1) * this.limit;
    const end = start + this.limit;
    this.filteredBoutiques = filtered.slice(start, end);
    
    this.hasPrevPage = this.currentPage > 1;
    this.hasNextPage = this.currentPage < this.totalPages;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFrontFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFrontFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategorie = '';
    this.selectedStatut = '';
    this.selectedPaiement = '';
    this.noteMin = null;
    this.noteMax = null;
    this.dateDebut = null;
    this.dateFin = null;
    this.currentPage = 1;
    this.applyFrontFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFrontFilters();
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
            
            if (boutique.est_active) {
              this.stats.actives++;
              this.stats.inactives--;
            } else {
              this.stats.actives--;
              this.stats.inactives++;
            }
            
            this.applyFrontFilters();
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

  // ✅ MODIFIÉ: Méthode simplifiée pour les logos Cloudinary
  getLogoUrl(logoUrl: string | undefined): string {
    
    // Si pas de logo, retourner l'image par défaut
    if (!logoUrl || logoUrl.trim() === '') {
      return this.DEFAULT_BOUTIQUE_IMAGE;
    }
    return logoUrl;
  }

  onLogoError(event: any): void {
    event.target.src = this.DEFAULT_BOUTIQUE_IMAGE;
    event.target.classList.add('default-image');
  }

  getCategorieName(categorie: any): string {
    if (!categorie) return 'Non catégorisé';
    if (typeof categorie === 'string') return 'Catégorie';
    return categorie.nom_categorie || 'Catégorie';
  }

  getCategorieNameById(categorieId: string): string {
    const cat = this.categories.find(c => c._id === categorieId);
    return cat ? cat.nom_categorie : 'Inconnue';
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

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || 
              this.selectedCategorie || 
              this.selectedStatut || 
              this.selectedPaiement ||
              this.noteMin !== null ||
              this.noteMax !== null ||
              this.dateDebut ||
              this.dateFin);
  }
}