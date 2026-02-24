export interface AdresseLivraison {
  nom_complet: string;
  telephone: string;
  rue: string;
  complement?: string;
  ville: string;
  code_postal: string;
  pays: string;
  instructions?: string;
}

export interface ClientInfo {
  _id: string;
  email: string;
  nom: string;
  prenom?: string;
  telephone?: string;
}

export interface BoutiqueInfo {
  _id: string;
  nom: string;
  logo_url?: string;
}

export interface ProduitDetail {
  _id: string;
  nom: string;
  description?: string;
  images?: { url: string; is_principale?: boolean }[];
  pourcentage_reduction?: number;
}

export interface CommandeDetail {
  _id: string;
  commande: string;
  produit: ProduitDetail | string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
  nom_produit: string;
  image_produit?: string;
  caracteristiques?: { nom: string; valeur: string }[];
}

export interface Commande {
  _id: string;
  numero_commande: string;
  client: ClientInfo | string;
  boutique: BoutiqueInfo | string;
  statut: 'en_attente' | 'en_preparation' | 'pret' | 'livre' | 'annule' | 'refuse';
  total_commande: number;
  frais_livraison: number;
  total_general: number;
  adresse_livraison: AdresseLivraison;
  mode_livraison: 'retrait_boutique' | 'livraison_standard' | 'livraison_express';
  notes?: string;
  informations_paiement: {
    methode?: string;
    statut: 'en_attente' | 'paye' | 'echec' | 'rembourse';
    reference?: string;
    date_paiement?: Date;
  };
  date_livraison_estimee?: Date;
  date_livraison_reelle?: Date;
  suivi_livraison?: {
    numero_suivi?: string;
    transporteur?: string;
    url_suivi?: string;
  };
  date_commande: Date;
  date_modification_statut: Date;
  details?: CommandeDetail[];
  est_livre?: boolean;
  est_paye?: boolean;
}

export interface CommandeListResponse {
  success: boolean;
  docs: Commande[];
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

export interface CommandeResponse {
  success: boolean;
  commande?: Commande;
  message?: string;
}

export interface UpdateStatutRequest {
  nouveau_statut: string;
  raison?: string;
}