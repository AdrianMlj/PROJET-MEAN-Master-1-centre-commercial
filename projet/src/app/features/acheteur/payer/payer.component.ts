import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandeService } from '../../../core/services/commande.service';
import { MethodePaiement } from '../../../core/models/commande.model';

@Component({
  selector: 'app-payer',
  templateUrl: './payer.component.html',
  styleUrls: ['./payer.component.css'],
  standalone: false
})
export class PayerComponent implements OnInit {
  paiementForm: FormGroup;
  commandeId: string | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  commande: any = null;

  methodesPaiement: { value: MethodePaiement; label: string; icon: string }[] = [
    { value: 'carte_bancaire', label: 'Carte bancaire', icon: 'fa-credit-card' },
    { value: 'carte_credit', label: 'Carte de crédit', icon: 'fa-credit-card' },
    { value: 'mobile', label: 'Paiement mobile', icon: 'fa-mobile-alt' },
    { value: 'virement', label: 'Virement bancaire', icon: 'fa-university' },
    { value: 'especes', label: 'Espèces à la livraison', icon: 'fa-money-bill-wave' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private commandeService: CommandeService
  ) {
    this.paiementForm = this.formBuilder.group({
      methode_paiement: ['carte_bancaire', Validators.required]
    });
  }

  ngOnInit(): void {
    this.commandeId = this.route.snapshot.paramMap.get('id');
    if (this.commandeId) {
      this.chargerCommande();
    } else {
      this.errorMessage = 'Commande non trouvée';
      this.loading = false;
    }
  }

  chargerCommande(): void {
    if (!this.commandeId) return;
    
    this.loading = true;
    this.commandeService.obtenirDetailCommande(this.commandeId).subscribe({
      next: (response) => {
        if (response.success) {
          this.commande = response.commande;
          // Check if the order is ready for payment
          if (this.commande.statut !== 'pret') {
            this.errorMessage = 'Cette commande ne peut pas être payée pour le moment. Statut: ' + this.commande.statut;
          } else if (this.commande.informations_paiement?.statut !== 'en_attente') {
            this.errorMessage = 'Cette commande a déjà été payée.';
          }
        } else {
          this.errorMessage = 'Erreur lors du chargement de la commande';
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement de la commande';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.paiementForm.invalid || !this.commandeId) {
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const methode_paiement = this.paiementForm.value.methode_paiement;
    
    // Call the actual payment API
    this.commandeService.payerCommande(this.commandeId, methode_paiement).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Paiement de ${this.commande.total_general || this.commande.total}€ effectué avec succès par ${this.getMethodeLabel(methode_paiement)}!`;
          this.submitting = false;
          
          // Redirect to order details with invoice after success
          setTimeout(() => {
            this.router.navigate(['/acheteur/commande-detail', this.commandeId], {
              queryParams: { facture: true }
            });
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors du paiement';
          this.submitting = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du paiement';
        this.submitting = false;
      }
    });
  }

  getMethodeLabel(methode: string): string {
    const found = this.methodesPaiement.find(m => m.value === methode);
    return found ? found.label : methode;
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

  retourCommandes(): void {
    this.router.navigate(['/acheteur/commandes']);
  }
}
