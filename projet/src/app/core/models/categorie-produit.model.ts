export interface CategorieProduit {
  _id: string;
  nom_categorie: string;
  description?: string;
  boutique: string; // ID de la boutique
  image_url?: string;
  ordre_affichage: number;
  est_active: boolean;
  nombre_produits: number;
  date_creation: Date;
  date_modification: Date;
}

export interface CreerCategorieProduitRequest {
  nom_categorie: string;
  description?: string;
  image_url?: string;
  ordre_affichage?: number;
}

export interface ModifierCategorieProduitRequest {
  nom_categorie?: string;
  description?: string;
  image_url?: string;
  ordre_affichage?: number;
  est_active?: boolean;
}

export interface CategorieProduitResponse {
  success: boolean;
  message?: string;
  categorie?: CategorieProduit;
  categories?: CategorieProduit[];
}