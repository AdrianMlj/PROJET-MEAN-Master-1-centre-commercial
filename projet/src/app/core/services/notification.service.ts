import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationListResponse, NotificationCountResponse } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationListResponse> {
    return this.http.get<NotificationListResponse>(this.apiUrl);
  }

  getNonLues(): Observable<NotificationCountResponse> {
    return this.http.get<NotificationCountResponse>(`${this.apiUrl}/non-lues`);
  }

  marquerCommeLue(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/lu`, {});
  }

  marquerToutesLues(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/lu-toutes`, {});
  }
}