import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Produit,
  ProduitListResponse,
  ProduitResponse,
  CreerProduitRequest,
  ModifierProduitRequest
} from '../models/produit.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = `${environment.apiUrl}/produits`;

  constructor(private http: HttpClient) {}

  // Lister les produits de la boutique du gérant
  listerProduits(params?: {
    page?: number;
    limit?: number;
    tri?: string;
  }): Observable<ProduitListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
      if (params.tri) httpParams = httpParams.set('tri', params.tri);
    }
    return this.http.get<ProduitListResponse>(`${this.apiUrl}/gerant/mes-produits`, { params: httpParams });
  }

  // Créer un produit
  creerProduit(data: CreerProduitRequest): Observable<ProduitResponse> {
    return this.http.post<ProduitResponse>(this.apiUrl, data);
  }

  // Obtenir un produit par ID
  obtenirProduit(id: string): Observable<ProduitResponse> {
    return this.http.get<ProduitResponse>(`${this.apiUrl}/${id}`);
  }

  // Modifier un produit
  modifierProduit(id: string, data: ModifierProduitRequest): Observable<ProduitResponse> {
    return this.http.put<ProduitResponse>(`${this.apiUrl}/${id}`, data);
  }

  // Activer/désactiver un produit
  toggleActivationProduit(id: string): Observable<ProduitResponse> {
    return this.http.patch<ProduitResponse>(`${this.apiUrl}/${id}/toggle-activation`, {});
  }

  // Supprimer un produit
  supprimerProduit(id: string): Observable<ProduitResponse> {
    return this.http.delete<ProduitResponse>(`${this.apiUrl}/${id}`);
  }

  // Upload d'image(s) pour un produit
  uploadImages(produitId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${produitId}/images`, formData);
  }

  // Supprimer une image d'un produit
  supprimerImage(produitId: string, imageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${produitId}/images/${imageId}`);
  }
}