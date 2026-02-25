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

  private afficherMessage(message: string, error: boolean = false): void {
    this.actionMessage = message;
    this.actionError = error;
    setTimeout(() => {
      this.actionMessage = '';
      this.actionError = false;
    }, 2500);
  }
}
