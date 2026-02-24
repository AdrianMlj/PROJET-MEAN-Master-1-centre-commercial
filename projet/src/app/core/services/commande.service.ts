import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommandeListResponse, CommandeResponse, UpdateStatutRequest } from '../models/commande.model';

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private apiUrl = `${environment.apiUrl}/commandes`;

  constructor(private http: HttpClient) {}

  listerCommandes(params?: { page?: number; limit?: number; statut?: string }): Observable<CommandeListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
      if (params.statut) httpParams = httpParams.set('statut', params.statut);
    }
    return this.http.get<CommandeListResponse>(`${this.apiUrl}/boutique/mes-commandes`, { params: httpParams });
  }

  getCommande(id: string): Observable<CommandeResponse> {
    return this.http.get<CommandeResponse>(`${this.apiUrl}/${id}`);
  }

  updateStatut(id: string, data: UpdateStatutRequest): Observable<CommandeResponse> {
    return this.http.put<CommandeResponse>(`${this.apiUrl}/${id}/statut`, data);
  }

  getFacture(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/facture`, { responseType: 'blob' });
  }
}