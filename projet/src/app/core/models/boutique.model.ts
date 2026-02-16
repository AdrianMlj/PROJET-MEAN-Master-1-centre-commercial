export interface Boutique {
  _id: string;
  nom: string;
  description?: string;
  slogan?: string;
  logo_url?: string;
  categorie: {
    _id: string;
    nom: string;
    description?: string;
  };
  gerant: {
    _id: string;
    nom: string;
    prenom?: string;
    email: string;
  };
  contact?: {
    email?: string;
    telephone?: string;
    horaires?: string;
  };
  adresse?: {
    etage?: string;
    numero?: string;
    aile?: string;
  };
  parametres?: {
    frais_livraison?: number;
    delai_preparation?: number;
    livraison_gratuite_apres?: number;
    accepte_retrait?: boolean;
    accepte_livraison?: boolean;
  };
  social?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  statistiques?: {
    nombre_produits?: number;
    nombre_commandes?: number;
    chiffre_affaires?: number;
    note_moyenne?: number;
    nombre_avis?: number;
  };
  est_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoutiqueListResponse {
  success: boolean;
  docs: Boutique[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BoutiqueDetailResponse {
  success: boolean;
  boutique: Boutique;
}

export interface BoutiqueFilters {
  categorie?: string;
  est_active?: boolean;
  recherche?: string;
  page?: number;
  limit?: number;
  tri?: 'nouveautes' | 'nom_asc' | 'nom_desc' | 'ventes' | 'chiffre_affaires';
}
