import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BoutiqueService } from '../../../../../core/services/boutique.service';
import { CategorieBoutiqueService } from '../../../../../core/services/categorie-boutique.service';
import { Boutique } from '../../../../../core/models/boutique.model';
import { CategorieBoutique } from '../../../../../core/models/categorie-boutique.model';

@Component({
  selector: 'app-modifier-boutique',
  templateUrl: './modifier-boutique.component.html',
  styleUrls: ['./modifier-boutique.component.css'],
  standalone: false
})
export class ModifierBoutiqueComponent implements OnInit {
  boutiqueForm: FormGroup;
  categories: CategorieBoutique[] = [];
  boutique: Boutique | null = null;
  loading = false;
  loadingBoutique = true;
  errorMessage = '';
  successMessage = '';
  boutiqueId: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private boutiqueService: BoutiqueService,
    private categorieService: CategorieBoutiqueService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.boutiqueForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: [''],
      slogan: [''],
      categorie: ['', Validators.required],
      contact: this.formBuilder.group({
        email: ['', [Validators.email]],
        telephone: [''],
        horaires: ['']
      }),
      adresse: this.formBuilder.group({
        etage: [''],
        numero: [''],
        aile: ['']
      }),
      parametres: this.formBuilder.group({
        frais_livraison: [0, [Validators.min(0)]],
        delai_preparation: [30, [Validators.min(0)]],
        livraison_gratuite_apres: [50, [Validators.min(0)]]
      }),
      est_active: [true]
    });
  }

  ngOnInit(): void {
    this.boutiqueId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCategories();
    this.loadBoutique();
  }

  loadCategories(): void {
    this.categorieService.listerToutesCategories().subscribe({
      next: (response) => {
        if (response.success && response.categories) {
          this.categories = response.categories;
        }
      },
      error: (error) => {
        console.error('Erreur chargement catégories:', error);
      }
    });
  }

  loadBoutique(): void {
    this.loadingBoutique = true;
    this.boutiqueService.obtenirBoutique(this.boutiqueId).subscribe({
      next: (response) => {
        if (response.success && response.boutique) {
          this.boutique = response.boutique;
          this.patchFormValues(response.boutique);
        }
        this.loadingBoutique = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement de la boutique';
        this.loadingBoutique = false;
        console.error('Erreur:', error);
      }
    });
  }

  patchFormValues(boutique: Boutique): void {
    this.boutiqueForm.patchValue({
      nom: boutique.nom,
      description: boutique.description || '',
      slogan: boutique.slogan || '',
      categorie: typeof boutique.categorie === 'string' ? boutique.categorie : boutique.categorie._id,
      contact: {
        email: boutique.contact?.email || '',
        telephone: boutique.contact?.telephone || '',
        horaires: boutique.contact?.horaires || 'Lundi - Vendredi: 9h-18h'
      },
      adresse: {
        etage: boutique.adresse?.etage || '',
        numero: boutique.adresse?.numero || '',
        aile: boutique.adresse?.aile || ''
      },
      parametres: {
        frais_livraison: boutique.parametres?.frais_livraison || 0,
        delai_preparation: boutique.parametres?.delai_preparation || 30,
        livraison_gratuite_apres: boutique.parametres?.livraison_gratuite_apres || 50
      },
      est_active: boutique.est_active
    });
  }

  onSubmit(): void {
    if (this.boutiqueForm.invalid) {
      this.markFormGroupTouched(this.boutiqueForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.boutiqueService.modifierBoutique(this.boutiqueId, this.boutiqueForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '✅ Boutique modifiée avec succès !';
          setTimeout(() => {
            this.router.navigate(['/admin/boutiques/boutiques/details', this.boutiqueId]);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la modification';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = error.error?.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/admin/boutiques/boutiques/details', this.boutiqueId]);
  }

  onLogoError(event: any): void {
    event.target.src = 'https://via.placeholder.com/150';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}