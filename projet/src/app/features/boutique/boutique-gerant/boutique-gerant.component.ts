import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../core/services/boutique.service';
import { CategorieBoutiqueService } from '../../../core/services/categorie-boutique.service';
import { Boutique } from '../../../core/models/boutique.model';
import { CategorieBoutique } from '../../../core/models/categorie-boutique.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-boutique-gerant',
  templateUrl: './boutique-gerant.component.html',
  styleUrls: ['./boutique-gerant.component.css'],
  standalone: false
})
export class BoutiqueGerantComponent implements OnInit {
  boutiqueForm: FormGroup;
  boutique: Boutique | null = null;
  categories: CategorieBoutique[] = [];
  loading = true;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  // Logo
  logoFile: File | null = null;
  logoPreview: string | null = null;
  logoUploading = false;

  // Images de la galerie
  galleryImages: string[] = [];
  newImages: File[] = [];
  newPreviews: string[] = [];
  imagesUploading = false;

  // Lightbox
  showLightbox = false;
  lightboxImages: string[] = [];
  currentLightboxIndex = 0;

  constructor(
    private fb: FormBuilder,
    private boutiqueService: BoutiqueService,
    private categorieService: CategorieBoutiqueService,
    private router: Router
  ) {
    this.boutiqueForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      slogan: [''],
      categorie: ['', Validators.required],
      contact: this.fb.group({
        email: ['', [Validators.email]],
        telephone: [''],
        horaires: ['']
      }),
      parametres: this.fb.group({
        frais_livraison: [0, [Validators.min(0)]],
        delai_preparation: [30, [Validators.min(0)]],
        livraison_gratuite_apres: [50, [Validators.min(0)]],
        accepte_retrait: [true],
        accepte_livraison: [true]
      }),
      social: this.fb.group({
        website: [''],
        facebook: [''],
        instagram: [''],
        twitter: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBoutique();
    this.loadGalleryImages();
  }

  loadCategories(): void {
    // Utilisation de la méthode publique (GET /categories-boutique)
    this.categorieService.listerCategories().subscribe({
      next: (res: any) => {
        if (res.success && res.categories) {
          this.categories = res.categories;
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  loadBoutique(): void {
    this.loading = true;
    this.boutiqueService.getMaBoutique().subscribe({
      next: (res: any) => {
        if (res.success && res.boutique) {
          this.boutique = res.boutique;
          this.patchForm(res.boutique);
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Erreur de chargement';
        this.loading = false;
      }
    });
  }

  loadGalleryImages(): void {
    this.boutiqueService.getImages().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.galleryImages = res.images || [];
        }
      },
      error: (err: any) => console.error('Erreur chargement images', err)
    });
  }

  patchForm(boutique: Boutique): void {
    // Extraire l'ID de la catégorie
    let categorieId = '';
    if (boutique.categorie) {
      if (typeof boutique.categorie === 'string') {
        categorieId = boutique.categorie;
      } else if (boutique.categorie._id) {
        categorieId = boutique.categorie._id;
      }
    }

    this.boutiqueForm.patchValue({
      nom: boutique.nom,
      description: boutique.description || '',
      slogan: boutique.slogan || '',
      categorie: categorieId,
      contact: {
        email: boutique.contact?.email || '',
        telephone: boutique.contact?.telephone || '',
        horaires: boutique.contact?.horaires || ''
      },
      parametres: {
        frais_livraison: boutique.parametres?.frais_livraison || 0,
        delai_preparation: boutique.parametres?.delai_preparation || 30,
        livraison_gratuite_apres: boutique.parametres?.livraison_gratuite_apres || 50,
        accepte_retrait: boutique.parametres?.accepte_retrait ?? true,
        accepte_livraison: boutique.parametres?.accepte_livraison ?? true
      },
      social: {
        website: boutique.social?.website || '',
        facebook: boutique.social?.facebook || '',
        instagram: boutique.social?.instagram || '',
        twitter: boutique.social?.twitter || ''
      }
    });
  }

  getLogoUrl(): string {
  // Si pas de boutique ou pas de logo, retourner l'image par défaut
  if (!this.boutique || !this.boutique.logo_url) {
    return 'https://www.legrand.es/modules/custom/legrand_ecat/assets/img/no-image.png';
  }

  return this.boutique.logo_url;
}

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.logoPreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  uploadLogo(): void {
    if (!this.logoFile) return;
    this.logoUploading = true;
    this.boutiqueService.uploadLogo(this.logoFile).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMessage = 'Logo mis à jour';
          this.loadBoutique();
          this.logoFile = null;
          this.logoPreview = null;
        } else {
          this.errorMessage = res.message || 'Erreur';
        }
        this.logoUploading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Erreur upload';
        this.logoUploading = false;
      }
    });
  }

  onImagesSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.newImages.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => this.newPreviews.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  removeNewImage(index: number): void {
    this.newImages.splice(index, 1);
    this.newPreviews.splice(index, 1);
  }

  uploadImages(): void {
    if (this.newImages.length === 0) return;
    this.imagesUploading = true;
    const formData = new FormData();
    this.newImages.forEach(file => formData.append('images', file));
    this.boutiqueService.uploadImages(formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMessage = 'Images ajoutées';
          this.newImages = [];
          this.newPreviews = [];
          this.loadGalleryImages();
        } else {
          this.errorMessage = res.message || 'Erreur';
        }
        this.imagesUploading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Erreur upload';
        this.imagesUploading = false;
      }
    });
  }

  supprimerImage(index: number): void {
    if (confirm('Supprimer cette image ?')) {
      this.boutiqueService.supprimerImage(index).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.successMessage = 'Image supprimée';
            this.loadGalleryImages();
          } else {
            this.errorMessage = res.message || 'Erreur';
          }
        },
        error: (err: any) => {
          this.errorMessage = 'Erreur suppression';
        }
      });
    }
  }

  // Lightbox methods
  openLightbox(images: string[], startIndex: number): void {
    this.lightboxImages = images;
    this.currentLightboxIndex = startIndex;
    this.showLightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.showLightbox = false;
    document.body.style.overflow = 'auto';
  }

  prevImage(): void {
    this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length;
  }

  nextImage(): void {
    this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.lightboxImages.length;
  }

  onSubmit(): void {
    if (this.boutiqueForm.invalid) return;
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.boutiqueService.modifierProfilBoutique(this.boutiqueForm.value).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMessage = 'Boutique mise à jour';
          this.loadBoutique();
        } else {
          this.errorMessage = res.message || 'Erreur';
        }
        this.submitting = false;
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Erreur de connexion';
        this.submitting = false;
      }
    });
  }

  retour(): void {
    this.router.navigate(['/boutique/dashboard']);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'https://via.placeholder.com/150';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  }
}