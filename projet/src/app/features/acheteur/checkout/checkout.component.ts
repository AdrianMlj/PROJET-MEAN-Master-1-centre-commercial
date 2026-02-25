import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PanierService } from '../../../core/services/panier.service';
import { CommandeService } from '../../../core/services/commande.service';
import { AuthService } from '../../../core/services/auth.service';
import { PanierTotalResponse } from '../../../core/models/panier.model';
import { Commande, MethodePaiement, ModeLivraison } from '../../../core/models/commande.model';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  standalone: false
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  panierTotal: PanierTotalResponse | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  commandeAPayer: Commande | null = null;
  commandePayee: Commande | null = null; // Store the paid order for invoice display

  modesLivraison: { value: ModeLivraison; label: string; description: string }[] = [
    { value: 'livraison_standard', label: 'Livraison standard', description: '3-5 jours ouvres' },
    { value: 'livraison_express', label: 'Livraison express', description: '24-48h' },
    { value: 'retrait_boutique', label: 'Retrait en boutique', description: 'Gratuit' }
  ];

  methodesPaiement: { value: MethodePaiement; label: string; icon: string }[] = [
    { value: 'carte_bancaire', label: 'Carte bancaire', icon: 'fa-credit-card' },
    { value: 'carte_credit', label: 'Carte de credit', icon: 'fa-credit-card' },
    { value: 'mobile', label: 'Paiement mobile', icon: 'fa-mobile-alt' },
    { value: 'virement', label: 'Virement bancaire', icon: 'fa-university' },
    { value: 'especes', label: 'Especes a la livraison', icon: 'fa-money-bill-wave' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private panierService: PanierService,
    private commandeService: CommandeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.checkoutForm = this.formBuilder.group({
      adresse_livraison: this.formBuilder.group({
        nom_complet: ['', [Validators.required, Validators.minLength(3)]],
        telephone: ['', [Validators.required]],
        rue: ['', [Validators.required]],
        complement: [''],
        ville: ['', [Validators.required]],
        code_postal: ['', [Validators.required]],
        pays: ['France'],
        instructions: ['']
      }),
      mode_livraison: ['livraison_standard', Validators.required],
      methode_paiement: ['carte_bancaire', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const commandeId = this.route.snapshot.queryParams['commandeId'];
    if (commandeId) {
      this.chargerCommande(commandeId);
    } else {
      this.chargerPanier();
      this.preremplirAdresse();
    }
  }

  chargerCommande(id: string): void {
    this.loading = true;
    this.commandeService.obtenirDetailCommande(id).subscribe({
      next: (response) => {
        if (response.success && response.commande) {
          this.commandeAPayer = response.commande;
          // Pre-fill the form with existing address
          if (response.commande.adresse_livraison) {
            this.checkoutForm.patchValue({
              adresse_livraison: response.commande.adresse_livraison,
              methode_paiement: response.commande.methode_paiement || 'carte_bancaire'
            });
          }
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement de la commande';
        this.loading = false;
      }
    });
  }

  chargerPanier(): void {
    this.loading = true;
    this.panierService.calculerTotal().subscribe({
      next: (response) => {
        if (response.success) {
          this.panierTotal = response;
          if (response.detail_par_boutique.length === 0) {
            this.router.navigate(['/acheteur/panier']);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement du panier';
        this.loading = false;
      }
    });
  }

  preremplirAdresse(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.checkoutForm.patchValue({
        adresse_livraison: {
          nom_complet: `${user.prenom || ''} ${user.nom}`.trim(),
          telephone: user.telephone || ''
        }
      });
    }
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    // If we have a commande to pay, use the payment endpoint
    if (this.commandeAPayer) {
      this.payerCommandeExistante();
      return;
    }

    // Otherwise, create a new order
    const commandeData = {
      adresse_livraison: this.checkoutForm.value.adresse_livraison,
      mode_livraison: this.checkoutForm.value.mode_livraison,
      methode_paiement: this.checkoutForm.value.methode_paiement,
      notes: this.checkoutForm.value.notes
    };

    this.commandeService.passerCommande(commandeData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.panierService.resetNombreArticles();
          setTimeout(() => {
            this.router.navigate(['/acheteur/commandes']);
          }, 2000);
        } else {
          this.errorMessage = response.message;
          this.submitting = false;
        }
      },
      error: (error) => {
        const etape = error?.error?.etape ? ` (etape: ${error.error.etape})` : '';
        const detail = error?.error?.error ? ` - ${error.error.error}` : '';
        this.errorMessage = (error.error?.message || 'Erreur lors de la commande') + etape + detail;
        this.submitting = false;
      }
    });
  }

  retourPanier(): void {
    this.router.navigate(['/acheteur/panier']);
  }

  payerCommandeExistante(): void {
    if (!this.commandeAPayer) return;

    const methodePaiement = this.checkoutForm.value.methode_paiement;
    
    this.commandeService.payerCommande(this.commandeAPayer._id, methodePaiement).subscribe({
      next: (response) => {
        if (response.success) {
          // Store the paid order for invoice display
          this.commandePayee = this.commandeAPayer;
          this.commandePayee!.statut_paiement = 'paye';
          this.commandePayee!.methode_paiement = methodePaiement as MethodePaiement;
          this.successMessage = 'Paiement effectue avec succes !';
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

  voirDetailsCommande(): void {
    if (this.commandePayee) {
      this.router.navigate(['/acheteur/commande-detail', this.commandePayee._id]);
    } else {
      this.router.navigate(['/acheteur/commandes']);
    }
  }

  voirFacture(): void {
    if (this.commandePayee) {
      this.router.navigate(['/acheteur/commande-detail', this.commandePayee._id], { 
        queryParams: { facture: true } 
      });
    }
  }

  allerAuxCommandes(): void {
    this.router.navigate(['/acheteur/commandes']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get adresseForm(): FormGroup {
    return this.checkoutForm.get('adresse_livraison') as FormGroup;
  }

  getMethodeLabel(methode: string): string {
    const found = this.methodesPaiement.find(m => m.value === methode);
    return found ? found.label : methode;
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'en_preparation': 'En preparation',
      'pret': 'Pret',
      'livre': 'Livre',
      'annule': 'Annule',
      'refuse': 'Refuse'
    };
    return labels[statut] || statut;
  }
}

