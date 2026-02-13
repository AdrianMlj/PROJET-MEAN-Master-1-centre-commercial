import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  CategorieBoutique, 
  CreerCategorieRequest, 
  ModifierCategorieRequest,
  CategorieResponse 
} from '../models/categorie-boutique.model';

@Injectable({
  providedIn: 'root'
})
export class CategorieBoutiqueService {
  private apiUrl = `${environment.apiUrl}/categories-boutique`;

  constructor(private http: HttpClient) { }

  // Admin: Lister toutes les catégories (avec inactives)
  listerToutesCategories(): Observable<CategorieResponse> {
    return this.http.get<CategorieResponse>(`${this.apiUrl}/admin/toutes`);
  }

  // Admin: Créer une catégorie
  creerCategorie(data: CreerCategorieRequest): Observable<CategorieResponse> {
    return this.http.post<CategorieResponse>(this.apiUrl, data);
  }

  // Admin: Modifier une catégorie
  modifierCategorie(id: string, data: ModifierCategorieRequest): Observable<CategorieResponse> {
    return this.http.put<CategorieResponse>(`${this.apiUrl}/${id}`, data);
  }

  // Admin: Supprimer une catégorie
  supprimerCategorie(id: string): Observable<CategorieResponse> {
    return this.http.delete<CategorieResponse>(`${this.apiUrl}/${id}`);
  }

  // Admin: Obtenir une catégorie par ID
  obtenirCategorie(id: string): Observable<CategorieResponse> {
    return this.http.get<CategorieResponse>(`${this.apiUrl}/${id}`);
  }

  // ✅ NOUVEAU : Vérifier si un nom de catégorie existe déjà
  verifierNomExistant(nom: string, excludeId?: string): Observable<boolean> {
    // Récupère toutes les catégories et vérifie côté client
    return this.listerToutesCategories().pipe(
      map(response => {
        if (!response.categories || !nom || nom.trim().length < 2) return false;
        
        // Normaliser le nom pour la comparaison (insensible à la casse, sans espaces superflus)
        const nomNormalise = nom.trim().toLowerCase();
        
        return response.categories.some(cat => {
          // Exclure la catégorie actuelle si on est en modification
          if (excludeId && cat._id === excludeId) return false;
          
          const catNomNormalise = cat.nom_categorie.trim().toLowerCase();
          return catNomNormalise === nomNormalise;
        });
      })
    );
  }
}