import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  PanierResponse, 
  PanierTotalResponse, 
  AjouterPanierRequest, 
  ModifierQuantiteRequest 
} from '../models/panier.model';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private apiUrl = `${environment.apiUrl}/panier`;
  private nombreArticlesSubject = new BehaviorSubject<number>(0);
  public nombreArticles$ = this.nombreArticlesSubject.asObservable();

  constructor(private http: HttpClient) {}

  obtenirPanier(): Observable<PanierResponse> {
    return this.http.get<PanierResponse>(this.apiUrl).pipe(
      tap(response => {
        if (response.success) {
          this.nombreArticlesSubject.next(response.nombre_articles);
        }
      })
    );
  }

  obtenirNombreArticles(): Observable<{ success: boolean; nombre_articles: number }> {
    return this.http.get<{ success: boolean; nombre_articles: number }>(`${this.apiUrl}/nombre-articles`).pipe(
      tap(response => {
        if (response.success) {
          this.nombreArticlesSubject.next(response.nombre_articles);
        }
      })
    );
  }

  ajouterAuPanier(data: AjouterPanierRequest): Observable<PanierResponse> {
    return this.http.post<PanierResponse>(`${this.apiUrl}/ajouter`, data).pipe(
      tap(response => {
        if (response.success) {
          this.nombreArticlesSubject.next(response.nombre_articles);
        }
      })
    );
  }

  modifierQuantite(elementId: string, data: ModifierQuantiteRequest): Observable<PanierResponse> {
    return this.http.put<PanierResponse>(`${this.apiUrl}/modifier-quantite/${elementId}`, data).pipe(
      tap(response => {
        if (response.success) {
          this.nombreArticlesSubject.next(response.nombre_articles);
        }
      })
    );
  }

  retirerDuPanier(elementId: string): Observable<PanierResponse> {
    return this.http.delete<PanierResponse>(`${this.apiUrl}/retirer/${elementId}`).pipe(
      tap(response => {
        if (response.success) {
          this.nombreArticlesSubject.next(response.nombre_articles);
        }
      })
    );
  }

  viderPanier(): Observable<PanierResponse> {
    return this.http.delete<PanierResponse>(`${this.apiUrl}/vider`).pipe(
      tap(response => {
        if (response.success) {
          this.nombreArticlesSubject.next(0);
        }
      })
    );
  }

  calculerTotal(): Observable<PanierTotalResponse> {
    return this.http.get<PanierTotalResponse>(`${this.apiUrl}/calculer-total`);
  }

  resetNombreArticles(): void {
    this.nombreArticlesSubject.next(0);
  }

  updateNombreArticles(count: number): void {
    this.nombreArticlesSubject.next(count);
  }
}
