import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PanierService } from '../../../core/services/panier.service';
import { Panier, PanierElement, PanierTotalResponse } from '../../../core/models/panier.model';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css'],
  standalone: false
})
export class PanierComponent implements OnInit, OnDestroy {
  panier: Panier | null = null;
  panierTotal: PanierTotalResponse | null = null;
  loading = true;
  loadingTotal = false;
  updating: { [key: string]: boolean } = {};
  errorMessage = '';
  actionMessage = '';
  actionError = false;
  private messageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private panierService: PanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerPanier();
  }

  ngOnDestroy(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
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

  modifierQuantite(element: PanierElement, nouvelleQuantite: number | string): void {
    if (this.updating[element._id]) return;

    const raw = typeof nouvelleQuantite === 'string' ? nouvelleQuantite.trim() : nouvelleQuantite;
    if (raw === '' || raw === null || raw === undefined) return;

    const quantite = Math.floor(Number(raw));
    if (!Number.isFinite(quantite)) return;

    const quantiteMax = this.getQuantiteMax(element);
    const quantiteFinale = Math.min(Math.max(quantite, 1), quantiteMax);
    if (quantiteFinale === element.quantite) return;
    
    this.updating[element._id] = true;
    this.panierService.modifierQuantite(element._id, { quantite: quantiteFinale }).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorMessage = '';
          this.panier = response.panier;
          this.chargerTotal();
          this.afficherMessage('Quantite mise a jour.');
        }
        this.updating[element._id] = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la modification';
        this.afficherMessage(this.errorMessage, true);
        this.updating[element._id] = false;
      }
    });
  }

  onQuantiteInputBlur(element: PanierElement, valeur: string): void {
    this.modifierQuantite(element, valeur);
  }

  incrementerQuantite(element: PanierElement): void {
    const current = this.panier?.elements.find((el) => el._id === element._id) || element;
    if (current.quantite >= this.getQuantiteMax(current)) return;
    this.modifierQuantite(current, current.quantite + 1);
  }

  decrementerQuantite(element: PanierElement): void {
    const current = this.panier?.elements.find((el) => el._id === element._id) || element;
    if (current.quantite > 1) {
      this.modifierQuantite(current, current.quantite - 1);
    }
  }

  retirerProduit(element: PanierElement): void {
    if (!confirm('Voulez-vous vraiment retirer ce produit du panier ?')) return;
    
    this.updating[element._id] = true;
    this.panierService.retirerDuPanier(element._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorMessage = '';
          this.panier = response.panier;
          if (this.panier && this.panier.elements.length > 0) {
            this.chargerTotal();
          } else {
            this.panierTotal = null;
          }
          this.afficherMessage('Produit retire du panier.');
        }
        this.updating[element._id] = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
        this.afficherMessage(this.errorMessage, true);
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
          this.errorMessage = '';
          this.panier = response.panier;
          this.panierTotal = null;
          this.afficherMessage('Panier vide.');
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du vidage du panier';
        this.afficherMessage(this.errorMessage, true);
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

  getQuantiteMax(element: PanierElement): number {
    const stock = Number(element?.produit?.quantite_stock);
    if (Number.isFinite(stock) && stock > 0) return Math.floor(stock);
    return 9999;
  }

  private afficherMessage(message: string, error: boolean = false): void {
    this.actionMessage = message;
    this.actionError = error;

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageTimeout = setTimeout(() => {
      this.actionMessage = '';
      this.actionError = false;
      this.messageTimeout = null;
    }, 2500);
  }
}
