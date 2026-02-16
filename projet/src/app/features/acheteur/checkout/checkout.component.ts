import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PanierService } from '../../../core/services/panier.service';
import { CommandeService } from '../../../core/services/commande.service';
import { AuthService } from '../../../core/services/auth.service';
import { PanierTotalResponse } from '../../../core/models/panier.model';
import { MethodePaiement, ModeLivraison } from '../../../core/models/commande.model';

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
    private panierService: PanierService,
    private commandeService: CommandeService,
    private authService: AuthService,
    private router: Router
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
    this.chargerPanier();
    this.preremplirAdresse();
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
        this.errorMessage = error.error?.message || 'Erreur lors de la commande';
        this.submitting = false;
      }
    });
  }

  retourPanier(): void {
    this.router.navigate(['/acheteur/panier']);
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
}
