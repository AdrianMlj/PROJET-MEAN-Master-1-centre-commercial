import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Boutique, 
  BoutiqueListResponse, 
  BoutiqueResponse,
  CreerBoutiqueRequest,
  ModifierBoutiqueRequest
} from '../models/boutique.model';

@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = `${environment.apiUrl}/boutiques`;

  constructor(private http: HttpClient) { }

  // Admin: Lister toutes les boutiques avec filtres
  listerToutesBoutiques(params?: {
    page?: number;
    limit?: number;
    tri?: string;
    recherche?: string;
    categorie?: string;
    statut?: string;
    statut_paiement?: string;
  }): Observable<BoutiqueListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.tri) httpParams = httpParams.set('tri', params.tri);
      if (params.recherche) httpParams = httpParams.set('recherche', params.recherche);
      if (params.categorie) httpParams = httpParams.set('categorie', params.categorie);
      if (params.statut) httpParams = httpParams.set('statut', params.statut);
      if (params.statut_paiement) httpParams = httpParams.set('statut_paiement', params.statut_paiement);
    }

    return this.http.get<BoutiqueListResponse>(`${this.apiUrl}/admin/toutes`, { params: httpParams });
  }

  // Admin: Créer une boutique
  creerBoutique(data: CreerBoutiqueRequest): Observable<BoutiqueResponse> {
    return this.http.post<BoutiqueResponse>(this.apiUrl, data);
  }

  // Admin: Obtenir une boutique par ID
  obtenirBoutique(id: string): Observable<BoutiqueResponse> {
    return this.http.get<BoutiqueResponse>(`${this.apiUrl}/admin/${id}`);
  }

  // Admin: Modifier une boutique
  modifierBoutique(id: string, data: ModifierBoutiqueRequest): Observable<BoutiqueResponse> {
    return this.http.put<BoutiqueResponse>(`${this.apiUrl}/${id}`, data);
  }

  // Admin: Activer/désactiver une boutique
  toggleActivationBoutique(id: string): Observable<BoutiqueResponse> {
    return this.http.put<BoutiqueResponse>(`${this.apiUrl}/${id}/toggle-activation`, {});
  }

  // Admin: Supprimer une boutique
  supprimerBoutique(id: string): Observable<BoutiqueResponse> {
    return this.http.delete<BoutiqueResponse>(`${this.apiUrl}/admin/${id}`);
  }

  // Admin: Obtenir la boutique du gérant connecté
  getMaBoutique(): Observable<BoutiqueResponse> {
    return this.http.get<BoutiqueResponse>(`${this.apiUrl}/gerant/mon-boutique`);
  }

  getStatistiques(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/statistiques/boutique`);
  }

  // ✅ NOUVELLE MÉTHODE – Modifier le profil de la boutique (gérant)
  modifierProfilBoutique(data: any): Observable<BoutiqueResponse> {
    return this.http.put<BoutiqueResponse>(`${this.apiUrl}/gerant/mon-profil`, data);
  }

  // ✅ NOUVELLE MÉTHODE – Uploader le logo
  uploadLogo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.put<any>(`${this.apiUrl}/gerant/logo`, formData);
  }

  // ✅ NOUVELLE MÉTHODE – Uploader plusieurs images
  uploadImages(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/gerant/images`, formData);
  }

  // ✅ NOUVELLE MÉTHODE – Récupérer les images de la galerie
  getImages(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/gerant/images`);
  }

  // ✅ NOUVELLE MÉTHODE – Supprimer une image de la galerie
  supprimerImage(index: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/gerant/images/${index}`);
  }
}