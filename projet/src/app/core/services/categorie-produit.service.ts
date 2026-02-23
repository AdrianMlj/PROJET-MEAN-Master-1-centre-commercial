import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategorieProduit,
  CategorieProduitResponse,
  CreerCategorieProduitRequest,
  ModifierCategorieProduitRequest
} from '../models/categorie-produit.model';

@Injectable({
  providedIn: 'root'
})
export class CategorieProduitService {
  private apiUrl = `${environment.apiUrl}/categories-produit`;

  constructor(private http: HttpClient) {}

  // Lister les catégories de la boutique du gérant connecté
  listerCategories(): Observable<CategorieProduitResponse> {
    return this.http.get<CategorieProduitResponse>(this.apiUrl);
  }

  // Créer une catégorie
  creerCategorie(data: CreerCategorieProduitRequest): Observable<CategorieProduitResponse> {
    return this.http.post<CategorieProduitResponse>(this.apiUrl, data);
  }

  // Obtenir une catégorie par ID
  obtenirCategorie(id: string): Observable<CategorieProduitResponse> {
    return this.http.get<CategorieProduitResponse>(`${this.apiUrl}/${id}`);
  }

  // Modifier une catégorie
  modifierCategorie(id: string, data: ModifierCategorieProduitRequest): Observable<CategorieProduitResponse> {
    return this.http.put<CategorieProduitResponse>(`${this.apiUrl}/${id}`, data);
  }

  // Supprimer une catégorie
  supprimerCategorie(id: string): Observable<CategorieProduitResponse> {
    return this.http.delete<CategorieProduitResponse>(`${this.apiUrl}/${id}`);
  }

  // Vérifier si un nom de catégorie existe déjà (pour validation en temps réel)
  verifierNomExistant(nom: string, excludeId?: string): Observable<boolean> {
    // On utilise listerCategories pour obtenir toutes les catégories de la boutique
    return new Observable(observer => {
      this.listerCategories().subscribe({
        next: (response) => {
          if (response.success && response.categories) {
            const nomNormalise = nom.trim().toLowerCase();
            const existe = response.categories.some(cat => {
              if (excludeId && cat._id === excludeId) return false;
              return cat.nom_categorie.trim().toLowerCase() === nomNormalise;
            });
            observer.next(existe);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
}