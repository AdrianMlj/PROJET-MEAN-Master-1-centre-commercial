import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-acheteur-dashboard',
  templateUrl: './acheteur-dashboard.component.html',
  styleUrls: ['./acheteur-dashboard.component.css'],
  standalone: false
})
export class AcheteurDashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats = {
    commandes: 0,
    favoris: 0,
    notifications: 0,
    panier: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats(): void {
    // Simulation de données
    this.stats = {
      commandes: 5,
      favoris: 12,
      notifications: 3,
      panier: 2
    };
  }
}