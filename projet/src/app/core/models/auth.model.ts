export interface LoginRequest {
  email: string;
  mot_de_passe: string;
}

export interface RegisterRequest {
  email: string;
  mot_de_passe: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  role: 'acheteur';
  adresse?: {
    rue?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  utilisateur: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  utilisateur: User;
}

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  role: 'admin_centre' | 'boutique' | 'acheteur';
  boutique_associee?: string;
  est_actif: boolean;
  avatar_url?: string;
  adresse?: {
    rue?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
  };
  preferences?: {
    newsletter?: boolean;
    notifications?: boolean;
    langue?: string;
  };
  verifie_email?: boolean;
  date_creation?: Date;
  date_modification?: Date;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  nom: string;
  prenom?: string;
  boutiqueId?: string;
  iat?: number;
  exp?: number;
}