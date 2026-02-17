import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { BoutiqueService } from '../../../../../core/services/boutique.service';
import { CategorieBoutiqueService } from '../../../../../core/services/categorie-boutique.service';
import { UtilisateurService } from '../../../../../core/services/utilisateur.service';
import { CategorieBoutique } from '../../../../../core/models/categorie-boutique.model';
import { Gerant } from '../../../../../core/models/utilisateur.model';

@Component({
  selector: 'app-creer-boutique',
  templateUrl: './creer-boutique.component.html',
  styleUrls: ['./creer-boutique.component.css'],
  standalone: false
})
export class CreerBoutiqueComponent implements OnInit {
  boutiqueForm: FormGroup;
  categories: CategorieBoutique[] = [];
  gerants: Gerant[] = [];
  filteredGerants: Gerant[] = [];
  loading = false;
  loadingGerants = false;
  errorMessage = '';
  successMessage = '';
  
  // Recherche de gérants
  searchTerm = '';
  showGerantDropdown = false;
  selectedGerant: Gerant | null = null;
  private searchSubject = new Subject<string>();

  constructor(
    private formBuilder: FormBuilder,
    private boutiqueService: BoutiqueService,
    private categorieService: CategorieBoutiqueService,
    private utilisateurService: UtilisateurService,
    private router: Router
  ) {
    this.boutiqueForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      categorie: ['', Validators.required],
      gerant: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupGerantSearch();
  }

  loadCategories(): void {
    this.categorieService.listerToutesCategories().subscribe({
      next: (response) => {
        if (response.success && response.categories) {
          this.categories = response.categories.filter(c => c.est_active);
        }
      },
      error: (error) => {
        console.error('Erreur chargement catégories:', error);
      }
    });
  }

  setupGerantSearch(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(term => {
        this.loadingGerants = true;
        return this.utilisateurService.getGerantsDisponibles({ recherche: term, limit: 10 });
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.gerants = response.gerants;
          this.filteredGerants = response.gerants;
        }
        this.loadingGerants = false;
      },
      error: (error) => {
        console.error('Erreur recherche gérants:', error);
        this.loadingGerants = false;
      }
    });
  }

  onSearchGerant(event: any): void {
    const term = event.target.value;
    this.searchTerm = term;
    if (term.length >= 2) {
      this.searchSubject.next(term);
      this.showGerantDropdown = true;
    } else {
      this.gerants = [];
      this.filteredGerants = [];
      this.showGerantDropdown = false;
    }
  }

  selectGerant(gerant: Gerant): void {
    this.selectedGerant = gerant;
    this.searchTerm = `${gerant.prenom || ''} ${gerant.nom} (${gerant.email})`.trim();
    this.boutiqueForm.patchValue({ gerant: gerant._id });
    this.showGerantDropdown = false;
  }

  clearGerant(): void {
    this.selectedGerant = null;
    this.searchTerm = '';
    this.boutiqueForm.patchValue({ gerant: '' });
    this.gerants = [];
    this.filteredGerants = [];
  }

  onSubmit(): void {
    if (this.boutiqueForm.invalid) {
      this.markFormGroupTouched(this.boutiqueForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.boutiqueService.creerBoutique(this.boutiqueForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '✅ Boutique créée avec succès !';
          setTimeout(() => {
            this.router.navigate(['/admin/boutiques/boutiques/liste']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la création';
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
    this.router.navigate(['/admin/boutiques/boutiques/liste']);
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