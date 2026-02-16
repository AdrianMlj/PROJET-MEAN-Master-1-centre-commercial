import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PanierService } from '../../../core/services/panier.service';
import { Panier, PanierElement, PanierTotalResponse } from '../../../core/models/panier.model';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css'],
  standalone: false
})
export class PanierComponent implements OnInit {
  panier: Panier | null = null;
  panierTotal: PanierTotalResponse | null = null;
  loading = true;
  loadingTotal = false;
  updating: { [key: string]: boolean } = {};
  errorMessage = '';

  constructor(
    private panierService: PanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerPanier();
  }

  chargerPanier(): void {
    this.loading = true;
    this.panierService.obtenirPanier().subscribe({
      next: (response) => {
        if (response.success) {
          this.panier = response.panier;
          if (this.panier && this.panier.elements.length > 0) {
            this.chargerTotal();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement du panier';
        this.loading = false;
      }
    });
  }

  chargerTotal(): void {
    this.loadingTotal = true;
    this.panierService.calculerTotal().subscribe({
      next: (response) => {
        if (response.success) {
          this.panierTotal = response;
        }
        this.loadingTotal = false;
      },
      error: () => {
        this.loadingTotal = false;
      }
    });
  }

  modifierQuantite(element: PanierElement, nouvelleQuantite: number): void {
    if (nouvelleQuantite < 1) return;
    
    this.updating[element._id] = true;
    this.panierService.modifierQuantite(element._id, { quantite: nouvelleQuantite }).subscribe({
      next: (response) => {
        if (response.success) {
          this.panier = response.panier;
          this.chargerTotal();
        }
        this.updating[element._id] = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la modification';
        this.updating[element._id] = false;
      }
    });
  }

  incrementerQuantite(element: PanierElement): void {
    this.modifierQuantite(element, element.quantite + 1);
  }

  decrementerQuantite(element: PanierElement): void {
    if (element.quantite > 1) {
      this.modifierQuantite(element, element.quantite - 1);
    }
  }

  retirerProduit(element: PanierElement): void {
    if (!confirm('Voulez-vous vraiment retirer ce produit du panier ?')) return;
    
    this.updating[element._id] = true;
    this.panierService.retirerDuPanier(element._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.panier = response.panier;
          if (this.panier && this.panier.elements.length > 0) {
            this.chargerTotal();
          } else {
            this.panierTotal = null;
          }
        }
        this.updating[element._id] = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
        this.updating[element._id] = false;
      }
    });
  }

  viderPanier(): void {
    if (!confirm('Voulez-vous vraiment vider votre panier ?')) return;
    
    this.loading = true;
    this.panierService.viderPanier().subscribe({
      next: (response) => {
        if (response.success) {
          this.panier = response.panier;
          this.panierTotal = null;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du vidage du panier';
        this.loading = false;
      }
    });
  }

  passerCommande(): void {
    this.router.navigate(['/acheteur/checkout']);
  }

  continuerAchats(): void {
    this.router.navigate(['/acheteur/produits']);
  }

  voirProduit(produitId: string): void {
    this.router.navigate(['/acheteur/produit', produitId]);
  }

  getPrixAffiche(element: PanierElement): number {
    const produit = element.produit;
    return produit.en_promotion && produit.prix_promotion ? produit.prix_promotion : produit.prix;
  }

  get nombreArticles(): number {
    if (!this.panier || !this.panier.elements) return 0;
    return this.panier.elements.reduce((sum, el) => sum + el.quantite, 0);
  }

  get sousTotal(): number {
    if (!this.panier || !this.panier.elements) return 0;
    return this.panier.elements.reduce((sum, el) => sum + (this.getPrixAffiche(el) * el.quantite), 0);
  }
}
