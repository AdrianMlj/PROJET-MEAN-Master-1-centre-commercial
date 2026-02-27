import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommandeService } from '../../../core/services/commande.service';
import { Commande, StatutCommande } from '../../../core/models/commande.model';
import { PanierService } from '../../../core/services/panier.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-commandes',
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.css'],
  standalone: false
})
export class CommandesComponent implements OnInit {
  commandes: Commande[] = [];
  commandesAffichees: Commande[] = [];
  loading = true;
  errorMessage = '';
  actionMessage = '';
  actionError = false;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalDocs = 0;
  limit = 10;

  // Filtres
  statutFiltre: StatutCommande | '' = '';
  recherche = '';
  tri: 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' = 'date_desc';
  loadingRecommande: Record<string, boolean> = {};
  statuts: { value: StatutCommande | ''; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'en_preparation', label: 'En préparation' },
    { value: 'pret', label: 'Prêt' },
    { value: 'livre', label: 'Livré' },
    { value: 'annule', label: 'Annulé' },
    { value: 'refuse', label: 'Refusé' }
  ];

  // URLs par défaut
  private readonly DEFAULT_PRODUCT_IMAGE = 'assets/placeholder-product.png';
  private readonly DEFAULT_BOUTIQUE_IMAGE = 'assets/placeholder-boutique.png';

  constructor(
    private commandeService: CommandeService,
    private panierService: PanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerCommandes();
  }

  chargerCommandes(): void {
    this.loading = true;
    const filters: any = {
      page: this.currentPage,
      limit: this.limit
    };
    
    if (this.statutFiltre) {
      filters.statut = this.statutFiltre;
    }

    this.commandeService.obtenirMesCommandes(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.commandes = response.docs;
          this.appliquerFiltresLocaux();
          this.totalPages = response.totalPages;
          this.totalDocs = response.totalDocs;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement des commandes';
        this.loading = false;
      }
    });
  }

  filtrerParStatut(): void {
    this.currentPage = 1;
    this.chargerCommandes();
  }

  onRechercheChange(): void {
    this.appliquerFiltresLocaux();
  }

  onTriChange(): void {
    this.appliquerFiltresLocaux();
  }

  resetFiltresLocaux(): void {
    this.recherche = '';
    this.tri = 'date_desc';
    this.appliquerFiltresLocaux();
  }

  voirDetails(commandeId: string): void {
    this.router.navigate(['/acheteur/commande', commandeId]);
  }

  payerCommande(commande: Commande, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/acheteur/payer', commande._id]);
  }

  voirBoutique(boutiqueId: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!boutiqueId) return;
    this.router.navigate(['/acheteur/boutique', boutiqueId]);
  }

  annulerCommande(commande: Commande, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('Voulez-vous vraiment annuler cette commande ?')) return;

    this.commandeService.annulerCommande(commande._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.afficherMessage('Commande annulee avec succes.');
          this.chargerCommandes();
        }
      },
      error: (error) => {
        this.afficherMessage(error.error?.message || 'Erreur lors de l annulation', true);
      }
    });
  }

  recommander(commande: Commande, event: Event): void {
    event.stopPropagation();
    if (this.loadingRecommande[commande._id]) return;

    const detailsValides = (commande.details || []).filter((detail) => !!detail.produit?._id);
    if (detailsValides.length === 0) {
      this.afficherMessage('Aucun produit valide a recommander.', true);
      return;
    }

    this.loadingRecommande[commande._id] = true;

    const requetes = detailsValides.map((detail) =>
      this.panierService.ajouterAuPanier({
        produitId: detail.produit._id,
        quantite: detail.quantite
      }).pipe(
        map(() => ({ success: true })),
        catchError(() => of({ success: false }))
      )
    );

    forkJoin(requetes).subscribe((results) => {
      const ok = results.filter((r) => r.success).length;
      const ko = results.length - ok;

      if (ok > 0 && ko === 0) {
        this.afficherMessage('Produits ajoutes au panier.');
      } else if (ok > 0) {
        this.afficherMessage(`${ok} produit(s) ajoute(s), ${ko} echec(s).`, true);
      } else {
        this.afficherMessage('Impossible de recommander cette commande.', true);
      }

      this.loadingRecommande[commande._id] = false;
    });
  }

  pagePrecedente(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.chargerCommandes();
    }
  }

  pageSuivante(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.chargerCommandes();
    }
  }

  getStatutClass(statut: StatutCommande): string {
    const classes: { [key: string]: string } = {
      'en_attente': 'status-pending',
      'en_preparation': 'status-preparing',
      'pret': 'status-ready',
      'livre': 'status-delivered',
      'annule': 'status-cancelled',
      'refuse': 'status-refused'
    };
    return classes[statut] || '';
  }

  getStatutLabel(statut: StatutCommande): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'en_preparation': 'En préparation',
      'pret': 'Prêt',
      'livre': 'Livré',
      'annule': 'Annulé',
      'refuse': 'Refusé'
    };
    return labels[statut] || statut;
  }

  getPaiementClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'en_attente': 'payment-pending',
      'paye': 'payment-paid',
      'rembourse': 'payment-refunded',
      'echoue': 'payment-failed'
    };
    return classes[statut] || '';
  }

  getPaiementLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'paye': 'Payé',
      'rembourse': 'Remboursé',
      'echoue': 'Échoué'
    };
    return labels[statut] || statut;
  }

  peutAnnuler(commande: Commande): boolean {
    return commande.statut === 'en_attente';
  }

  /**
   * ✅ Obtient l'URL du logo d'une boutique
   * Utilise directement l'URL Cloudinary ou l'image par défaut
   */
  getBoutiqueLogoUrl(boutique: any): string {
    if (!boutique || !boutique.logo_url) {
      return this.DEFAULT_BOUTIQUE_IMAGE;
    }
    return boutique.logo_url; // L'URL Cloudinary est déjà complète
  }

  /**
   * ✅ Obtient l'URL de l'image d'un produit
   * Utilise directement l'URL Cloudinary ou l'image par défaut
   */
  getProduitImageUrl(produit: any): string {
    if (!produit || !produit.images || produit.images.length === 0) {
      return this.DEFAULT_PRODUCT_IMAGE;
    }
    return produit.images[0].url; // L'URL Cloudinary est déjà complète
  }

  /**
   * ✅ Gestionnaire d'erreur pour les images
   */
  onImageError(event: any, type: 'produit' | 'boutique' = 'produit'): void {
    console.warn(`⚠️ Erreur chargement image ${type}, utilisation du placeholder`);
    event.target.src = type === 'produit' ? this.DEFAULT_PRODUCT_IMAGE : this.DEFAULT_BOUTIQUE_IMAGE;
  }

  // ✅ Correction: Utiliser les bonnes propriétés du modèle
  getCommandeTotal(commande: Commande): number {
    return commande.total_general || commande.total_commande || 0;
  }

  // ✅ Correction: Utiliser les bonnes propriétés pour le tri
  private appliquerFiltresLocaux(): void {
    const term = this.recherche.trim().toLowerCase();
    let list = [...this.commandes];

    if (term) {
      list = list.filter((commande) => {
        const numero = commande.numero_commande?.toLowerCase() || '';
        const boutique = commande.boutique?.nom?.toLowerCase() || '';
        return numero.includes(term) || boutique.includes(term);
      });
    }

    switch (this.tri) {
      case 'date_asc':
        list.sort((a, b) => new Date(a.date_commande).getTime() - new Date(b.date_commande).getTime());
        break;
      case 'total_desc':
        list.sort((a, b) => (b.total_general || b.total_commande || 0) - (a.total_general || a.total_commande || 0));
        break;
      case 'total_asc':
        list.sort((a, b) => (a.total_general || a.total_commande || 0) - (b.total_general || b.total_commande || 0));
        break;
      default:
        list.sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime());
        break;
    }

    this.commandesAffichees = list;
  }

  private afficherMessage(message: string, error: boolean = false): void {
    this.actionMessage = message;
    this.actionError = error;
    setTimeout(() => {
      this.actionMessage = '';
      this.actionError = false;
    }, 3000);
  }
}