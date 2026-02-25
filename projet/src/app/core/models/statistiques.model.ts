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
    // ✅ Correction : adaptation à la structure réelle de l'API
    evolutionCA: Array<{
      _id: string;              // Date au format YYYY-MM-DD
      chiffreAffaires: number;   // Montant du CA pour cette période
      nombreCommandes?: number;  // Optionnel
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