import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoutiqueListResponse, BoutiqueDetailResponse, BoutiqueFilters } from '../models/boutique.model';
import { ProduitListResponse, ProduitFilters } from '../models/produit.model';

@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = `${environment.apiUrl}/boutiques`;

  constructor(private http: HttpClient) {}

  listerBoutiques(filters?: BoutiqueFilters): Observable<BoutiqueListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.categorie) params = params.set('categorie', filters.categorie);
      if (filters.est_active !== undefined) params = params.set('est_active', filters.est_active.toString());
      if (filters.recherche) params = params.set('recherche', filters.recherche);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.tri) params = params.set('tri', filters.tri);
    }

    return this.http.get<BoutiqueListResponse>(this.apiUrl, { params });
  }

  obtenirBoutique(id: string): Observable<BoutiqueDetailResponse> {
    return this.http.get<BoutiqueDetailResponse>(`${this.apiUrl}/${id}`);
  }

  obtenirProduitsBoutique(boutiqueId: string, filters?: ProduitFilters): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.categorie) params = params.set('categorie', filters.categorie);
      if (filters.en_promotion !== undefined) params = params.set('en_promotion', filters.en_promotion.toString());
      if (filters.min_prix !== undefined) params = params.set('min_prix', filters.min_prix.toString());
      if (filters.max_prix !== undefined) params = params.set('max_prix', filters.max_prix.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.tri) params = params.set('tri', filters.tri);
    }

    return this.http.get<any>(`${this.apiUrl}/${boutiqueId}/produits`, { params });
  }

  rechercherBoutiques(terme: string, page: number = 1, limit: number = 10): Observable<BoutiqueListResponse> {
    return this.listerBoutiques({ recherche: terme, page, limit });
  }
}
