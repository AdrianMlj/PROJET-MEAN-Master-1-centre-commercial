export interface Gerant {
  _id: string;
  email: string;
  nom: string;
  prenom?: string;
  telephone?: string;
}

export interface GerantsDisponiblesResponse {
  success: boolean;
  gerants: Gerant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GerantSearchParams {
  recherche?: string;
  page?: number;
  limit?: number;
}