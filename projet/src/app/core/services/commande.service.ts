import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  CommandeListResponse, 
  CommandeDetailResponse, 
  CommandeHistoriqueResponse,
  PasserCommandeRequest, 
  PasserCommandeResponse,
  CommandeFilters 
} from '../models/commande.model';

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private apiUrl = `${environment.apiUrl}/commandes`;

  constructor(private http: HttpClient) {}

  passerCommande(data: PasserCommandeRequest): Observable<PasserCommandeResponse> {
    return this.http.post<PasserCommandeResponse>(this.apiUrl, data);
  }

  obtenirMesCommandes(filters?: CommandeFilters): Observable<CommandeListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
    }

    return this.http.get<CommandeListResponse>(`${this.apiUrl}/mes-commandes`, { params });
  }

  obtenirDetailCommande(id: string): Observable<CommandeDetailResponse> {
    return this.http.get<CommandeDetailResponse>(`${this.apiUrl}/${id}`);
  }

  obtenirHistoriqueStatuts(id: string): Observable<CommandeHistoriqueResponse> {
    return this.http.get<CommandeHistoriqueResponse>(`${this.apiUrl}/${id}/historique`);
  }

  annulerCommande(id: string): Observable<{ success: boolean; message: string; commande: any }> {
    return this.http.put<{ success: boolean; message: string; commande: any }>(`${this.apiUrl}/${id}/annuler`, {});
  }

  payerCommande(id: string, methodePaiement: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/payer`, { methode_paiement: methodePaiement });
  }
}
