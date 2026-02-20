import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  User, 
  UserListResponse, 
  UserResponse,
  CreerUserBoutiqueRequest,
  UserSearchParams
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/utilisateurs`;

  constructor(private http: HttpClient) { }

  // Admin: Lister tous les utilisateurs avec pagination et filtres
  listerUtilisateurs(params?: UserSearchParams): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.recherche) httpParams = httpParams.set('recherche', params.recherche);
      if (params.role) httpParams = httpParams.set('role', params.role);
      if (params.statut) httpParams = httpParams.set('statut', params.statut);
    }

    return this.http.get<UserListResponse>(this.apiUrl, { params: httpParams });
  }

  // Admin: Créer un nouvel utilisateur (boutique)
  creerUtilisateurBoutique(data: CreerUserBoutiqueRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, data);
  }

  // Admin: Activer/désactiver un utilisateur
  toggleActivationUser(id: string): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}/toggle-activation`, {});
  }

  // Admin: Supprimer un utilisateur
  supprimerUser(id: string): Observable<UserResponse> {
    return this.http.delete<UserResponse>(`${this.apiUrl}/${id}`);
  }

  // Admin: Obtenir un utilisateur par ID
  obtenirUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }
}