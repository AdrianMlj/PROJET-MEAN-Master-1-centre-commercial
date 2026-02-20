export interface StatistiquesGlobales {
  success: boolean;
  statistiques: {
    totalBoutiques: number;
    boutiquesActives: number;
    totalAcheteurs: number;
    totalCommandes: number;
    commandesCeMois: number;
    commandesCetteSemaine: number;
    chiffreAffairesTotal: number;
    chiffreAffairesMois: number;
    boutiquePlusActive: null | {
      _id: string;
      nom: string;
      commandes: number;
    };
    produitsPlusVendus: Array<{
      _id: string;
      nom: string;
      totalVendu: number;
    }>;
    evolutionCA: Array<{
      mois: string;
      annee: number;
      total: number;
    }>;
    statistiquesPaiements: Array<{
      _id: string;
      count: number;
      total: number;
    }>;
    repartitionStatuts: Array<{
      _id: string;
      count: number;
    }>;
  };
}