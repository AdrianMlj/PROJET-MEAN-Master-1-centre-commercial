import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PaiementService } from '../../../core/services/paiement.service';
import { BoutiqueService } from '../../../core/services/boutique.service';
import { Boutique } from '../../../core/models/boutique.model';

@Component({
  selector: 'app-paiement',
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.css'],
  standalone: false
})
export class PaiementComponent implements OnInit {
  paiementForm: FormGroup;
  boutique: Boutique | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private paiementService: PaiementService,
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {
    this.paiementForm = this.fb.group({
      methode_paiement: ['carte', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBoutique();
  }

  loadBoutique(): void {
    this.boutiqueService.getMaBoutique().subscribe({
      next: (response) => {
        if (response.success && response.boutique) {
          this.boutique = response.boutique;
        }
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des informations';
      }
    });
  }

  onSubmit(): void {
    if (this.paiementForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.paiementService.payerLocation(this.paiementForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Paiement effectué avec succès ! Votre boutique va être activée.';
          setTimeout(() => {
            this.router.navigate(['/boutique/dashboard']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors du paiement';
          this.loading = false;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur de connexion';
        this.loading = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/boutique/dashboard']);
  }
}