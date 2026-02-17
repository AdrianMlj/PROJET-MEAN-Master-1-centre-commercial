export interface Boutique {
  _id: string;
  nom: string;
  description?: string;
  slogan?: string;
  categorie: {
    _id: string;
    nom_categorie: string;
    icone?: string;
  } | string;
  logo_url?: string;
  images: string[];
  gerant: {
    _id: string;
    email: string;
    nom: string;
    prenom?: string;
    telephone?: string;
  } | string;
  est_active: boolean;
  statut_paiement: 'paye' | 'impaye';
  contact: {
    email?: string;
    telephone?: string;
    horaires?: string;
  };
  adresse?: {
    etage?: string;
    numero?: string;
    aile?: string;
  };
  informations_bancaires?: {
    iban?: string;
    bic?: string;
  };
  parametres: {
    frais_livraison: number;
    delai_preparation: number;
    livraison_gratuite_apres: number;
    accepte_retrait: boolean;
    accepte_livraison: boolean;
  };
  statistiques: {
    note_moyenne: number;
    nombre_avis: number;
    commandes_traitees: number;
    produits_vendus: number;
    chiffre_affaires: number;
  };
  social?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  date_ouverture: Date;
  date_creation: Date;
  date_modification: Date;
}

export interface CreerBoutiqueRequest {
  nom: string;
  categorie: string;
  gerant: string;
}

export interface ModifierBoutiqueRequest {
  nom?: string;
  description?: string;
  slogan?: string;
  categorie?: string;
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
  };
  est_active?: boolean;
}

export interface BoutiqueListResponse {
  success: boolean;
  stats: {
    total: number;
    actives: number;
    inactives: number;
    payees: number;
    impayees: number;
  };
  docs: Boutique[];
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

export interface BoutiqueResponse {
  success: boolean;
  boutique?: Boutique;
  message?: string;
}