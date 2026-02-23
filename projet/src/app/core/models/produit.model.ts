export interface ProduitImage {
  url: string;
  ordre: number;
  is_principale: boolean;
  _id?: string;
}

export interface Produit {
  _id: string;
  nom: string;
  description?: string;
  description_detaillee?: string;
  prix: number;
  prix_promotion?: number;
  en_promotion: boolean;
  quantite_stock: number;
  seuil_alerte: number;
  images: ProduitImage[];
  categorie_produit?: {
    _id: string;
    nom_categorie: string;
  } | string;
  boutique: string;
  est_actif: boolean;
  caracteristiques?: Array<{ nom: string; valeur: string; unite?: string }>;
  tags?: string[];
  statistiques?: {
    nombre_vues: number;
    nombre_ventes: number;
    note_moyenne: number;
    nombre_avis: number;
  };
  date_debut_promotion?: Date;
  date_fin_promotion?: Date;
  code_produit?: string;
  poids?: number;
  dimensions?: {
    longueur?: number;
    largeur?: number;
    hauteur?: number;
  };
  date_creation: Date;
  date_modification: Date;

  // virtuels (optionnels)
  prix_final?: number;
  est_disponible?: boolean;
  pourcentage_reduction?: number;
}

export interface CreerProduitRequest {
  nom: string;
  description?: string;
  prix: number;
  quantite_stock: number;
  categorie_produit?: string;
  // autres champs optionnels
  en_promotion?: boolean;
  prix_promotion?: number;
}

export interface ModifierProduitRequest {
  nom?: string;
  description?: string;
  prix?: number;
  quantite_stock?: number;
  categorie_produit?: string;
  est_actif?: boolean;
  en_promotion?: boolean;
  prix_promotion?: number;
}

export interface ProduitListResponse {
  success: boolean;
  docs: Produit[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface ProduitResponse {
  success: boolean;
  message?: string;
  produit?: Produit;
}