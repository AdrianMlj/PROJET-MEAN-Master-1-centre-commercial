import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandeService } from '../../../core/services/commande.service';
import { MethodePaiement, ModeLivraison, PayerCommandeRequest } from '../../../core/models/commande.model';
import { AuthService } from '../../../core/services/auth.service';

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

  modesLivraison: { value: ModeLivraison; label: string; description: string }[] = [
    { value: 'livraison_standard', label: 'Livraison standard', description: '3-5 jours ouvrés' },
    { value: 'livraison_express', label: 'Livraison express', description: '24-48h' },
    { value: 'retrait_boutique', label: 'Retrait en boutique', description: 'Gratuit' }
  ];

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
    private commandeService: CommandeService,
    private authService: AuthService
  ) {
    this.paiementForm = this.formBuilder.group({
      adresse_livraison: this.formBuilder.group({
        rue: ['', Validators.required],
        ville: ['', Validators.required],
        code_postal: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
        pays: ['France', Validators.required]
      }),
      mode_livraison: ['livraison_standard', Validators.required],
      methode_paiement: ['carte_bancaire', Validators.required]
      // ❌ notes supprimé
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
          if (this.commande.statut !== 'pret') {
            this.errorMessage = 'Cette commande ne peut pas être payée pour le moment. Statut: ' + this.commande.statut;
          } else if (this.commande.informations_paiement?.statut === 'paye') {
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
      this.paiementForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const formValue = this.paiementForm.value;
    const paiementData: PayerCommandeRequest = {
      adresse_livraison: formValue.adresse_livraison,
      mode_livraison: formValue.mode_livraison,
      methode_paiement: formValue.methode_paiement
      // ❌ notes non inclus
    };

    this.commandeService.payerCommande(this.commandeId, paiementData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Paiement de ${this.commande.total_general || this.commande.total}€ effectué avec succès par ${this.getMethodeLabel(formValue.methode_paiement)} !`;
          this.submitting = false;
          
          setTimeout(() => {
            this.router.navigate(['/acheteur/commande', this.commandeId], {
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

  get adresseRue() { return this.paiementForm.get('adresse_livraison.rue'); }
  get adresseVille() { return this.paiementForm.get('adresse_livraison.ville'); }
  get adresseCodePostal() { return this.paiementForm.get('adresse_livraison.code_postal'); }
}