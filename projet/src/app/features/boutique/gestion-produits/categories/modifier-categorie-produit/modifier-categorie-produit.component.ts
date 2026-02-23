import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, timer, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, takeUntil } from 'rxjs/operators';
import { CategorieProduitService } from '../../../../../core/services/categorie-produit.service';
import { CategorieProduit } from '../../../../../core/models/categorie-produit.model';

@Component({
  selector: 'app-modifier-categorie-produit',
  templateUrl: './modifier-categorie-produit.component.html',
  styleUrls: ['./modifier-categorie-produit.component.css'],
  standalone: false
})
export class ModifierCategorieProduitComponent implements OnInit, OnDestroy {
  categorieForm: FormGroup;
  loading = false;
  loadingCategorie = true;
  errorMessage = '';
  successMessage = '';
  categorieId: string = '';
  categorie: CategorieProduit | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private categorieService: CategorieProduitService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.categorieForm = this.formBuilder.group({
      nom_categorie: ['', {
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
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

  nomCategorieValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 2) return of(null);
      // Ne pas vérifier si le nom n'a pas changé
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
        this.errorMessage = '❌ Ce nom est déjà utilisé par une autre catégorie.';
      }
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.categorieService.modifierCategorie(this.categorieId, this.categorieForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '✅ Catégorie modifiée avec succès !';
          setTimeout(() => {
            this.router.navigate(['/boutique/produits/categories/liste']);
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
    this.router.navigate(['/boutique/produits/categories/liste']);
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/200x200?text=Image+non+disponible';
  }

  getNomCategorieError(): string {
    const control = this.categorieForm.get('nom_categorie');
    if (!control?.touched && !control?.dirty) return '';
    if (control.errors?.['required']) return '⚠️ Le nom est requis';
    if (control.errors?.['minlength']) return `⚠️ Minimum 2 caractères (actuel: ${control.value?.length || 0})`;
    if (control.errors?.['maxlength']) return '⚠️ Maximum 100 caractères';
    if (control.errors?.['nomExiste']) return '❌ Ce nom existe déjà';
    return '';
  }

  get isCheckingNom(): boolean {
    return this.categorieForm.get('nom_categorie')?.pending || false;
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