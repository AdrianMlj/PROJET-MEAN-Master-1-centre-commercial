import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BoutiqueService } from '../../../../core/services/boutique.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../core/models/auth.model';
import { Boutique } from '../../../../core/models/boutique.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-boutique-sidebar',
  templateUrl: './boutique-sidebar.component.html',
  styleUrls: ['./boutique-sidebar.component.css'],
  standalone: false
})
export class BoutiqueSidebarComponent implements OnInit {
  isCollapsed = false;
  isMobileMenuOpen = false;
  currentUser: User | null = null;
  maBoutique: Boutique | null = null;
  loading = true;
  boutiqueEstActive = true;
  notificationCount = 0;

  menuOpen: { [key: string]: boolean } = {
    gestionProduits: true,
    categories: true,
    produits: true
  };

  constructor(
    private authService: AuthService,
    private boutiqueService: BoutiqueService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadMaBoutique();
    this.loadNotificationsCount();
  }

  loadMaBoutique(): void {
    this.boutiqueService.getMaBoutique().subscribe({
      next: (response) => {
        if (response.success && response.boutique) {
          this.maBoutique = response.boutique;
          this.boutiqueEstActive = response.boutique.est_active;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement boutique:', error);
        this.loading = false;
      }
    });
  }

  loadNotificationsCount(): void {
    this.notificationService.getNonLues().subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationCount = response.count;
        }
      },
      error: (err) => console.error('Erreur chargement notifications', err)
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

  getCurrentUserName(): string {
    return this.currentUser ? 
      `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || 'Gérant' : 
      'Gérant';
  }

  getAvatarUrl(): string {
    // Si pas d'utilisateur ou pas d'avatar, retourner l'image par défaut
    if (!this.currentUser || !this.currentUser.avatar_url) {
      return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';
    }
    
    return this.currentUser.avatar_url;
  }


  // ✅ MODIFIÉ: Méthode simplifiée pour le logo Cloudinary
  getBoutiqueLogoUrl(): string {
    // Si pas de boutique ou pas de logo, retourner l'image par défaut
    if (!this.maBoutique || !this.maBoutique.logo_url) {
      return 'https://www.legrand.es/modules/custom/legrand_ecat/assets/img/no-image.png';
    }
    return this.maBoutique.logo_url;
  }

  getCategorieName(): string {
    if (!this.maBoutique || !this.maBoutique.categorie) return '';
    
    if (typeof this.maBoutique.categorie === 'object' && this.maBoutique.categorie.nom_categorie) {
      return this.maBoutique.categorie.nom_categorie;
    }
    return '';
  }

  onAvatarError(event: any): void {
    event.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';
  }

  onLogoError(event: any): void {
    event.target.src = 'https://www.legrand.es/modules/custom/legrand_ecat/assets/img/no-image.png';
  }
}