import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandeService } from '../../../../core/services/commande.service';
import { Commande, UpdateStatutRequest } from '../../../../core/models/commande.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-details-commande',
  templateUrl: './details-commande.component.html',
  styleUrls: ['./details-commande.component.css'],
  standalone: false
})
export class DetailsCommandeComponent implements OnInit {
  commande: Commande | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';

  statutOptions = [
    { value: 'en_attente', label: 'En attente' },
    { value: 'en_preparation', label: 'En préparation' },
    { value: 'pret', label: 'Prêt' },
    { value: 'livre', label: 'Livré' },
    { value: 'annule', label: 'Annulé' },
    { value: 'refuse', label: 'Refusé' }
  ];

  nouveauStatut: string = '';
  raison: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commandeService: CommandeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCommande(id);
    } else {
      this.router.navigate(['/boutique/commandes/liste']);
    }
  }

  loadCommande(id: string): void {
    this.loading = true;
    this.commandeService.getCommande(id).subscribe({
      next: (response) => {
        if (response.success && response.commande) {
          this.commande = response.commande;
          this.nouveauStatut = this.commande.statut;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement de la commande';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onStatutChange(): void {
    if (!this.commande || this.nouveauStatut === this.commande.statut) return;

    const data: UpdateStatutRequest = {
      nouveau_statut: this.nouveauStatut
    };
    if (this.raison) {
      data.raison = this.raison;
    }

    this.commandeService.updateStatut(this.commande._id, data).subscribe({
      next: (response) => {
        if (response.success && response.commande) {
          this.commande = response.commande;
          this.successMessage = 'Statut mis à jour avec succès';
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Méthode pour visualiser la facture (ouvre dans un nouvel onglet)
  visualiserFacture(): void {
    if (!this.commande) return;
    this.commandeService.getFacture(this.commande._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Libérer l'objet URL après un délai pour permettre l'ouverture
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la récupération de la facture';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Méthode pour télécharger la facture (si on veut forcer le téléchargement)
  telechargerFacture(): void {
    if (!this.commande) return;
    this.commandeService.getFacture(this.commande._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${this.commande!.numero_commande}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du téléchargement de la facture';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  retourListe(): void {
    this.router.navigate(['/boutique/commandes/liste']);
  }

  // ✅ MODIFIÉ: Méthode simplifiée pour les images Cloudinary
  getImageUrl(url: string): string {
    // Si pas d'URL, retourner une image par défaut/placeholder
    if (!url) {
      return 'https://via.placeholder.com/80';
    }
    return url;
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

  // Getters sécurisés pour le client
  get clientNomComplet(): string {
    if (!this.commande || typeof this.commande.client === 'string') return '';
    return `${this.commande.client.prenom || ''} ${this.commande.client.nom || ''}`.trim();
  }

  get clientEmail(): string {
    if (!this.commande || typeof this.commande.client === 'string') return '';
    return this.commande.client.email || '';
  }

  get clientTelephone(): string {
    if (!this.commande || typeof this.commande.client === 'string') return '';
    return this.commande.client.telephone || '';
  }
}