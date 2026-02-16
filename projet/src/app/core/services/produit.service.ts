import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProduitListResponse, ProduitDetailResponse, ProduitFilters } from '../models/produit.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = `${environment.apiUrl}/produits`;

  constructor(private http: HttpClient) {}

  listerProduits(filters?: ProduitFilters): Observable<ProduitListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.boutique) params = params.set('boutique', filters.boutique);
      if (filters.categorie) params = params.set('categorie', filters.categorie);
      if (filters.min_prix !== undefined) params = params.set('min_prix', filters.min_prix.toString());
      if (filters.max_prix !== undefined) params = params.set('max_prix', filters.max_prix.toString());
      if (filters.en_promotion !== undefined) params = params.set('en_promotion', filters.en_promotion.toString());
      if (filters.recherche) params = params.set('recherche', filters.recherche);
      if (filters.tags) params = params.set('tags', filters.tags);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.tri) params = params.set('tri', filters.tri);
    }

    return this.http.get<ProduitListResponse>(this.apiUrl, { params });
  }

  obtenirProduit(id: string): Observable<ProduitDetailResponse> {
    return this.http.get<ProduitDetailResponse>(`${this.apiUrl}/${id}`);
  }

  rechercherProduits(terme: string, page: number = 1, limit: number = 20): Observable<ProduitListResponse> {
    return this.listerProduits({ recherche: terme, page, limit });
  }

  obtenirProduitsEnPromotion(page: number = 1, limit: number = 20): Observable<ProduitListResponse> {
    return this.listerProduits({ en_promotion: true, page, limit, tri: 'promotion' });
  }

  obtenirNouveautes(page: number = 1, limit: number = 20): Observable<ProduitListResponse> {
    return this.listerProduits({ page, limit, tri: 'nouveautes' });
  }

  obtenirMeilleuresVentes(page: number = 1, limit: number = 20): Observable<ProduitListResponse> {
    return this.listerProduits({ page, limit, tri: 'ventes' });
  }
}
