export interface CategorieProduit {
  _id: string;
  nom_categorie: string;
  description?: string;
  image_url?: string;
  est_active: boolean;
  ordre_affichage: number;
  nombre_produits: number;
  boutique: string;
  date_creation: Date;
  date_modification: Date;
}

export interface CategorieProduitResponse {
  success: boolean;
  message?: string;
  categorie?: CategorieProduit;
  categories?: CategorieProduit[];
}
