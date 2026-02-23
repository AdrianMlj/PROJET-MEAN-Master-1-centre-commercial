import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaiementRequest {
  methode_paiement: string; // "carte" ou autre
}

export interface PaiementResponse {
  success: boolean;
  message?: string;
  boutique?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiUrl = `${environment.apiUrl}/boutiques/gerant`;

  constructor(private http: HttpClient) {}

  payerLocation(data: PaiementRequest): Observable<PaiementResponse> {
    return this.http.post<PaiementResponse>(`${this.apiUrl}/payer`, data);
  }
}