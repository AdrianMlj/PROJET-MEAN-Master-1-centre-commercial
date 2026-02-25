import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationResponse, MarquerLuResponse } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  obtenirMesNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(this.apiUrl);
  }

  obtenirNonLues(): Observable<{ success: boolean; count: number }> {
    return this.http.get<{ success: boolean; count: number }>(`${this.apiUrl}/non-lues`);
  }

  marquerCommeLue(id: string): Observable<MarquerLuResponse> {
    return this.http.patch<MarquerLuResponse>(`${this.apiUrl}/${id}/lu`, {});
  }

  marquerToutesLues(): Observable<MarquerLuResponse> {
    return this.http.patch<MarquerLuResponse>(`${this.apiUrl}/lu-toutes`, {});
  }

  supprimerNotification(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
