import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, timer, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, takeUntil } from 'rxjs/operators';
import { CategorieBoutiqueService } from '../../../../../core/services/categorie-boutique.service';
import { CategorieBoutique } from '../../../../../core/models/categorie-boutique.model';

@Component({
  selector: 'app-modifier-categorie',
  templateUrl: './modifier-categorie.component.html',
  styleUrls: ['./modifier-categorie.component.css'],
  standalone: false
})
export class ModifierCategorieComponent implements OnInit, OnDestroy {
  categorieForm: FormGroup;
  loading = false;
  loadingCategorie = true;
  errorMessage = '';
  successMessage = '';
  categorieId: string = '';
  categorie: CategorieBoutique | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private categorieService: CategorieBoutiqueService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.categorieForm = this.formBuilder.group({
      nom_categorie: ['', {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-Z0-9\s\-'éèêëàâîïôûùç&]+$/)
        ],
        asyncValidators: [this.nomCategorieValidator()],
        updateOn: 'blur'
      }],
      description: ['', [Validators.maxLength(500)]],
      image_url: [''],
      ordre_affichage: [0],
      est_active: [true]
    });
  }

  ngOnInit(): void {
    this.categorieId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCategorie();

    // ✅ Validation en temps réel avec debounce
    this.categorieForm.get('nom_categorie')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (value && value.length >= 2) {
          this.categorieForm.get('nom_categorie')?.updateValueAndValidity({ onlySelf: false, emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Validateur asynchrone avec exclusion de l'ID actuel
  nomCategorieValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 2) {
        return of(null);
      }

      // Ne pas vérifier si le nom n'a pas changé par rapport à la valeur originale
      if (this.categorie && control.value.trim().toLowerCase() === this.categorie.nom_categorie.trim().toLowerCase()) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() => this.categorieService.verifierNomExistant(control.value, this.categorieId)),
        map(existe => existe ? { nomExiste: true } : null),
        catchError(() => of(null))
      );
    };
  }

  loadCategorie(): void {
    this.loadingCategorie = true;
    this.categorieService.obtenirCategorie(this.categorieId).subscribe({
      next: (response) => {
        if (response.success && response.categorie) {
          this.categorie = response.categorie;
          this.categorieForm.patchValue({
            nom_categorie: response.categorie.nom_categorie,
            description: response.categorie.description || '',
            image_url: response.categorie.image_url || '',
            ordre_affichage: response.categorie.ordre_affichage || 0,
            est_active: response.categorie.est_active
          });
        }
        this.loadingCategorie = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement de la catégorie';
        this.loadingCategorie = false;
        console.error('Erreur:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.categorieForm.invalid) {
      this.markFormGroupTouched(this.categorieForm);
      
      const nomControl = this.categorieForm.get('nom_categorie');
      if (nomControl?.errors?.['nomExiste']) {
        this.errorMessage = '❌ Ce nom de catégorie est déjà utilisé par une autre catégorie.';
      }
      return;
    }

    // ✅ Vérifier si des changements ont été effectués
    if (this.categorie) {
      const formValues = this.categorieForm.value;
      const noChanges = 
        formValues.nom_categorie.trim() === this.categorie.nom_categorie &&
        formValues.description === (this.categorie.description || '') &&
        formValues.image_url === (this.categorie.image_url || '') &&
        formValues.ordre_affichage === (this.categorie.ordre_affichage || 0) &&
        formValues.est_active === this.categorie.est_active;
      
      if (noChanges) {
        this.errorMessage = 'Aucune modification détectée';
        return;
      }
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.categorieService.modifierCategorie(this.categorieId, this.categorieForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '✅ Catégorie modifiée avec succès !';
          setTimeout(() => {
            this.router.navigate(['/admin/boutiques/categories/liste']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la modification';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 500 && error.error?.error?.includes('E11000 duplicate key')) {
          this.errorMessage = '❌ Ce nom de catégorie est déjà utilisé par une autre catégorie.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Données invalides. Vérifiez votre formulaire.';
        } else if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Vous n\'êtes pas autorisé à effectuer cette action.';
        } else {
          this.errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
        }
        this.loading = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/admin/boutiques/categories/liste']);
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/200x200?text=Image+non+disponible';
  }

  // ✅ Méthode pour les suggestions de nom
  suggestionNom(nom: string): void {
    this.categorieForm.patchValue({ nom_categorie: nom });
    this.categorieForm.get('nom_categorie')?.markAsTouched();
    this.categorieForm.get('nom_categorie')?.updateValueAndValidity();
  }

  // ✅ Méthode utilitaire pour afficher les erreurs de validation en temps réel
  getNomCategorieError(): string {
    const control = this.categorieForm.get('nom_categorie');
    if (!control?.touched && !control?.dirty) return '';
    
    if (control.errors?.['required']) {
      return '⚠️ Le nom de la catégorie est requis';
    }
    if (control.errors?.['minlength']) {
      return `⚠️ Minimum 2 caractères (actuel: ${control.value?.length || 0})`;
    }
    if (control.errors?.['maxlength']) {
      return '⚠️ Maximum 100 caractères';
    }
    if (control.errors?.['pattern']) {
      return '⚠️ Caractères autorisés: lettres, chiffres, espaces, tirets, apostrophes';
    }
    if (control.errors?.['nomExiste']) {
      return '❌ Ce nom est déjà utilisé par une autre catégorie.';
    }
    return '';
  }

  // ✅ Vérifier si le champ nom est en cours de validation
  get isCheckingNom(): boolean {
    const control = this.categorieForm.get('nom_categorie');
    return control?.pending || false;
  }

  // ✅ Vérifier si le bouton doit être désactivé
  get isSubmitDisabled(): boolean {
    return this.categorieForm.invalid || this.loading || this.isCheckingNom;
  }

  // ✅ Vérifier si le nom n'a pas changé
  get isNomUnchanged(): boolean {
    if (!this.categorie) return false;
    const currentNom = this.categorieForm.get('nom_categorie')?.value;
    return currentNom?.trim().toLowerCase() === this.categorie.nom_categorie.trim().toLowerCase();
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