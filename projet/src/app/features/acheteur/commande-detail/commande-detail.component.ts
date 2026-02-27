import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandeService } from '../../../core/services/commande.service';
import { Commande, CommandeHistoriqueStatut, StatutCommande } from '../../../core/models/commande.model';

@Component({
  selector: 'app-commande-detail',
  templateUrl: './commande-detail.component.html',
  styleUrls: ['./commande-detail.component.css'],
  standalone: false
})
export class CommandeDetailComponent implements OnInit {
  commande: Commande | null = null;
  historique: CommandeHistoriqueStatut[] = [];
  loading = true;
  loadingHistorique = false;
  errorMessage = '';
  showFacture = false;

  // URLs par défaut
  private readonly DEFAULT_PRODUCT_IMAGE = 'assets/placeholder-product.png';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commandeService: CommandeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const facture = this.route.snapshot.queryParams['facture'];
    this.showFacture = facture === 'true';
    
    if (id) {
      this.chargerCommande(id);
      this.chargerHistorique(id);
    }
  }

  chargerCommande(id: string): void {
    this.loading = true;
    this.commandeService.obtenirDetailCommande(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.commande = response.commande;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement de la commande';
        this.loading = false;
      }
    });
  }

  chargerHistorique(id: string): void {
    this.loadingHistorique = true;
    this.commandeService.obtenirHistoriqueStatuts(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.historique = response.historique;
        }
        this.loadingHistorique = false;
      },
      error: () => {
        this.loadingHistorique = false;
      }
    });
  }

  annulerCommande(): void {
    if (!this.commande || !confirm('Voulez-vous vraiment annuler cette commande ?')) return;

    this.commandeService.annulerCommande(this.commande._id).subscribe({
      next: (response) => {
        if (response.success && response.commande) {
          this.commande = response.commande;
          this.chargerHistorique(response.commande._id);
        }
      },
      error: (error) => {
        alert(error.error?.message || 'Erreur lors de l\'annulation');
      }
    });
  }

  retourListe(): void {
    this.router.navigate(['/acheteur/commandes']);
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

  getModeLivraisonLabel(mode: string): string {
    const labels: { [key: string]: string } = {
      'retrait_boutique': 'Retrait en boutique',
      'livraison_standard': 'Livraison standard',
      'livraison_express': 'Livraison express'
    };
    return labels[mode] || mode;
  }

  getMethodePaiementLabel(methode: string): string {
    const labels: { [key: string]: string } = {
      'carte_credit': 'Carte de crédit',
      'carte_bancaire': 'Carte bancaire',
      'especes': 'Espèces',
      'virement': 'Virement bancaire',
      'mobile': 'Paiement mobile'
    };
    return labels[methode] || methode;
  }

  peutAnnuler(): boolean {
    return this.commande?.statut === 'en_attente';
  }

  peutPayer(): boolean {
    return this.commande?.statut === 'pret' && 
           (this.commande.informations_paiement?.statut === 'en_attente' || !this.commande.informations_paiement?.statut);
  }

  payerCommande(): void {
    if (!this.commande) return;
    this.router.navigate(['/acheteur/payer', this.commande._id]);
  }

  toggleFacture(): void {
    this.showFacture = !this.showFacture;
  }

  downloadFacture(): void {
    if (!this.commande) return;
    
    const numeroCommande = this.commande.numero_commande;
    
    this.commandeService.telechargerFacture(this.commande._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${numeroCommande}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement de la facture:', error);
        alert('Erreur lors du téléchargement de la facture');
      }
    });
  }

  getStatutIcon(statut: StatutCommande): string {
    const icons: { [key: string]: string } = {
      'en_attente': 'fa-clock',
      'en_preparation': 'fa-cog',
      'pret': 'fa-check',
      'livre': 'fa-truck',
      'annule': 'fa-times',
      'refuse': 'fa-ban'
    };
    return icons[statut] || 'fa-circle';
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
  onImageError(event: any): void {
    console.warn('⚠️ Erreur chargement image produit, utilisation du placeholder');
    event.target.src = this.DEFAULT_PRODUCT_IMAGE;
  }

  // ✅ Méthodes de calcul des totaux
  getSousTotal(): number {
    if (!this.commande) return 0;
    
    // Si les détails sont disponibles, calculer le total
    if (this.commande.details && this.commande.details.length > 0) {
      return this.commande.details.reduce((sum, detail) => {
        // Utiliser sous_total si disponible, sinon calculer
        const detailTotal = detail.sous_total || (detail.prix_unitaire * detail.quantite);
        return sum + detailTotal;
      }, 0);
    }
    
    // Sinon, utiliser total_commande
    return this.commande.total_commande || 0;
  }

  getTotalGeneral(): number {
    if (!this.commande) return 0;
    // Utiliser total_general en priorité, sinon total_commande + frais
    return this.commande.total_general || (this.getSousTotal() + (this.commande.frais_livraison || 0));
  }
}