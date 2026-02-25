export interface AvisClient {
  _id: string;
  nom: string;
  prenom?: string;
  avatar_url?: string;
}

export interface AvisReponse {
  texte?: string;
  date?: string;
  utilisateur?: {
    _id: string;
    nom: string;
    prenom?: string;
  };
}

export interface Avis {
  _id: string;
  produit?: string;
  boutique?: string;
  client: AvisClient;
  note: number;
  commentaire?: string;
  likes?: string[];
  reponse?: AvisReponse;
  date_creation?: string;
  date_modification?: string;
}

export interface AvisPaginated {
  docs: Avis[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AvisStatistiquesProduit {
  totalAvis: number;
  moyenneNotes: string;
  repartition?: Record<string, number>;
  statsNotes?: Array<{ _id: number; count: number }>;
}

export interface AvisStatistiquesBoutique {
  totalAvis: number;
  moyenneNotes: string;
  statsNotes?: Array<{ _id: number; count: number }>;
}

export interface AvisProduitResponse {
  success: boolean;
  avis: AvisPaginated;
  statistiques: AvisStatistiquesProduit;
}

export interface AvisBoutiqueResponse {
  success: boolean;
  avis: AvisPaginated;
  statistiques: AvisStatistiquesBoutique;
}

export interface AjouterAvisProduitRequest {
  produitId: string;
  note: number;
  commentaire?: string;
  commandeId?: string;
}

export interface AjouterAvisBoutiqueRequest {
  boutiqueId: string;
  note: number;
  commentaire?: string;
}

export interface AjouterAvisResponse {
  success: boolean;
  message: string;
  avis: Avis;
}

export interface AimerAvisResponse {
  success: boolean;
  message: string;
  nombreLikes: number;
  aime: boolean;
}
