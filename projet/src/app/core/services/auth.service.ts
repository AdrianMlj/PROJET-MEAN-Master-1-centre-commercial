import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, User } from '../models/auth.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    this.loadCurrentUser();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/connexion`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.tokenService.saveToken(response.token);
            this.currentUserSubject.next(response.utilisateur);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/inscription`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.tokenService.saveToken(response.token);
            this.currentUserSubject.next(response.utilisateur);
          }
        })
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.role : null;
  }

  isLoggedIn(): boolean {
    return this.tokenService.getToken() !== null;
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/profil`);
  }

  private loadCurrentUser(): void {
    const token = this.tokenService.getToken();
    if (token) {
      const payload = this.tokenService.decodeToken(token);
      if (payload) {
        const user: User = {
          id: payload.id,
          email: payload.email,
          nom: payload.nom,
          prenom: payload.prenom,
          role: payload.role as any,
          boutique_associee: payload.boutiqueId,
          est_actif: true
        };
        this.currentUserSubject.next(user);
      }
    }
  }
}