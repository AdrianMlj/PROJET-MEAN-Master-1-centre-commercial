import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PanierService } from '../../../../core/services/panier.service';

@Component({
  selector: 'app-acheteur-sidebar',
  templateUrl: './acheteur-sidebar.component.html',
  styleUrls: ['./acheteur-sidebar.component.css'],
  standalone: false
})
export class AcheteurSidebarComponent implements OnInit {
  isCollapsed = false;
  isMobileMenuOpen = false;
  menuOpen: { [key: string]: boolean } = {
    boutique: true,
    compte: true
  };
  cartCount = 0;

  constructor(
    private authService: AuthService,
    private panierService: PanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    
    this.panierService.nombreArticles$.subscribe(count => {
      this.cartCount = count;
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
    const user = this.authService.getCurrentUser();
    return user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Acheteur' : 'Acheteur';
  }
}
