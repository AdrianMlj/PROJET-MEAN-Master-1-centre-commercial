export interface User {
  _id: string;
  email: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  role: {
    _id: string;
    nom_role: 'admin_centre' | 'boutique' | 'acheteur';
    description?: string;
  };
  est_actif: boolean;
  avatar_url?: string | null;
  boutique_associee?: {
    _id: string;
    nom: string;
    est_active: boolean;
  } | null;
  adresse?: {
    rue?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
  };
  preferences?: {
    newsletter: boolean;
    notifications: boolean;
    langue: string;
  };
  verifie_email: boolean;
  date_derniere_connexion?: Date;
  date_creation: Date;
  date_modification: Date;
}

export interface CreerUserBoutiqueRequest {
  email: string;
  mot_de_passe: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  role: 'boutique';
  est_actif: boolean;
}

export interface UserListResponse {
  success: boolean;
  docs: User[];
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

export interface UserResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface UserStats {
  total: number;
  admins: number;
  boutiques: number;
  acheteurs: number;
  actifs: number;
  inactifs: number;
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  recherche?: string;
  role?: string;
  statut?: string;
}