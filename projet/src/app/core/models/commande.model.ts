import { Produit } from './produit.model';
import { Boutique } from './boutique.model';

export type StatutCommande = 'en_attente' | 'en_preparation' | 'pret' | 'livre' | 'annule' | 'refuse';
export type ModeLivraison = 'retrait_boutique' | 'livraison_standard' | 'livraison_express';
export type MethodePaiement = 'carte_credit' | 'especes' | 'virement' | 'mobile' | 'carte_bancaire';

export interface AdresseLivraison {
  nom_complet: string;
  telephone: string;
  rue: string;
  complement?: string;
  ville: string;
  code_postal: string;
  pays?: string;
  instructions?: string;
}

export interface CommandeDetail {
  _id: string;
  produit: Produit;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
}

export interface Commande {
  _id: string;
  numero_commande: string;
  client: {
    _id: string;
    nom: string;
    prenom?: string;
    email: string;
    telephone?: string;
  };
  boutique: Boutique;
  details: CommandeDetail[];
  adresse_livraison: AdresseLivraison;
  mode_livraison: ModeLivraison;
  statut: StatutCommande;
  statut_paiement: 'en_attente' | 'paye' | 'rembourse' | 'echoue';
  methode_paiement: MethodePaiement;
  sous_total: number;
  frais_livraison: number;
  total: number;
  total_commande: number;
  total_general: number;
  notes?: string;
  date_commande: Date;
  date_livraison_estimee?: Date;
  date_livraison_effective?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommandeListResponse {
  success: boolean;
  docs: Commande[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CommandeDetailResponse {
  success: boolean;
  commande: Commande;
}

export interface CommandeHistoriqueStatut {
  ancien_statut: StatutCommande;
  nouveau_statut: StatutCommande;
  date_modification: Date;
  utilisateur_modif?: {
    nom: string;
    prenom?: string;
  };
  raison?: string;
}

export interface CommandeHistoriqueResponse {
  success: boolean;
  historique: CommandeHistoriqueStatut[];
}

export interface PasserCommandeRequest {
  adresse_livraison: AdresseLivraison;
  mode_livraison?: ModeLivraison;
  notes?: string;
  methode_paiement: MethodePaiement;
}

export interface PasserCommandeResponse {
  success: boolean;
  message: string;
  commandes: Commande[];
  nombre_commandes: number;
}

export interface CommandeFilters {
  statut?: StatutCommande;
  page?: number;
  limit?: number;
  date_debut?: string;
  date_fin?: string;
}
