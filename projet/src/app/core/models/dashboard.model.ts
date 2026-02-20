export interface DashboardData {
  success: boolean;
  dashboard: {
    statistiques: {
      boutiques: {
        total: number;
        actives: number;
        inactives: number;
      };
      utilisateurs: {
        total: number;
        acheteurs_actifs: number;
      };
      commandes: {
        total: number;
        ce_mois: number;
        cette_semaine: number;
      };
      produits: {
        total: number;
      };
      chiffre_affaires: {
        total: number;
        ce_mois: number;
        cette_semaine: number;
      };
    };
    categories_populaires: Array<{
      _id: string;
      nombreBoutiques: number;
      categorie: string;
    }>;
    alertes: {
      boutiques_inactives: number;
      produits_rupture: number;
      produits_faible_stock: number;
      commandes_en_attente: number;
    };
    dernieres_activites: {
      utilisateurs: Array<{
        _id: string;
        email: string;
        nom: string;
        prenom: string;
        role: {
          _id: string;
          nom_role: string;
        };
        date_creation: string;
        date_derniere_connexion?: string;
      }>;
      boutiques: Array<{
        _id: string;
        nom: string;
        categorie: {
          _id: string;
          nom_categorie: string;
        };
        date_creation: string;
      }>;
    };
  };
}