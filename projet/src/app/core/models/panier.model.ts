import { Produit } from './produit.model';

export interface PanierElement {
  _id: string;
  produit: Produit;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  date_ajout: Date;
}

export interface Panier {
  _id: string;
  utilisateur: string;
  elements: PanierElement[];
  date_creation: Date;
  date_modification: Date;
}

export interface PanierResponse {
  success: boolean;
  panier: Panier;
  total: number;
  nombre_articles: number;
}

export interface PanierTotalResponse {
  success: boolean;
  total_produits: number;
  frais_livraison_total: number;
  total_general: number;
  detail_par_boutique: {
    boutique: {
      _id: string;
      nom: string;
      parametres?: {
        frais_livraison?: number;
        livraison_gratuite_apres?: number;
      };
    };
    total: number;
    frais_livraison: number;
    total_general: number;
    articles: PanierElement[];
  }[];
  nombre_boutiques: number;
}

export interface AjouterPanierRequest {
  produitId: string;
  quantite?: number;
}

export interface ModifierQuantiteRequest {
  quantite: number;
}
