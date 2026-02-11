import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats = {
    utilisateurs: 0,
    boutiques: 0,
    produits: 0,
    revenus: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats(): void {
    // Simulation de données
    this.stats = {
      utilisateurs: 156,
      boutiques: 42,
      produits: 1200,
      revenus: 250000
    };
  }
}