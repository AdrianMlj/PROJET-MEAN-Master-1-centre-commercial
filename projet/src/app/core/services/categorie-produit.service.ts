import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategorieProduit, CategorieProduitResponse } from '../models/categorie-produit.model';

@Injectable({
  providedIn: 'root'
})
export class CategorieProduitService {
  private apiUrl = `${environment.apiUrl}/categories-produit`;

  constructor(private http: HttpClient) { }

  // Public: Get all product categories for a specific boutique (no auth required)
  listerCategoriesBoutique(boutiqueId: string): Observable<CategorieProduitResponse> {
    return this.http.get<CategorieProduitResponse>(`${this.apiUrl}/boutique/${boutiqueId}`);
  }

  // Get all categories for a boutique that are active
  listerCategoriesActives(boutiqueId: string): Observable<CategorieProduitResponse> {
    return this.http.get<CategorieProduitResponse>(`${this.apiUrl}/boutique/${boutiqueId}/actives`);
  }
}
