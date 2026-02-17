import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GerantsDisponiblesResponse, GerantSearchParams } from '../models/utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private apiUrl = `${environment.apiUrl}/utilisateurs`;

  constructor(private http: HttpClient) { }

  // Récupérer les gérants disponibles (sans boutique)
  getGerantsDisponibles(params?: GerantSearchParams): Observable<GerantsDisponiblesResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.recherche) httpParams = httpParams.set('recherche', params.recherche);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<GerantsDisponiblesResponse>(`${this.apiUrl}/gerants-disponibles`, { params: httpParams });
  }
}