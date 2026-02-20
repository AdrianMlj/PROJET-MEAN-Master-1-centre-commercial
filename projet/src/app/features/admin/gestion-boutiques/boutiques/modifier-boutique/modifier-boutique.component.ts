import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { BoutiqueService } from '../../../../../core/services/boutique.service';
import { CategorieBoutiqueService } from '../../../../../core/services/categorie-boutique.service';
import { UtilisateurService } from '../../../../../core/services/utilisateur.service';
import { Boutique } from '../../../../../core/models/boutique.model';
import { CategorieBoutique } from '../../../../../core/models/categorie-boutique.model';
import { Gerant } from '../../../../../core/models/utilisateur.model';

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
  
  // Pour la recherche de gérants
  gerants: Gerant[] = [];
  searchTerm = '';
  showGerantDropdown = false;
  selectedGerant: Gerant | null = null;
  loadingGerants = false;
  private searchSubject = new Subject<string>();

  loading = false;
  loadingBoutique = true;
  errorMessage = '';
  successMessage = '';
  boutiqueId: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private boutiqueService: BoutiqueService,
    private categorieService: CategorieBoutiqueService,
    private utilisateurService: UtilisateurService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.boutiqueForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: [''],
      slogan: [''],
      categorie: ['', Validators.required],
      gerant: ['', Validators.required], // ← AJOUT du champ gérant
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
    this.setupGerantSearch();
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
        }
        this.loadingGerants = false;
      },
      error: (error) => {
        console.error('Erreur recherche gérants:', error);
        this.loadingGerants = false;
      }
    });
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
    // Initialiser le gérant sélectionné
    if (boutique.gerant && typeof boutique.gerant !== 'string') {
      this.selectedGerant = boutique.gerant;
      this.searchTerm = `${boutique.gerant.prenom || ''} ${boutique.gerant.nom || ''} (${boutique.gerant.email})`.trim();
    }

    this.boutiqueForm.patchValue({
      nom: boutique.nom,
      description: boutique.description || '',
      slogan: boutique.slogan || '',
      categorie: typeof boutique.categorie === 'string' ? boutique.categorie : boutique.categorie._id,
      gerant: typeof boutique.gerant === 'string' ? boutique.gerant : boutique.gerant._id,
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

  onSearchGerant(event: any): void {
    const term = event.target.value;
    this.searchTerm = term;
    if (term.length >= 2) {
      this.searchSubject.next(term);
      this.showGerantDropdown = true;
    } else {
      this.gerants = [];
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