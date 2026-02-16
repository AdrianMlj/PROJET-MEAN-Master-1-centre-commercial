import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PanierService } from '../../../core/services/panier.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: false
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isMenuOpen = false;
  cartCount = 0;

  constructor(
    private authService: AuthService,
    private panierService: PanierService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.panierService.nombreArticles$.subscribe(count => {
      this.cartCount = count;
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  getDashboardLink(): string {
    if (!this.currentUser) return '/';

    switch (this.currentUser.role) {
      case 'admin_centre':
        return '/admin/dashboard';
      case 'boutique':
        return '/boutique/dashboard';
      case 'acheteur':
        return '/acheteur/dashboard';
      default:
        return '/';
    }
  }

  getDashboardTitle(): string {
    if (!this.currentUser) return 'Dashboard';

    switch (this.currentUser.role) {
      case 'admin_centre':
        return 'Dashboard Admin';
      case 'boutique':
        return 'Dashboard Boutique';
      case 'acheteur':
        return 'Dashboard Acheteur';
      default:
        return 'Dashboard';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}