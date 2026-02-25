import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PanierService } from '../../../core/services/panier.service';
import { ProduitService } from '../../../core/services/produit.service';
import { AvisService } from '../../../core/services/avis.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavorisService } from '../../../core/services/favoris.service';
import { Produit } from '../../../core/models/produit.model';
import { Avis } from '../../../core/models/avis.model';

@Component({
  selector: 'app-produit-detail',
  templateUrl: './produit-detail.component.html',
  styleUrls: ['./produit-detail.component.css'],
  standalone: false
})
export class ProduitDetailComponent implements OnInit, OnDestroy {
  produit: Produit | null = null;
  loading = true;
  adding = false;
  errorMessage = '';
  actionMessage = '';
  actionError = false;
  quantite = 1;
  imageIndex = 0;
  avis: Avis[] = [];
  loadingAvis = false;
  erreurAvis = '';
  avisMessage = '';
  avisErreur = false;
  submittingAvis = false;
  noteAvis = 5;
  commentaireAvis = '';
  reactionType: 'aime' | 'deteste' = 'aime';
  avisLikeLoading: Record<string, boolean> = {};
  likesMap: Record<string, number> = {};
  aAimeMap: Record<string, boolean> = {};
  isProduitFavori = false;
  isBoutiqueFavorie = false;
  favoriProduitLoading = false;
  favoriBoutiqueLoading = false;

