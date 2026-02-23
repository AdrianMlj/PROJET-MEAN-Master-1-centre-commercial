import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from '../../../../../core/services/produit.service';
import { CategorieProduitService } from '../../../../../core/services/categorie-produit.service';
import { Produit, ProduitImage } from '../../../../../core/models/produit.model';
import { CategorieProduit } from '../../../../../core/models/categorie-produit.model';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-modifier-produit',
  templateUrl: './modifier-produit.component.html',
  styleUrls: ['./modifier-produit.component.css'],
  standalone: false
})
export class ModifierProduitComponent implements OnInit {
  produitForm: FormGroup;
  produit: Produit | null = null;
  categories: CategorieProduit[] = [];
  loading = false;
  loadingProduit = true;
  errorMessage = '';
  successMessage = '';
  produitId: string = '';

  // Gestion des images
  existingImages: ProduitImage[] = [];
  newFiles: File[] = [];
  newPreviews: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private produitService: ProduitService,
    private categorieService: CategorieProduitService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.produitForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      prix: [null, [Validators.required, Validators.min(0)]],
      quantite_stock: [0, [Validators.required, Validators.min(0)]],
      categorie_produit: [''],
      en_promotion: [false],
      prix_promotion: [null],
      est_actif: [true]
    });
  }

  ngOnInit(): void {
    this.produitId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCategories();
    this.loadProduit();
  }

  loadCategories(): void {
    this.categorieService.listerCategories().subscribe({
      next: (response) => {
        if (response.success && response.categories) {
          this.categories = response.categories;
        }
      },
      error: (error) => console.error('Erreur chargement catégories', error)
    });
  }

  loadProduit(): void {
    this.loadingProduit = true;
    this.produitService.obtenirProduit(this.produitId).subscribe({
      next: (response) => {
        if (response.success && response.produit) {
          this.produit = response.produit;
          this.existingImages = this.produit.images || [];
          this.produitForm.patchValue({
            nom: this.produit.nom,
            description: this.produit.description,
            prix: this.produit.prix,
            quantite_stock: this.produit.quantite_stock,
            categorie_produit: typeof this.produit.categorie_produit === 'string'
              ? this.produit.categorie_produit
              : this.produit.categorie_produit?._id,
            en_promotion: this.produit.en_promotion,
            prix_promotion: this.produit.prix_promotion,
            est_actif: this.produit.est_actif
          });
        }
        this.loadingProduit = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement du produit';
        this.loadingProduit = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.newFiles.push(files[i]);
        const reader = new FileReader();
        reader.onload = (e: any) => this.newPreviews.push(e.target.result);
        reader.readAsDataURL(files[i]);
      }
    }
  }

  removeNewImage(index: number): void {
    this.newFiles.splice(index, 1);
    this.newPreviews.splice(index, 1);
  }

  removeExistingImage(imageId: string): void {
    if (confirm('Supprimer cette image ?')) {
      this.produitService.supprimerImage(this.produitId, imageId).subscribe({
        next: () => {
          this.existingImages = this.existingImages.filter(img => img._id !== imageId);
          this.successMessage = 'Image supprimée';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  setImagePrincipale(imageId: string): void {
    // Cette fonction nécessiterait une API dédiée, on laisse pour l'instant
    // On pourrait appeler un endpoint PATCH pour définir l'image principale
  }

  onSubmit(): void {
    if (this.produitForm.invalid) {
      this.markFormGroupTouched(this.produitForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.produitForm.value;
    this.produitService.modifierProduit(this.produitId, formValue).subscribe({
      next: (response) => {
        if (response.success) {
          // Si de nouvelles images sont sélectionnées, les uploader
          if (this.newFiles.length > 0) {
            this.uploadNewImages();
          } else {
            this.successMessage = '✅ Produit modifié avec succès !';
            setTimeout(() => this.router.navigate(['/boutique/produits/liste']), 2000);
            this.loading = false;
          }
        } else {
          this.errorMessage = response.message || 'Erreur lors de la modification';
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
  }

  uploadNewImages(): void {
    const formData = new FormData();
    for (let file of this.newFiles) {
      formData.append('images', file);
    }
    this.produitService.uploadImages(this.produitId, formData).subscribe({
      next: () => {
        this.successMessage = '✅ Produit et images modifiés avec succès !';
        setTimeout(() => this.router.navigate(['/boutique/produits/liste']), 2000);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de l\'upload des images, mais le produit a été modifié.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/boutique/produits/liste']), 3000);
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/boutique/produits/liste']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  getImageUrl(image: ProduitImage): string {
    if (image.url.startsWith('http')) return image.url;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${image.url}`;
  }
}