import { Boutique } from './boutique.model';
import { Produit } from './produit.model';

export interface FavorisResponse {
  success: boolean;
  produits: Produit[];
  boutiques: Boutique[];
  total: number;
}

export interface FavorisMutationResponse {
  success: boolean;
  message: string;
}

export interface VerifierFavoriResponse {
  success: boolean;
  est_favori: boolean;
}
