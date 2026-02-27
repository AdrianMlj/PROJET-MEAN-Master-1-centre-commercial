import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Boutique } from '../../../core/models/boutique.model';
import { Produit } from '../../../core/models/produit.model';
import { FavorisService } from '../../../core/services/favoris.service';

@Component({
  selector: 'app-favoris',
  templateUrl: './favoris.component.html',
  styleUrls: ['./favoris.component.css'],
  standalone: false
})
export class FavorisComponent implements OnInit {
  loading = true;
  errorMessage = '';
  actionMessage = '';
  actionError = false;
  produitsFavoris: Produit[] = [];
  boutiquesFavories: Boutique[] = [];
  removeLoadingProduit: Record<string, boolean> = {};
  removeLoadingBoutique: Record<string, boolean> = {};

  // URLs par défaut
  private readonly DEFAULT_PRODUCT_IMAGE = 'assets/placeholder-product.png';
  private readonly DEFAULT_BOUTIQUE_IMAGE = 'assets/placeholder-boutique.png';

  constructor(
    private favorisService: FavorisService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerFavoris();
  }

  chargerFavoris(): void {
    this.loading = true;
    this.errorMessage = '';

    this.favorisService.obtenirFavoris().subscribe({
      next: (response) => {
        this.produitsFavoris = response.produits || [];
        this.boutiquesFavories = response.boutiques || [];
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Impossible de charger vos favoris.';
        this.loading = false;
      }
    });
  }

  voirProduit(produitId: string): void {
    this.router.navigate(['/acheteur/produit', produitId]);
  }

  voirBoutique(boutiqueId: string): void {
    this.router.navigate(['/acheteur/boutique', boutiqueId]);
  }

  retirerProduit(produitId: string, event: Event): void {
    event.stopPropagation();
    if (this.removeLoadingProduit[produitId]) return;

    this.removeLoadingProduit[produitId] = true;
    this.favorisService.retirerProduit(produitId).subscribe({
      next: (response) => {
        this.produitsFavoris = this.produitsFavoris.filter((p) => p._id !== produitId);
        this.afficherMessage(response.message || 'Produit retire des favoris.');
        this.removeLoadingProduit[produitId] = false;
      },
      error: (error) => {
        this.afficherMessage(error?.error?.message || 'Erreur lors du retrait du favori.', true);
        this.removeLoadingProduit[produitId] = false;
      }
    });
  }

  retirerBoutique(boutiqueId: string, event: Event): void {
    event.stopPropagation();
    if (this.removeLoadingBoutique[boutiqueId]) return;

    this.removeLoadingBoutique[boutiqueId] = true;
    this.favorisService.retirerBoutique(boutiqueId).subscribe({
      next: (response) => {
        this.boutiquesFavories = this.boutiquesFavories.filter((b) => b._id !== boutiqueId);
        this.afficherMessage(response.message || 'Boutique retiree des favoris.');
        this.removeLoadingBoutique[boutiqueId] = false;
      },
      error: (error) => {
        this.afficherMessage(error?.error?.message || 'Erreur lors du retrait du favori.', true);
        this.removeLoadingBoutique[boutiqueId] = false;
      }
    });
  }

  getPrixAffiche(produit: Produit): number {
    return produit.en_promotion && produit.prix_promotion ? produit.prix_promotion : produit.prix;
  }

  getReduction(produit: Produit): number {
    if (!produit.en_promotion || !produit.prix_promotion) return 0;
    return Math.round((1 - produit.prix_promotion / produit.prix) * 100);
  }

  /**
   * ✅ Obtient l'URL de l'image d'un produit
   * Utilise directement l'URL Cloudinary ou l'image par défaut
   */
  getProduitImageUrl(produit: Produit): string {
    if (!produit.images || produit.images.length === 0) {
      return this.DEFAULT_PRODUCT_IMAGE;
    }
    return produit.images[0].url; // L'URL Cloudinary est déjà complète
  }

  /**
   * ✅ Obtient l'URL du logo d'une boutique
   * Utilise directement l'URL Cloudinary ou l'image par défaut
   */
  getBoutiqueLogoUrl(boutique: Boutique): string {
    if (!boutique || !boutique.logo_url) {
      return this.DEFAULT_BOUTIQUE_IMAGE;
    }
    return boutique.logo_url; // L'URL Cloudinary est déjà complète
  }

  /**
   * ✅ Gestionnaire d'erreur pour les images
   */
  onImageError(event: any, type: 'produit' | 'boutique' = 'produit'): void {
    console.warn(`⚠️ Erreur chargement image ${type}, utilisation du placeholder`);
    event.target.src = type === 'produit' ? this.DEFAULT_PRODUCT_IMAGE : this.DEFAULT_BOUTIQUE_IMAGE;
  }

  private afficherMessage(message: string, error: boolean = false): void {
    this.actionMessage = message;
    this.actionError = error;
    setTimeout(() => {
      this.actionMessage = '';
      this.actionError = false;
    }, 2500);
  }
}