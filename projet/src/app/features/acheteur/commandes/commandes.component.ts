import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommandeService } from '../../../core/services/commande.service';
import { Commande, StatutCommande } from '../../../core/models/commande.model';

@Component({
  selector: 'app-commandes',
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.css'],
  standalone: false
})
export class CommandesComponent implements OnInit {
  commandes: Commande[] = [];
  loading = true;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalDocs = 0;
  limit = 10;

  // Filtres
  statutFiltre: StatutCommande | '' = '';
  statuts: { value: StatutCommande | ''; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'en_preparation', label: 'En préparation' },
    { value: 'pret', label: 'Prêt' },
    { value: 'livre', label: 'Livré' },
    { value: 'annule', label: 'Annulé' },
    { value: 'refuse', label: 'Refusé' }
  ];

  constructor(
    private commandeService: CommandeService,
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

  voirDetails(commandeId: string): void {
    this.router.navigate(['/acheteur/commande', commandeId]);
  }

  annulerCommande(commande: Commande, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('Voulez-vous vraiment annuler cette commande ?')) return;

    this.commandeService.annulerCommande(commande._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.chargerCommandes();
        }
      },
      error: (error) => {
        alert(error.error?.message || 'Erreur lors de l\'annulation');
      }
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
}
