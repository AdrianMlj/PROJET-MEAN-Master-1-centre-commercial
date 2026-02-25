import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/auth.model';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
  standalone: false
})
export class AdminSidebarComponent implements OnInit {
  isCollapsed = false;
  isMobileMenuOpen = false;
  notificationCount = 0;
  menuOpen: { [key: string]: boolean } = {
    gestionBoutiques: true,
    categories: true,
    boutiques: true,
    gestionUtilisateurs: true
  };
  
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadNotificationsCount();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    const width = window.innerWidth;
    if (width <= 768) {
      this.isCollapsed = true;
      this.isMobileMenuOpen = false;
    }
  }

  toggleMenu(menu: string): void {
    this.menuOpen[menu] = !this.menuOpen[menu];
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getCurrentAdminName(): string {
    return this.currentUser ? 
      `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || 'Administrateur' : 
      'Administrateur';
  }

  // ✅ Nouvelle méthode pour obtenir l'URL complète de l'avatar
  getAvatarUrl(): string {
    if (!this.currentUser || !this.currentUser.avatar_url) {
      return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';
    }
    
    // Si l'URL est déjà complète
    if (this.currentUser.avatar_url.startsWith('http')) {
      return this.currentUser.avatar_url;
    }
    
    // Construire l'URL complète vers le backend
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${this.currentUser.avatar_url}`;
  }

  // ✅ Gestion d'erreur de chargement d'avatar
  onAvatarError(event: any): void {
    event.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';
  }

  loadNotificationsCount(): void { // ← NOUVELLE MÉTHODE
    this.notificationService.getNonLues().subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationCount = response.count;
        }
      },
      error: (err) => console.error('Erreur chargement notifications', err)
    });
  }
}