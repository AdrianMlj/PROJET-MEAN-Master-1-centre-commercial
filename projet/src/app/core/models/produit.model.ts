export interface Produit {
  _id: string;
  nom: string;
  description?: string;
  description_detaillee?: string;
  prix: number;
  prix_promotion?: number;
  en_promotion: boolean;
  date_fin_promotion?: Date;
  quantite_stock: number;
  images: string[];
  boutique: {
    _id: string;
    nom: string;
    logo_url?: string;
  };
  categorie_produit?: {
    _id: string;
    nom_categorie: string;
  };
  caracteristiques?: {
    nom: string;
    valeur: string;
    unite?: string;
  }[];
  tags?: string[];
  note_moyenne: number;
  nombre_avis: number;
  nombre_ventes: number;
  est_actif: boolean;
  seuil_alerte?: number;
  poids?: number;
  dimensions?: {
    longueur?: number;
    largeur?: number;
    hauteur?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProduitListResponse {
  success: boolean;
  docs: Produit[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProduitDetailResponse {
  success: boolean;
  produit: Produit;
}

export interface ProduitFilters {
  boutique?: string;
  categorie?: string;
  min_prix?: number;
  max_prix?: number;
  en_promotion?: boolean;
  recherche?: string;
  tags?: string;
  page?: number;
  limit?: number;
  tri?: 'prix_asc' | 'prix_desc' | 'nouveautes' | 'ventes' | 'note' | 'promotion';
}
