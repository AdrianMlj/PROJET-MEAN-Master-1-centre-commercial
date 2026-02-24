import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommandeService } from '../../../../core/services/commande.service';
import { Commande } from '../../../../core/models/commande.model';

@Component({
  selector: 'app-liste-commandes',
  templateUrl: './liste-commandes.component.html',
  styleUrls: ['./liste-commandes.component.css'],
  standalone: false
})
export class ListeCommandesComponent implements OnInit {
  commandes: Commande[] = [];
  filteredCommandes: Commande[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Pagination
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  totalDocs = 0;
  hasPrevPage = false;
  hasNextPage = false;

  // Filtre par statut
  selectedStatut: string = '';

  statutOptions = [
    { value: '', label: 'Tous' },
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
    this.loadCommandes();
  }

  loadCommandes(): void {
    this.loading = true;
    this.commandeService.listerCommandes({ page: this.currentPage, limit: this.limit, statut: this.selectedStatut || undefined }).subscribe({
      next: (response) => {
        if (response.success) {
          this.commandes = response.docs;
          this.filteredCommandes = response.docs;
          this.totalDocs = response.totalDocs;
          this.totalPages = response.totalPages;
          this.hasPrevPage = response.hasPrevPage;
          this.hasNextPage = response.hasNextPage;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des commandes';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCommandes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCommandes();
  }

  voirDetails(id: string): void {
    this.router.navigate(['/boutique/commandes/details', id]);
  }

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'en_attente': 'statut-en-attente',
      'en_preparation': 'statut-en-preparation',
      'pret': 'statut-pret',
      'livre': 'statut-livre',
      'annule': 'statut-annule',
      'refuse': 'statut-refuse'
    };
    return classes[statut] || '';
  }

  getStatutLabel(statut: string): string {
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }

  // Sécuriser l'accès au client (peut être string ou objet)
  getClientInfo(client: any): { prenom: string; nom: string; email: string } | null {
    if (!client || typeof client === 'string') return null;
    return {
      prenom: client.prenom || '',
      nom: client.nom || '',
      email: client.email || ''
    };
  }
}