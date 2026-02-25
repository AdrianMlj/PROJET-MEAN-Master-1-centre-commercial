import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, timer, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, takeUntil } from 'rxjs/operators';
import { CategorieBoutiqueService } from '../../../../../core/services/categorie-boutique.service';

@Component({
  selector: 'app-creer-categorie',
  templateUrl: './creer-categorie.component.html',
  styleUrls: ['./creer-categorie.component.css'],
  standalone: false
})
export class CreerCategorieComponent implements OnInit, OnDestroy {
  categorieForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private categorieService: CategorieBoutiqueService,
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
        updateOn: 'blur' // Validation au blur pour éviter trop de requêtes
      }],
      description: ['', [Validators.maxLength(500)]],
      image_url: [''],
      ordre_affichage: [0]
    });
  }

  ngOnInit(): void {
    // ✅ Validation en temps réel avec debounce
    this.categorieForm.get('nom_categorie')?.valueChanges
      .pipe(
        debounceTime(500), // Attend 500ms après la frappe
        distinctUntilChanged(), // Ignore si la valeur n'a pas changé
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (value && value.length >= 2) {
          // Déclenche la validation asynchrone manuellement
          this.categorieForm.get('nom_categorie')?.updateValueAndValidity({ onlySelf: false, emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Validateur asynchrone pour vérifier si le nom existe déjà
  nomCategorieValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 2) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() => this.categorieService.verifierNomExistant(control.value)),
        map(existe => existe ? { nomExiste: true } : null),
        catchError(() => of(null))
      );
    };
  }

  onSubmit(): void {
    if (this.categorieForm.invalid) {
      this.markFormGroupTouched(this.categorieForm);
      
      // Afficher un message spécifique si le nom existe déjà
      const nomControl = this.categorieForm.get('nom_categorie');
      if (nomControl?.errors?.['nomExiste']) {
        this.errorMessage = '❌ Cette catégorie existe déjà. Veuillez choisir un nom différent.';
      }
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.categorieService.creerCategorie(this.categorieForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '✅ Catégorie créée avec succès !';
          setTimeout(() => {
            this.router.navigate(['/admin/boutiques/categories/liste']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la création';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        
        // Gestion des erreurs
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 500 && error.error?.error?.includes('E11000 duplicate key')) {
          this.errorMessage = '❌ Cette catégorie existe déjà. Veuillez choisir un nom différent.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Données invalides. Vérifiez votre formulaire.';
        } else if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Vous n\'êtes pas autorisé à effectuer cette action.';
        } else if (error.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
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
      return '❌ Cette catégorie existe déjà. Veuillez choisir un nom différent.';
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

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}