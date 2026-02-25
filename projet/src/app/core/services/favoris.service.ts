import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FavorisMutationResponse,
  FavorisResponse,
  VerifierFavoriResponse
} from '../models/favoris.model';

@Injectable({
  providedIn: 'root'
})
export class FavorisService {
  private apiUrl = `${environment.apiUrl}/favoris`;

  constructor(private http: HttpClient) {}

  obtenirFavoris(): Observable<FavorisResponse> {
    return this.http.get<FavorisResponse>(this.apiUrl);
  }

  ajouterProduit(produitId: string): Observable<FavorisMutationResponse> {
    return this.http.post<FavorisMutationResponse>(`${this.apiUrl}/produit`, { produitId });
  }

  retirerProduit(produitId: string): Observable<FavorisMutationResponse> {
    return this.http.delete<FavorisMutationResponse>(`${this.apiUrl}/produit/${produitId}`);
  }

  verifierProduit(produitId: string): Observable<VerifierFavoriResponse> {
    return this.http.get<VerifierFavoriResponse>(`${this.apiUrl}/produit/${produitId}/verifier`);
  }

  ajouterBoutique(boutiqueId: string): Observable<FavorisMutationResponse> {
    return this.http.post<FavorisMutationResponse>(`${this.apiUrl}/boutique`, { boutiqueId });
  }

  retirerBoutique(boutiqueId: string): Observable<FavorisMutationResponse> {
    return this.http.delete<FavorisMutationResponse>(`${this.apiUrl}/boutique/${boutiqueId}`);
  }

  verifierBoutique(boutiqueId: string): Observable<VerifierFavoriResponse> {
    return this.http.get<VerifierFavoriResponse>(`${this.apiUrl}/boutique/${boutiqueId}/verifier`);
  }
}
