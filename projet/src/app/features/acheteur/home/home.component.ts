import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProduitService } from '../../../core/services/produit.service';
import { BoutiqueService } from '../../../core/services/boutique.service';
import { Produit } from '../../../core/models/produit.model';
import { Boutique } from '../../../core/models/boutique.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit {
  produitsEnPromotion: Produit[] = [];
  nouveautes: Produit[] = [];
  meilleuresVentes: Produit[] = [];
  boutiques: Boutique[] = [];
  
  loading = {
    promotions: true,
    nouveautes: true,
    ventes: true,
    boutiques: true
  };

  searchTerm = '';

  constructor(
    private produitService: ProduitService,
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerProduitsEnPromotion();
    this.chargerNouveautes();
    this.chargerMeilleuresVentes();
    this.chargerBoutiques();
  }

  chargerProduitsEnPromotion(): void {
    this.produitService.obtenirProduitsEnPromotion(1, 8).subscribe({
      next: (response) => {
        this.produitsEnPromotion = response.docs;
        this.loading.promotions = false;
      },
      error: () => {
        this.loading.promotions = false;
      }
    });
  }

  chargerNouveautes(): void {
    this.produitService.obtenirNouveautes(1, 8).subscribe({
      next: (response) => {
        this.nouveautes = response.docs;
        this.loading.nouveautes = false;
      },
      error: () => {
        this.loading.nouveautes = false;
      }
    });
  }

  chargerMeilleuresVentes(): void {
    this.produitService.obtenirMeilleuresVentes(1, 8).subscribe({
      next: (response) => {
        this.meilleuresVentes = response.docs;
        this.loading.ventes = false;
      },
      error: () => {
        this.loading.ventes = false;
      }
    });
  }

  chargerBoutiques(): void {
    this.boutiqueService.listerBoutiques({ limit: 6, est_active: true }).subscribe({
      next: (response) => {
        this.boutiques = response.docs;
        this.loading.boutiques = false;
      },
      error: () => {
        this.loading.boutiques = false;
      }
    });
  }

  rechercher(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/acheteur/recherche'], { 
        queryParams: { q: this.searchTerm.trim() } 
      });
    }
  }

  voirProduit(produitId: string): void {
    this.router.navigate(['/acheteur/produit', produitId]);
  }

  voirBoutique(boutiqueId: string): void {
    this.router.navigate(['/acheteur/boutique', boutiqueId]);
  }

  voirTousLesProduits(): void {
    this.router.navigate(['/acheteur/produits']);
  }

  voirToutesLesBoutiques(): void {
    this.router.navigate(['/acheteur/boutiques']);
  }

  getPrixAffiche(produit: Produit): number {
    return produit.en_promotion && produit.prix_promotion ? produit.prix_promotion : produit.prix;
  }

  getReduction(produit: Produit): number {
    if (produit.en_promotion && produit.prix_promotion) {
      return Math.round((1 - produit.prix_promotion / produit.prix) * 100);
    }
    return 0;
  }
}
