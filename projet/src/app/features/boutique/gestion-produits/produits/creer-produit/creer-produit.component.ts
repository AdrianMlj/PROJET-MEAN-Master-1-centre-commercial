import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProduitService } from '../../../../../core/services/produit.service';
import { CategorieProduitService } from '../../../../../core/services/categorie-produit.service';
import { CategorieProduit } from '../../../../../core/models/categorie-produit.model';

@Component({
  selector: 'app-creer-produit',
  templateUrl: './creer-produit.component.html',
  styleUrls: ['./creer-produit.component.css'],
  standalone: false
})
export class CreerProduitComponent implements OnInit {
  produitForm: FormGroup;
  categories: CategorieProduit[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Pour l'upload d'images (à implémenter séparément)
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private produitService: ProduitService,
    private categorieService: CategorieProduitService,
    private router: Router
  ) {
    this.produitForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: [''],
      prix: [null, [Validators.required, Validators.min(0)]],
      quantite_stock: [0, [Validators.required, Validators.min(0)]],
      categorie_produit: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
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

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push(files[i]);
        const reader = new FileReader();
        reader.onload = (e: any) => this.imagePreviews.push(e.target.result);
        reader.readAsDataURL(files[i]);
      }
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  onSubmit(): void {
    if (this.produitForm.invalid) {
      this.markFormGroupTouched(this.produitForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.produitForm.value;
    // Créer d'abord le produit sans images
    this.produitService.creerProduit(formValue).subscribe({
      next: (response) => {
        if (response.success && response.produit) {
          const produitId = response.produit._id;
          // Si des images sont sélectionnées, les uploader
          if (this.selectedFiles.length > 0) {
            this.uploadImages(produitId);
          } else {
            this.successMessage = '✅ Produit créé avec succès !';
            setTimeout(() => this.router.navigate(['/boutique/produits/liste']), 2000);
            this.loading = false;
          }
        } else {
          this.errorMessage = response.message || 'Erreur lors de la création';
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
  }

  uploadImages(produitId: string): void {
    const formData = new FormData();
    for (let file of this.selectedFiles) {
      formData.append('images', file);
    }
    this.produitService.uploadImages(produitId, formData).subscribe({
      next: () => {
        this.successMessage = '✅ Produit et images créés avec succès !';
        setTimeout(() => this.router.navigate(['/boutique/produits/liste']), 2000);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de l\'upload des images, mais le produit a été créé.';
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
}