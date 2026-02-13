export interface CategorieBoutique {
  _id: string;
  nom_categorie: string;
  description?: string;
  icone?: string;
  image_url?: string;
  est_active: boolean;
  ordre_affichage: number;
  nombre_boutiques: number;
  date_creation: Date;
  date_modification: Date;
}

export interface CreerCategorieRequest {
  nom_categorie: string;
  description?: string;
  image_url?: string;
  ordre_affichage?: number;
}

export interface ModifierCategorieRequest {
  nom_categorie?: string;
  description?: string;
  image_url?: string;
  ordre_affichage?: number;
  est_active?: boolean;
}

export interface CategorieResponse {
  success: boolean;
  message?: string;
  categorie?: CategorieBoutique;
  categories?: CategorieBoutique[];
}