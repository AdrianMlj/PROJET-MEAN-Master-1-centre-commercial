import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AjouterAvisBoutiqueRequest,
  AjouterAvisProduitRequest,
  AjouterAvisResponse,
  AimerAvisResponse,
  AvisBoutiqueResponse,
  AvisProduitResponse
} from '../models/avis.model';

@Injectable({
  providedIn: 'root'
})
export class AvisService {
  private apiUrl = `${environment.apiUrl}/avis`;

  constructor(private http: HttpClient) {}

  obtenirAvisProduit(
    produitId: string,
    query?: { page?: number; limit?: number; note?: number; tri?: string }
  ): Observable<AvisProduitResponse> {
    let params = new HttpParams();

    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.limit) params = params.set('limit', query.limit.toString());
    if (query?.note) params = params.set('note', query.note.toString());
    if (query?.tri) params = params.set('tri', query.tri);

    return this.http.get<AvisProduitResponse>(`${this.apiUrl}/produit/${produitId}`, { params });
  }

  obtenirAvisBoutique(
    boutiqueId: string,
    query?: { page?: number; limit?: number; note?: number; tri?: string }
  ): Observable<AvisBoutiqueResponse> {
    let params = new HttpParams();

    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.limit) params = params.set('limit', query.limit.toString());
    if (query?.note) params = params.set('note', query.note.toString());
    if (query?.tri) params = params.set('tri', query.tri);

    return this.http.get<AvisBoutiqueResponse>(`${this.apiUrl}/boutique/${boutiqueId}`, { params });
  }

  ajouterAvisProduit(payload: AjouterAvisProduitRequest): Observable<AjouterAvisResponse> {
    return this.http.post<AjouterAvisResponse>(`${this.apiUrl}/produit`, payload);
  }

  ajouterAvisBoutique(payload: AjouterAvisBoutiqueRequest): Observable<AjouterAvisResponse> {
    return this.http.post<AjouterAvisResponse>(`${this.apiUrl}/boutique`, payload);
  }

  aimerAvis(avisId: string): Observable<AimerAvisResponse> {
    return this.http.post<AimerAvisResponse>(`${this.apiUrl}/${avisId}/aimer`, {});
  }
}
