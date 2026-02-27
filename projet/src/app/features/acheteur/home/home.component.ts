import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from '../../../core/services/produit.service';
import { BoutiqueService } from '../../../core/services/boutique.service';
import { CategorieBoutiqueService } from '../../../core/services/categorie-boutique.service';
import { CategorieProduitService } from '../../../core/services/categorie-produit.service';
import { PanierService } from '../../../core/services/panier.service';
import { AvisService } from '../../../core/services/avis.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavorisService } from '../../../core/services/favoris.service';
import { Produit, ProduitFilters } from '../../../core/models/produit.model';
import { Boutique } from '../../../core/models/boutique.model';
import { CategorieBoutique } from '../../../core/models/categorie-boutique.model';
import { CategorieProduit } from '../../../core/models/categorie-produit.model';
import { Avis } from '../../../core/models/avis.model';
import { Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
  currentViewMode: 'home' | 'produits' | 'recherche' | 'promotions' | 'boutiques' = 'home';
  produitsEnPromotion: Produit[] = [];
  nouveautes: Produit[] = [];
  meilleuresVentes: Produit[] = [];
  produitsCatalogue: Produit[] = [];
  boutiques: Boutique[] = [];
  boutiquesRecherche: Boutique[] = [];
  produitsBoutique: Produit[] = [];
  boutiqueSelectionnee: Boutique | null = null;
  vueBoutiqueActive = false;
  loadingBoutiqueSelection = false;
  loadingProduitsBoutique = false;
  erreurBoutique = '';
  ajoutEnCours: Record<string, boolean> = {};
  messageAction = '';
  messageErreur = false;
  loadingCatalogue = false;
  erreurCatalogue = '';
  rechercheCourante = '';
  avisBoutique: Avis[] = [];
  loadingAvisBoutique = false;
  erreurAvisBoutique = '';
  noteAvisBoutique = 5;
  commentaireAvisBoutique = '';
  reactionBoutique: 'aime' | 'deteste' = 'aime';
  sendingAvisBoutique = false;
  likesAvisBoutiqueMap: Record<string, number> = {};
  aAimeAvisBoutiqueMap: Record<string, boolean> = {};
  avisBoutiqueLikeLoading: Record<string, boolean> = {};
  favorisProduitsIds = new Set<string>();
  favorisBoutiquesIds = new Set<string>();
  loadingFavoriProduit: Record<string, boolean> = {};
  loadingFavoriBoutique: Record<string, boolean> = {};
  
  loading = {
    promotions: true,
    nouveautes: true,
    ventes: true,
    boutiques: true
  };

  // Filter properties
  categoriesBoutique: CategorieBoutique[] = [];
  categoriesProduit: CategorieProduit[] = [];
  categoriesProduitBoutique: CategorieProduit[] = [];
  
  // Unique product categories from loaded products (for filtering)
  categoriesProduitCatalogue: { _id: string, nom_categorie: string }[] = [];

  // Selected filters
  filtreCategorieBoutique: string = '';
  filtreCategorieProduit: string = '';
  filtreCategorieProduitBoutique: string = '';
  
  // Price filters
  filtrePrixMin: number | null = null;
  filtrePrixMax: number | null = null;
  
  // Promotion filter
  filtreEnPromotion: boolean | null = null;
  
  // Sort option
  filtreTri: string = 'nouveautes';

  loadingCategoriesBoutique = false;
  loadingCategoriesProduit = false;
  loadingCategoriesProduitBoutique = false;

  searchTerm = '';
  private currentBoutiqueId: string | null = null;
  private homeDataLoaded = false;
  private destroy$ = new Subject<void>();
  private messageTimeout: ReturnType<typeof setTimeout> | null = null;

  // URLs par défaut pour les images manquantes
  private readonly DEFAULT_PRODUCT_IMAGE = 'assets/placeholder-product.png';
  private readonly DEFAULT_BOUTIQUE_IMAGE = 'assets/placeholder-boutique.png';
  private readonly DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';

  constructor(
    private produitService: ProduitService,
    private boutiqueService: BoutiqueService,
    private categorieBoutiqueService: CategorieBoutiqueService,
    private categorieProduitService: CategorieProduitService,
    private panierService: PanierService,
    private avisService: AvisService,
    private authService: AuthService,
    private favorisService: FavorisService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerFavorisEtatGlobal();

    combineLatest([this.route.url, this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([segments, params, queryParams]) => {
        const path = segments[0]?.path || 'home';
        const boutiqueId = params.get('id');
        const recherche = queryParams.get('q') || '';

        if (path === 'boutique' && boutiqueId) {
          this.activerVueBoutique(boutiqueId);
          return;
        }

        this.desactiverVueBoutique();
        this.appliquerModeVue(path, recherche);
      });
  }

  ngOnDestroy(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private chargerAccueilSiNecessaire(): void {
    if (this.homeDataLoaded) return;

    this.homeDataLoaded = true;
    this.chargerProduitsEnPromotion();
    this.chargerNouveautes();
    this.chargerMeilleuresVentes();
    this.chargerBoutiques();
  }

  private appliquerModeVue(path: string, recherche: string): void {
    const modeParPath: Record<string, typeof this.currentViewMode> = {
      home: 'home',
      produits: 'produits',
      recherche: 'recherche',
      promotions: 'promotions',
      boutiques: 'boutiques'
    };

    this.currentViewMode = modeParPath[path] || 'home';
    this.rechercheCourante = recherche.trim();

    if (this.currentViewMode === 'home') {
      this.chargerAccueilSiNecessaire();
      return;
    }

    if (this.currentViewMode === 'boutiques') {
      this.resetFilters();
      this.filtreCategorieBoutique = '';
      this.filtreCategorieProduit = '';
      this.chargerBoutiques(24);
      return;
    }

    if (this.currentViewMode === 'produits') {
      this.resetFilters();
      this.chargerCatalogueProduits({ page: 1, limit: 24, tri: 'nouveautes' });
      return;
    }

    if (this.currentViewMode === 'promotions') {
      this.resetFilters();
      this.filtreEnPromotion = true;
      this.filtreTri = 'promotion';
      this.chargerCatalogueProduits({ page: 1, limit: 24, en_promotion: true, tri: 'promotion' });
      return;
    }

    this.chargerRechercheGlobale(this.rechercheCourante);
  }

  private activerVueBoutique(boutiqueId: string): void {
    this.vueBoutiqueActive = true;
    this.erreurBoutique = '';
    this.filtreCategorieProduitBoutique = '';

    if (this.currentBoutiqueId === boutiqueId && this.boutiqueSelectionnee) return;

    this.currentBoutiqueId = boutiqueId;
    this.boutiqueSelectionnee = null;
    this.produitsBoutique = [];
    this.loadingBoutiqueSelection = true;
    this.loadingProduitsBoutique = true;

    // Load product categories for this boutique
    this.chargerCategoriesProduitBoutique(boutiqueId);

    this.boutiqueService.obtenirBoutique(boutiqueId).subscribe({
      next: (response) => {
        this.boutiqueSelectionnee = response.boutique;
        this.chargerAvisBoutique(boutiqueId);
        this.loadingBoutiqueSelection = false;
      },
      error: () => {
        this.erreurBoutique = 'Impossible de charger cette boutique.';
        this.loadingBoutiqueSelection = false;
      }
    });

    this.produitService.listerProduits({
      boutique: boutiqueId,
      page: 1,
      limit: 24,
      tri: 'nouveautes'
    }).subscribe({
      next: (response) => {
        this.produitsBoutique = response.docs;
        this.loadingProduitsBoutique = false;
      },
      error: () => {
        this.erreurBoutique = 'Impossible de charger les produits de cette boutique.';
        this.loadingProduitsBoutique = false;
      }
    });
  }

  private desactiverVueBoutique(): void {
    this.vueBoutiqueActive = false;
    this.currentBoutiqueId = null;
    this.boutiqueSelectionnee = null;
    this.produitsBoutique = [];
    this.loadingBoutiqueSelection = false;
    this.loadingProduitsBoutique = false;
    this.erreurBoutique = '';
    this.avisBoutique = [];
    this.loadingAvisBoutique = false;
    this.erreurAvisBoutique = '';
    this.noteAvisBoutique = 5;
    this.commentaireAvisBoutique = '';
    this.reactionBoutique = 'aime';
    this.likesAvisBoutiqueMap = {};
    this.aAimeAvisBoutiqueMap = {};
    this.avisBoutiqueLikeLoading = {};
    this.filtreCategorieProduitBoutique = '';
    this.categoriesProduitBoutique = [];
    // Clear product-specific filters
    this.filtrePrixMin = null;
    this.filtrePrixMax = null;
    this.filtreEnPromotion = null;
  }

  private chargerFavorisEtatGlobal(): void {
    if (!this.authService.isLoggedIn()) {
      this.favorisProduitsIds.clear();
      this.favorisBoutiquesIds.clear();
      return;
    }

    this.favorisService.obtenirFavoris().subscribe({
      next: (response) => {
        this.favorisProduitsIds = new Set((response.produits || []).map((p) => p._id));
        this.favorisBoutiquesIds = new Set((response.boutiques || []).map((b) => b._id));
      }
    });
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

  chargerBoutiques(limit: number = 6): void {
    this.loading.boutiques = true;
    // Load categories for filtering
    this.chargerCategoriesBoutique();
    
    this.boutiqueService.listerBoutiques({ limit, est_active: true }).subscribe({
      next: (response) => {
        this.boutiques = response.docs;
        this.loading.boutiques = false;
      },
      error: () => {
        this.loading.boutiques = false;
      }
    });
  }

  chargerCatalogueProduits(filters: ProduitFilters): void {
    this.loadingCatalogue = true;
    this.erreurCatalogue = '';
    this.produitsCatalogue = [];

    this.produitService.listerProduits(filters).subscribe({
      next: (response) => {
        this.produitsCatalogue = response.docs;
        // Extract unique product categories from loaded products
        this.extraireCategoriesProduits();
        this.loadingCatalogue = false;
      },
      error: () => {
        this.erreurCatalogue = 'Impossible de charger les produits.';
        this.loadingCatalogue = false;
      }
    });
  }

  private extraireCategoriesProduits(): void {
    const categoriesMap = new Map<string, { _id: string, nom_categorie: string }>();
    this.produitsCatalogue.forEach(produit => {
      if (produit.categorie_produit && produit.categorie_produit._id) {
        categoriesMap.set(produit.categorie_produit._id, {
          _id: produit.categorie_produit._id,
          nom_categorie: produit.categorie_produit.nom_categorie
        });
      }
    });
    this.categoriesProduitCatalogue = Array.from(categoriesMap.values());
  }

  chargerRechercheGlobale(term: string): void {
    this.loadingCatalogue = true;
    this.erreurCatalogue = '';
    this.produitsCatalogue = [];
    this.boutiquesRecherche = [];

    const recherche = term.trim().toLowerCase();
    if (!recherche) {
      this.loadingCatalogue = false;
      return;
    }

    forkJoin({
      boutiquesAll: this.boutiqueService.listerBoutiques({ est_active: true, limit: 200 }),
      produitsTexte: this.produitService.listerProduits({
        page: 1,
        limit: 48,
        tri: 'nouveautes',
        recherche: term
      }),
      produitsRecents: this.produitService.listerProduits({
        page: 1,
        limit: 200,
        tri: 'nouveautes'
      })
    }).subscribe({
      next: ({ boutiquesAll, produitsTexte, produitsRecents }) => {
        const boutiquesMatch = boutiquesAll.docs.filter((boutique) => {
          const nom = boutique.nom?.toLowerCase() || '';
          const description = boutique.description?.toLowerCase() || '';
          const categorie = boutique.categorie?.nom?.toLowerCase() || '';
          const gerantNom = boutique.gerant?.nom?.toLowerCase() || '';
          const gerantPrenom = boutique.gerant?.prenom?.toLowerCase() || '';
          const gerantComplet = `${gerantPrenom} ${gerantNom}`.trim();

          return (
            nom.includes(recherche) ||
            description.includes(recherche) ||
            categorie.includes(recherche) ||
            gerantNom.includes(recherche) ||
            gerantPrenom.includes(recherche) ||
            gerantComplet.includes(recherche)
          );
        });

        this.boutiquesRecherche = boutiquesMatch;
        const boutiqueIds = new Set(boutiquesMatch.map((b) => b._id));
        const produitsParBoutique = produitsRecents.docs.filter((p) => boutiqueIds.has(p.boutique._id));

        const merged = new Map<string, Produit>();
        produitsTexte.docs.forEach((p) => merged.set(p._id, p));
        produitsParBoutique.forEach((p) => merged.set(p._id, p));
        this.produitsCatalogue = Array.from(merged.values());

        this.loadingCatalogue = false;
      },
      error: () => {
        this.erreurCatalogue = 'Impossible de charger les resultats de recherche.';
        this.loadingCatalogue = false;
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

  voirProduitDepuisCarte(event: Event, produitId: string): void {
    event.stopPropagation();
    this.voirProduit(produitId);
  }

  voirBoutique(boutiqueId: string): void {
    this.router.navigate(['/acheteur/boutique', boutiqueId]);
  }

  voirBoutiqueDepuisProduit(event: Event, boutiqueId?: string): void {
    event.stopPropagation();
    if (!boutiqueId) return;
    this.voirBoutique(boutiqueId);
  }

  retourAuxBoutiques(): void {
    this.router.navigate(['/acheteur/boutiques']);
  }

  voirTousLesProduits(): void {
    this.router.navigate(['/acheteur/produits']);
  }

  voirToutesLesBoutiques(): void {
    this.router.navigate(['/acheteur/boutiques']);
  }

  getTitreCatalogue(): string {
    if (this.currentViewMode === 'produits') return 'Tous les produits';
    if (this.currentViewMode === 'promotions') return 'Produits en promotion';
    return this.rechercheCourante ? `Resultats pour "${this.rechercheCourante}"` : 'Resultats de recherche';
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

  acheterProduit(produit: Produit, event: Event): void {
    event.stopPropagation();

    if (produit.quantite_stock <= 0 || this.ajoutEnCours[produit._id]) return;

    this.ajoutEnCours[produit._id] = true;

    this.panierService.ajouterAuPanier({ produitId: produit._id, quantite: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.afficherMessage(`"${produit.nom}" a ete ajoute au panier.`);
        }
        this.ajoutEnCours[produit._id] = false;
      },
      error: (error) => {
        const message = error?.error?.message || `Impossible d'ajouter "${produit.nom}" au panier.`;
        this.afficherMessage(message, true);
        this.ajoutEnCours[produit._id] = false;
      }
    });
  }

  getStockTexte(produit: Produit): string {
    if (produit.quantite_stock <= 0) return 'Rupture de stock';
    if (produit.quantite_stock <= 5) return `Stock faible: ${produit.quantite_stock}`;
    return `En stock: ${produit.quantite_stock}`;
  }

  isProduitFavori(produitId: string): boolean {
    return this.favorisProduitsIds.has(produitId);
  }

  isBoutiqueFavorie(boutiqueId?: string): boolean {
    if (!boutiqueId) return false;
    return this.favorisBoutiquesIds.has(boutiqueId);
  }

  toggleFavoriProduit(produit: Produit, event: Event): void {
    event.stopPropagation();
    if (!produit?._id || this.loadingFavoriProduit[produit._id]) return;
    if (!this.authService.isLoggedIn()) {
      this.afficherMessage('Connectez-vous pour gerer vos favoris.', true);
      return;
    }

    if (this.isProduitFavori(produit._id)) {
      this.afficherMessage('Produit deja dans vos favoris.');
      return;
    }

    this.loadingFavoriProduit[produit._id] = true;
    const request$ = this.favorisService.ajouterProduit(produit._id);

    request$.subscribe({
      next: (response) => {
        this.favorisProduitsIds.add(produit._id);
        this.afficherMessage(response.message || 'Favoris mis a jour.');
        this.loadingFavoriProduit[produit._id] = false;
      },
      error: (error) => {
        this.afficherMessage(error?.error?.message || 'Erreur favoris produit.', true);
        this.loadingFavoriProduit[produit._id] = false;
      }
    });
  }

  toggleFavoriBoutique(boutiqueId: string, event: Event): void {
    event.stopPropagation();
    if (!boutiqueId || this.loadingFavoriBoutique[boutiqueId]) return;
    if (!this.authService.isLoggedIn()) {
      this.afficherMessage('Connectez-vous pour gerer vos favoris.', true);
      return;
    }

    if (this.isBoutiqueFavorie(boutiqueId)) {
      this.afficherMessage('Boutique deja dans vos favoris.');
      return;
    }

    this.loadingFavoriBoutique[boutiqueId] = true;
    const request$ = this.favorisService.ajouterBoutique(boutiqueId);

    request$.subscribe({
      next: (response) => {
        this.favorisBoutiquesIds.add(boutiqueId);
        this.afficherMessage(response.message || 'Favoris mis a jour.');
        this.loadingFavoriBoutique[boutiqueId] = false;
      },
      error: (error) => {
        this.afficherMessage(error?.error?.message || 'Erreur favoris boutique.', true);
        this.loadingFavoriBoutique[boutiqueId] = false;
      }
    });
  }

  chargerAvisBoutique(boutiqueId: string): void {
    this.loadingAvisBoutique = true;
    this.erreurAvisBoutique = '';

    this.avisService.obtenirAvisBoutique(boutiqueId, { page: 1, limit: 20, tri: 'recent' }).subscribe({
      next: (response) => {
        this.avisBoutique = response.avis?.docs || [];
        this.likesAvisBoutiqueMap = {};
        this.aAimeAvisBoutiqueMap = {};
        const userId = this.authService.getCurrentUser()?.id;

        this.avisBoutique.forEach((item) => {
          const likes = item.likes || [];
          this.likesAvisBoutiqueMap[item._id] = likes.length;
          this.aAimeAvisBoutiqueMap[item._id] = !!userId && likes.includes(userId);
        });

        this.loadingAvisBoutique = false;
      },
      error: () => {
        this.erreurAvisBoutique = 'Impossible de charger les avis de cette boutique.';
        this.loadingAvisBoutique = false;
      }
    });
  }

  definirReactionBoutique(type: 'aime' | 'deteste'): void {
    this.reactionBoutique = type;
    this.noteAvisBoutique = type === 'aime' ? 5 : 1;
  }

  setNoteAvisBoutique(note: number): void {
    this.noteAvisBoutique = Math.max(1, Math.min(5, note));
    if (this.noteAvisBoutique <= 2) {
      this.reactionBoutique = 'deteste';
      return;
    }
    if (this.noteAvisBoutique >= 4) {
      this.reactionBoutique = 'aime';
    }
  }

  soumettreAvisBoutique(): void {
    if (!this.boutiqueSelectionnee || this.sendingAvisBoutique) return;

    if (!this.authService.isLoggedIn()) {
      this.afficherMessage('Connectez-vous pour publier un avis boutique.', true);
      return;
    }

    const commentaire = this.commentaireAvisBoutique.trim();
    if (!commentaire) {
      this.afficherMessage('Ajoutez un commentaire pour votre avis boutique.', true);
      return;
    }

    this.sendingAvisBoutique = true;
    this.avisService.ajouterAvisBoutique({
      boutiqueId: this.boutiqueSelectionnee._id,
      note: this.noteAvisBoutique,
      commentaire
    }).subscribe({
      next: (response) => {
        this.afficherMessage(response.message || 'Avis boutique ajoute avec succes.');
        this.commentaireAvisBoutique = '';
        this.noteAvisBoutique = 5;
        this.reactionBoutique = 'aime';
        this.sendingAvisBoutique = false;
        this.chargerAvisBoutique(this.boutiqueSelectionnee!._id);
      },
      error: (error) => {
        const message = error?.status === 401
          ? 'Session expiree. Reconnectez-vous pour publier un avis boutique.'
          : (error?.error?.message || 'Impossible d envoyer votre avis boutique.');
        this.afficherMessage(message, true);
        this.sendingAvisBoutique = false;
      }
    });
  }

  toggleLikeAvisBoutique(avisId: string): void {
    if (this.avisBoutiqueLikeLoading[avisId]) return;

    this.avisBoutiqueLikeLoading[avisId] = true;
    this.avisService.aimerAvis(avisId).subscribe({
      next: (response) => {
        this.likesAvisBoutiqueMap[avisId] = response.nombreLikes;
        this.aAimeAvisBoutiqueMap[avisId] = response.aime;
        this.avisBoutiqueLikeLoading[avisId] = false;
      },
      error: () => {
        this.avisBoutiqueLikeLoading[avisId] = false;
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

  // ========================================
  // Filter methods for products catalog
  // ========================================

  chargerCategoriesBoutique(): void {
    if (this.categoriesBoutique.length > 0) return;
    
    this.loadingCategoriesBoutique = true;
    this.categorieBoutiqueService.listerCategories().subscribe({
      next: (response) => {
        this.categoriesBoutique = response.categories || [];
        this.loadingCategoriesBoutique = false;
      },
      error: () => {
        this.loadingCategoriesBoutique = false;
      }
    });
  }

  chargerCategoriesProduit(): void {
    this.loadingCategoriesProduit = false;
  }

  appliquerFiltreCategorieBoutique(): void {
    if (this.currentViewMode === 'boutiques') {
      this.filtreCategorieProduit = '';
      this.chargerBoutiquesFiltrees();
    }
  }

  appliquerFiltreCategorieProduit(): void {
    if (this.currentViewMode === 'produits' || this.currentViewMode === 'promotions') {
      this.filtreCategorieBoutique = '';
      this.chargerCatalogueProduitsFiltre();
    }
  }

  appliquerFiltrePrix(): void {
    if (this.currentViewMode === 'produits' || this.currentViewMode === 'promotions') {
      this.chargerCatalogueProduitsFiltre();
    }
  }

  appliquerFiltreTri(): void {
    if (this.currentViewMode === 'produits' || this.currentViewMode === 'promotions') {
      this.chargerCatalogueProduitsFiltre();
    }
  }

  appliquerFiltrePrixBoutique(): void {
    if (this.boutiqueSelectionnee) {
      this.appliquerFiltreCategorieProduitBoutique();
    }
  }

  resetFilters(): void {
    this.filtreCategorieBoutique = '';
    this.filtreCategorieProduit = '';
    this.filtrePrixMin = null;
    this.filtrePrixMax = null;
    this.filtreEnPromotion = null;
    this.filtreTri = 'nouveautes';
  }

  chargerBoutiquesFiltrees(): void {
    this.loading.boutiques = true;
    const filters: any = { est_active: true };
    
    if (this.filtreCategorieBoutique) {
      filters.categorie = this.filtreCategorieBoutique;
    }
    
    this.boutiqueService.listerBoutiques(filters).subscribe({
      next: (response) => {
        this.boutiques = response.docs;
        this.loading.boutiques = false;
      },
      error: () => {
        this.loading.boutiques = false;
      }
    });
  }

  chargerCatalogueProduitsFiltre(): void {
    this.loadingCatalogue = true;
    this.erreurCatalogue = '';

    const filters: ProduitFilters = {
      page: 1,
      limit: 24,
      tri: this.filtreTri as any
    };

    if (this.filtreCategorieProduit) {
      filters.categorie = this.filtreCategorieProduit;
    }

    if (this.filtrePrixMin !== null && this.filtrePrixMin > 0) {
      filters.min_prix = this.filtrePrixMin;
    }

    if (this.filtrePrixMax !== null && this.filtrePrixMax > 0) {
      filters.max_prix = this.filtrePrixMax;
    }

    if (this.filtreEnPromotion !== null) {
      filters.en_promotion = this.filtreEnPromotion;
    }

    if (this.currentViewMode === 'promotions' || this.filtreEnPromotion) {
      filters.en_promotion = true;
      filters.tri = 'promotion';
    }

    this.produitService.listerProduits(filters).subscribe({
      next: (response) => {
        this.produitsCatalogue = response.docs;
        this.extraireCategoriesProduits();
        this.loadingCatalogue = false;
      },
      error: () => {
        this.erreurCatalogue = 'Impossible de charger les produits.';
        this.loadingCatalogue = false;
      }
    });
  }

  // ========================================
  // Filter methods for single boutique view
  // ========================================

  chargerCategoriesProduitBoutique(boutiqueId: string): void {
    this.loadingCategoriesProduitBoutique = true;
    this.categoriesProduitBoutique = [];
    
    this.categorieProduitService.listerCategoriesBoutique(boutiqueId).subscribe({
      next: (response) => {
        this.categoriesProduitBoutique = response.categories || [];
        this.loadingCategoriesProduitBoutique = false;
      },
      error: () => {
        this.loadingCategoriesProduitBoutique = false;
      }
    });
  }

  appliquerFiltreCategorieProduitBoutique(): void {
    if (!this.boutiqueSelectionnee) return;
    
    this.loadingProduitsBoutique = true;
    const filters: ProduitFilters = {
      boutique: this.boutiqueSelectionnee._id,
      page: 1,
      limit: 24,
      tri: 'nouveautes'
    };

    if (this.filtreCategorieProduitBoutique) {
      filters.categorie = this.filtreCategorieProduitBoutique;
    }

    if (this.filtrePrixMin !== null && this.filtrePrixMin > 0) {
      filters.min_prix = this.filtrePrixMin;
    }

    if (this.filtrePrixMax !== null && this.filtrePrixMax > 0) {
      filters.max_prix = this.filtrePrixMax;
    }

    this.produitService.listerProduits(filters).subscribe({
      next: (response) => {
        this.produitsBoutique = response.docs;
        this.loadingProduitsBoutique = false;
      },
      error: () => {
        this.erreurBoutique = 'Impossible de charger les produits de cette boutique.';
        this.loadingProduitsBoutique = false;
      }
    });
  }

  // ========================================
  // Utility methods
  // ========================================

  /**
   * ✅ Obtient l'URL de l'image principale d'un produit
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
   * Remplace par l'image par défaut en cas d'erreur de chargement
   */
  onImageError(event: any, type: 'produit' | 'boutique' = 'produit'): void {
    console.warn(`⚠️ Erreur chargement image ${type}, utilisation du placeholder`);
    event.target.src = type === 'produit' ? this.DEFAULT_PRODUCT_IMAGE : this.DEFAULT_BOUTIQUE_IMAGE;
  }

  private afficherMessage(message: string, erreur: boolean = false): void {
    this.messageAction = message;
    this.messageErreur = erreur;

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageTimeout = setTimeout(() => {
      this.messageAction = '';
      this.messageErreur = false;
      this.messageTimeout = null;
    }, 3000);
  }
}