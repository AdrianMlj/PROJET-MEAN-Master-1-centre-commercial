import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoutiqueService } from '../../../../../core/services/boutique.service';
import { Boutique } from '../../../../../core/models/boutique.model';
import { environment } from '../../../../../../environments/environment'; 

@Component({
  selector: 'app-details-boutique',
  templateUrl: './details-boutique.component.html',
  styleUrls: ['./details-boutique.component.css'],
  standalone: false
})
export class DetailsBoutiqueComponent implements OnInit {
  boutique: Boutique | null = null;
  loading = true;
  errorMessage = '';

  // ✅ URL de l'image par défaut pour les boutiques
  private readonly DEFAULT_BOUTIQUE_IMAGE = 'https://www.legrand.es/modules/custom/legrand_ecat/assets/img/no-image.png';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boutiqueService: BoutiqueService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBoutique(id);
    }
  }

  loadBoutique(id: string): void {
    this.loading = true;
    this.boutiqueService.obtenirBoutique(id).subscribe({
      next: (response) => {
        if (response.success && response.boutique) {
          this.boutique = response.boutique;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement de la boutique';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  onEdit(): void {
    if (this.boutique) {
      this.router.navigate(['/admin/boutiques/boutiques/modifier', this.boutique._id]);
    }
  }

  onBack(): void {
    this.router.navigate(['/admin/boutiques/boutiques/liste']);
  }

  onToggleStatus(): void {
    if (!this.boutique) return;
    
    const action = this.boutique.est_active ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} cette boutique ?`)) {
      this.boutiqueService.toggleActivationBoutique(this.boutique._id).subscribe({
        next: (response) => {
          if (response.success && this.boutique) {
            this.boutique.est_active = !this.boutique.est_active;
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors du changement de statut';
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  // ✅ GARDÉ: formatCurrency pour les paramètres (non sensibles)
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }

  getGerantName(): string {
    if (!this.boutique || !this.boutique.gerant) return 'Non assigné';
    if (typeof this.boutique.gerant === 'string') return 'Gérant';
    return `${this.boutique.gerant.prenom || ''} ${this.boutique.gerant.nom || ''}`.trim() || 'Gérant';
  }

  getGerantEmail(): string {
    if (!this.boutique || !this.boutique.gerant || typeof this.boutique.gerant === 'string') return '';
    return this.boutique.gerant.email || '';
  }

  getGerantTelephone(): string {
    if (!this.boutique || !this.boutique.gerant || typeof this.boutique.gerant === 'string') return '';
    return this.boutique.gerant.telephone || '';
  }

  getCategorieName(): string {
    if (!this.boutique || !this.boutique.categorie) return 'Non catégorisé';
    if (typeof this.boutique.categorie === 'string') return 'Catégorie';
    return this.boutique.categorie.nom_categorie || 'Catégorie';
  }

  getCategorieIcone(): string {
    if (!this.boutique || !this.boutique.categorie || typeof this.boutique.categorie === 'string') return '🏷️';
    return this.boutique.categorie.icone || '🏷️';
  }

  getAdresseEtage(): string {
    return this.boutique?.adresse?.etage || '';
  }

  getAdresseNumero(): string {
    return this.boutique?.adresse?.numero || '';
  }

  getAdresseAile(): string {
    return this.boutique?.adresse?.aile || '';
  }

  hasAdresse(): boolean {
    return !!(this.boutique?.adresse?.etage || this.boutique?.adresse?.numero || this.boutique?.adresse?.aile);
  }

  getContactEmail(): string {
    return this.boutique?.contact?.email || '';
  }

  getContactTelephone(): string {
    return this.boutique?.contact?.telephone || '';
  }

  getContactHoraires(): string {
    return this.boutique?.contact?.horaires || '';
  }

  hasContact(): boolean {
    return !!(this.boutique?.contact?.email || this.boutique?.contact?.telephone);
  }

  getParametresFraisLivraison(): number {
    return this.boutique?.parametres?.frais_livraison || 0;
  }

  getParametresDelaiPreparation(): number {
    return this.boutique?.parametres?.delai_preparation || 30;
  }

  getParametresLivraisonGratuiteApres(): number {
    return this.boutique?.parametres?.livraison_gratuite_apres || 50;
  }

  getParametresAccepteRetrait(): boolean {
    return this.boutique?.parametres?.accepte_retrait || false;
  }

  getParametresAccepteLivraison(): boolean {
    return this.boutique?.parametres?.accepte_livraison || false;
  }

  getStatistiquesNoteMoyenne(): number {
    return this.boutique?.statistiques?.note_moyenne || 0;
  }

  getStatistiquesNombreAvis(): number {
    return this.boutique?.statistiques?.nombre_avis || 0;
  }

  // ❌ SUPPRIMÉ: getStatistiquesCommandesTraitees, getStatistiquesProduitsVendus, getStatistiquesChiffreAffaires

  hasInformationsBancaires(): boolean {
    return !!(this.boutique?.informations_bancaires?.iban || this.boutique?.informations_bancaires?.bic);
  }

  getIban(): string {
    return this.boutique?.informations_bancaires?.iban || '';
  }

  getBic(): string {
    return this.boutique?.informations_bancaires?.bic || '';
  }

  hasSocialLinks(): boolean {
    return !!(this.boutique?.social?.website || 
              this.boutique?.social?.facebook || 
              this.boutique?.social?.instagram || 
              this.boutique?.social?.twitter);
  }

  getSocialWebsite(): string {
    return this.boutique?.social?.website || '';
  }

  getSocialFacebook(): string {
    return this.boutique?.social?.facebook || '';
  }

  getSocialInstagram(): string {
    return this.boutique?.social?.instagram || '';
  }

  getSocialTwitter(): string {
    return this.boutique?.social?.twitter || '';
  }
}