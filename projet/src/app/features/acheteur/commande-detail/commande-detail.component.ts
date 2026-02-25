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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commandeService: CommandeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
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
}