  private destroy$ = new Subject<void>();
  private messageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produitService: ProduitService,
    private panierService: PanierService,
    private avisService: AvisService,
    private authService: AuthService,
    private favorisService: FavorisService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params.get('id');
        if (!id) {
          this.errorMessage = 'Produit introuvable.';
          this.loading = false;
          return;
        }
        this.chargerProduit(id);
      });
  }

  ngOnDestroy(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  chargerProduit(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.actionMessage = '';
    this.imageIndex = 0;
    this.quantite = 1;

    this.produitService.obtenirProduit(id).subscribe({
      next: (response) => {
        this.produit = response.produit;
        this.chargerAvisProduit(response.produit._id);
        this.chargerEtatFavoris(response.produit._id, response.produit.boutique?._id);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Erreur lors du chargement du produit.';
        this.loading = false;
      }
    });
  }

  retourProduits(): void {
    this.router.navigate(['/acheteur/produits']);
  }

  voirBoutique(): void {
    const boutiqueId = this.produit?.boutique?._id;
    if (!boutiqueId) return;
    this.router.navigate(['/acheteur/boutique', boutiqueId]);
  }

  getPrixAffiche(): number {
    if (!this.produit) return 0;
    return this.produit.en_promotion && this.produit.prix_promotion ? this.produit.prix_promotion : this.produit.prix;
  }

  getReduction(): number {
    if (!this.produit || !this.produit.en_promotion || !this.produit.prix_promotion) return 0;
    return Math.round((1 - this.produit.prix_promotion / this.produit.prix) * 100);
  }

  getImagePrincipale(): string {
    const image = this.produit?.images?.[this.imageIndex]?.url;
    return image ? `http://localhost:3000${image}` : 'assets/placeholder-product.png';
  }

  setImage(index: number): void {
    this.imageIndex = index;
  }

  incrementerQuantite(): void {
    if (!this.produit) return;
    this.quantite = Math.min(this.quantite + 1, this.produit.quantite_stock);
  }

  decrementerQuantite(): void {
    this.quantite = Math.max(this.quantite - 1, 1);
  }

  onQuantiteSaisie(value: string): void {
    if (!this.produit) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      this.quantite = 1;
      return;
    }
    this.quantite = Math.min(Math.floor(parsed), this.produit.quantite_stock);
  }

  ajouterAuPanier(allerCheckout: boolean = false): void {
    if (!this.produit || this.produit.quantite_stock <= 0 || this.adding) return;

    this.adding = true;
    this.panierService.ajouterAuPanier({ produitId: this.produit._id, quantite: this.quantite }).subscribe({
      next: (response) => {
        if (response.success) {
          if (allerCheckout) {
            this.router.navigate(['/acheteur/checkout']);
            return;
          }
          this.afficherMessage('Produit ajoute au panier.');
        }
        this.adding = false;
      },
      error: (error) => {
        const message = error?.error?.message || 'Impossible d\'ajouter le produit au panier.';
        this.afficherMessage(message, true);
        this.adding = false;
      }
    });
  }

  getStockTexte(): string {
    if (!this.produit) return '';
    if (this.produit.quantite_stock <= 0) return 'Rupture de stock';
    if (this.produit.quantite_stock <= 5) return `Stock faible: ${this.produit.quantite_stock}`;
    return `En stock: ${this.produit.quantite_stock}`;
  }

  chargerAvisProduit(produitId: string): void {
    this.loadingAvis = true;
    this.erreurAvis = '';

    this.avisService.obtenirAvisProduit(produitId, { page: 1, limit: 20, tri: 'recent' }).subscribe({
      next: (response) => {
        this.avis = response.avis?.docs || [];
        this.likesMap = {};
        this.aAimeMap = {};

        const userId = this.authService.getCurrentUser()?.id;
        this.avis.forEach((item) => {
          const likes = item.likes || [];
          this.likesMap[item._id] = likes.length;
          this.aAimeMap[item._id] = !!userId && likes.includes(userId);
        });

        this.loadingAvis = false;
      },
      error: () => {
        this.erreurAvis = 'Impossible de charger les avis pour ce produit.';
        this.loadingAvis = false;
      }
    });
  }

  definirReaction(type: 'aime' | 'deteste'): void {
    this.reactionType = type;
    this.noteAvis = type === 'aime' ? 5 : 1;
  }

  setNoteAvis(note: number): void {
    this.noteAvis = Math.max(1, Math.min(5, note));
    if (this.noteAvis <= 2) {
      this.reactionType = 'deteste';
      return;
    }
    if (this.noteAvis >= 4) {
      this.reactionType = 'aime';
    }
  }

  soumettreAvisProduit(): void {
    if (!this.produit || this.submittingAvis) return;

    if (!this.authService.isLoggedIn()) {
      this.afficherMessageAvis('Connectez-vous pour publier un avis.', true);
      return;
    }

    const commentaire = this.commentaireAvis.trim();
    if (!commentaire) {
      this.afficherMessageAvis('Ajoutez un commentaire avant d envoyer votre avis.', true);
      return;
    }

    this.submittingAvis = true;
    this.avisService.ajouterAvisProduit({
      produitId: this.produit._id,
      note: this.noteAvis,
      commentaire
    }).subscribe({
      next: (response) => {
        this.afficherMessageAvis(response.message || 'Avis ajoute avec succes.');
        this.commentaireAvis = '';
        this.noteAvis = 5;
        this.reactionType = 'aime';
        this.submittingAvis = false;
        this.chargerAvisProduit(this.produit!._id);
      },
      error: (error) => {
        const message = error?.status === 401
          ? 'Session expiree. Reconnectez-vous pour publier un avis.'
          : (error?.error?.message || 'Impossible d envoyer votre avis.');
        this.afficherMessageAvis(message, true);
        this.submittingAvis = false;
      }
    });
  }

  toggleLikeAvis(avisId: string): void {
    if (this.avisLikeLoading[avisId]) return;

    this.avisLikeLoading[avisId] = true;
    this.avisService.aimerAvis(avisId).subscribe({
      next: (response) => {
        this.likesMap[avisId] = response.nombreLikes;
        this.aAimeMap[avisId] = response.aime;
        this.avisLikeLoading[avisId] = false;
      },
      error: () => {
        this.avisLikeLoading[avisId] = false;
      }
    });
  }

  getAuteurAvis(item: Avis): string {
    const prenom = item.client?.prenom || '';
    const nom = item.client?.nom || '';
    const complet = `${prenom} ${nom}`.trim();
    return complet || 'Client';
  }

  getTypeAvis(item: Avis): 'aime' | 'deteste' {
    return item.note >= 4 ? 'aime' : 'deteste';
  }

  getEtoiles(note: number): number[] {
    const max = Math.max(1, Math.min(5, Math.round(note)));
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  getEchelleEtoiles(): number[] {
    return [1, 2, 3, 4, 5];
  }

  private afficherMessageAvis(message: string, error: boolean = false): void {
    this.avisMessage = message;
    this.avisErreur = error;
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
    }, 3000);
  }

  private chargerEtatFavoris(produitId: string, boutiqueId?: string): void {
    if (!this.authService.isLoggedIn()) {
      this.isProduitFavori = false;
      this.isBoutiqueFavorie = false;
      return;
    }

    this.favorisService.verifierProduit(produitId).subscribe({
      next: (response) => {
        this.isProduitFavori = !!response.est_favori;
      }
    });

    if (boutiqueId) {
      this.favorisService.verifierBoutique(boutiqueId).subscribe({
        next: (response) => {
          this.isBoutiqueFavorie = !!response.est_favori;
        }
      });
    }
  }

  toggleFavoriProduit(): void {
    const produitId = this.produit?._id;
    if (!produitId || this.favoriProduitLoading) return;
    if (!this.authService.isLoggedIn()) {
      this.afficherMessage('Connectez-vous pour gerer vos favoris.', true);
      return;
    }

    if (this.isProduitFavori) {
      this.afficherMessage('Produit deja dans vos favoris.');
      return;
    }

    this.favoriProduitLoading = true;
    const request$ = this.favorisService.ajouterProduit(produitId);

    request$.subscribe({
      next: (response) => {
        this.isProduitFavori = true;
        this.afficherMessage(response.message);
        this.favoriProduitLoading = false;
      },
      error: (error) => {
        this.afficherMessage(error?.error?.message || 'Erreur favoris produit.', true);
        this.favoriProduitLoading = false;
      }
    });
  }

  toggleFavoriBoutique(): void {
    const boutiqueId = this.produit?.boutique?._id;
    if (!boutiqueId || this.favoriBoutiqueLoading) return;
    if (!this.authService.isLoggedIn()) {
      this.afficherMessage('Connectez-vous pour gerer vos favoris.', true);
      return;
    }

    if (this.isBoutiqueFavorie) {
      this.afficherMessage('Boutique deja dans vos favoris.');
      return;
    }

    this.favoriBoutiqueLoading = true;
    const request$ = this.favorisService.ajouterBoutique(boutiqueId);

    request$.subscribe({
      next: (response) => {
        this.isBoutiqueFavorie = true;
        this.afficherMessage(response.message);
        this.favoriBoutiqueLoading = false;
      },
      error: (error) => {
        this.afficherMessage(error?.error?.message || 'Erreur favoris boutique.', true);
        this.favoriBoutiqueLoading = false;
      }
    });
  }
}
