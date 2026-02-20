import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatistiquesGlobales } from '../models/statistiques.model';

@Injectable({
  providedIn: 'root'
})
export class StatistiquesService {
  private apiUrl = `${environment.apiUrl}/statistiques`;

  constructor(private http: HttpClient) { }

  getStatistiquesGlobales(): Observable<StatistiquesGlobales> {
    return this.http.get<StatistiquesGlobales>(`${this.apiUrl}/globales`);
  }
}